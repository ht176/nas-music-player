<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'

export type VisualizerMode = 'aurora-mirror' | 'cyber-wave' | 'ambient-ring'

const props = withDefaults(
  defineProps<{
    mode?: VisualizerMode
  }>(),
  {
    mode: 'cyber-wave',
  }
)

const playerStore = usePlayerStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

// 48 个采样点与弹性阻尼数组
const barCount = 42
const smoothedHeights = new Float32Array(barCount)
const peakHeights = new Float32Array(barCount)

// 贝塞尔声波曲线平滑控制点 (用于 cyber-wave 模式)
const wavePoints = new Float32Array(barCount)

let flowPhase = 0

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  const realData = audioService.getByteFrequencyData()
  const isWebAudioLive = realData && realData.some((v) => v > 0)
  const isPlaying = playerStore.isPlaying
  const volumeFactor = playerStore.volume ?? 0.8

  flowPhase += 0.04
  const centerY = height / 2
  const maxBarHalfHeight = height * 0.44

  // 计算每点采样与动态阻尼
  for (let i = 0; i < barCount; i++) {
    let targetVal = 0

    if (isPlaying && volumeFactor > 0.01) {
      if (isWebAudioLive && realData) {
        const n = realData.length
        // 人耳非线性对数频段采样映射 (低频集中)
        const sampleIdx = Math.floor(Math.pow(i / (barCount - 1), 1.7) * (n - 1))
        const rawVal = realData[sampleIdx] || 0
        const prevVal = sampleIdx > 0 ? realData[sampleIdx - 1] : rawVal
        const nextVal = sampleIdx < n - 1 ? realData[sampleIdx + 1] : rawVal
        const blended = (rawVal * 0.6 + (prevVal + nextVal) * 0.2) / 255
        const earCompensation = 1 + (i / barCount) * 0.35
        targetVal = Math.min(1, blended * earCompensation) * maxBarHalfHeight * volumeFactor
      } else {
        const t = (playerStore.currentTime || 0) * 4 + flowPhase
        const wave1 = Math.sin(t + i * 0.28) * 0.45 + 0.5
        const wave2 = Math.cos(t * 0.7 - i * 0.19) * 0.35 + 0.5
        const wave3 = Math.sin(t * 1.6 + i * 0.5) * 0.2 + 0.5
        const bell = Math.sin((i / (barCount - 1)) * Math.PI)
        const composite = (wave1 * 0.5 + wave2 * 0.35 + wave3 * 0.15) * (0.35 + bell * 0.65)
        targetVal = composite * maxBarHalfHeight * 0.88 * volumeFactor
      }
    } else {
      targetVal = 1.0
    }

    // 双向阻尼平滑插值 (上升 0.36，下降 0.12)
    const current = smoothedHeights[i]
    if (targetVal > current) {
      smoothedHeights[i] = current + (targetVal - current) * 0.36
    } else {
      smoothedHeights[i] = current + (targetVal - current) * 0.12
    }

    // 峰值回落衰减
    if (smoothedHeights[i] > peakHeights[i]) {
      peakHeights[i] = smoothedHeights[i]
    } else {
      peakHeights[i] = Math.max(1.0, peakHeights[i] - 0.5)
    }

    wavePoints[i] = smoothedHeights[i]
  }

  // 渲染模式分支
  if (props.mode === 'cyber-wave') {
    renderCyberWave(ctx, width, height, centerY)
  } else if (props.mode === 'ambient-ring') {
    renderAmbientRing(ctx, width, height, centerY)
  } else {
    renderAuroraMirror(ctx, width, height, centerY)
  }

  animId = requestAnimationFrame(render)
}

/**
 * 风格 1：网易云/Apple Music 赛博流体丝滑声波曲线 (Cyber Waveform)
 * 双层渐变极光曲线 + 贝塞尔平滑插值 + 粒子辉光
 */
function renderCyberWave(ctx: CanvasRenderingContext2D, width: number, _height: number, centerY: number) {
  const stepX = width / (barCount - 1)

  // 1. 绘制底层填充渐变区域 (上下对称声波羽化)
  const drawWavePath = (multiplier: number, alpha: number, colorStart: string, colorEnd: string) => {
    ctx.beginPath()
    // 上半部分曲线
    ctx.moveTo(0, centerY)
    for (let i = 0; i < barCount - 1; i++) {
      const x0 = i * stepX
      const y0 = centerY - wavePoints[i] * multiplier
      const x1 = (i + 1) * stepX
      const y1 = centerY - wavePoints[i + 1] * multiplier
      const midX = (x0 + x1) / 2
      const midY = (y0 + y1) / 2
      ctx.quadraticCurveTo(x0, y0, midX, midY)
    }
    ctx.lineTo(width, centerY - wavePoints[barCount - 1] * multiplier)

    // 下半部分镜面对称曲线
    for (let i = barCount - 1; i > 0; i--) {
      const x0 = i * stepX
      const y0 = centerY + wavePoints[i] * multiplier
      const x1 = (i - 1) * stepX
      const y1 = centerY + wavePoints[i - 1] * multiplier
      const midX = (x0 + x1) / 2
      const midY = (y0 + y1) / 2
      ctx.quadraticCurveTo(x0, y0, midX, midY)
    }
    ctx.closePath()

    const grad = ctx.createLinearGradient(0, 0, width, 0)
    grad.addColorStop(0, colorStart)
    grad.addColorStop(0.5, 'rgba(20, 184, 166, ' + alpha + ')')
    grad.addColorStop(1, colorEnd)

    ctx.fillStyle = grad
    ctx.fill()
  }

  // 绘制半透明辉光底层与核心高光层
  drawWavePath(1.15, 0.22, 'rgba(56, 189, 248, 0.15)', 'rgba(168, 85, 247, 0.15)')
  drawWavePath(0.9, 0.45, 'rgba(16, 185, 129, 0.45)', 'rgba(56, 189, 248, 0.45)')

  // 2. 绘制上下两条主动态霓虹发光线条
  const drawStrokeLine = (multiplier: number, lineWidth: number, strokeColor: string) => {
    ctx.beginPath()
    ctx.moveTo(0, centerY - wavePoints[0] * multiplier)
    for (let i = 0; i < barCount - 1; i++) {
      const x0 = i * stepX
      const y0 = centerY - wavePoints[i] * multiplier
      const x1 = (i + 1) * stepX
      const y1 = centerY - wavePoints[i + 1] * multiplier
      ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    }
    ctx.lineTo(width, centerY - wavePoints[barCount - 1] * multiplier)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }

  // 顶端高光线
  drawStrokeLine(1.0, 2.2, 'rgba(94, 234, 212, 0.95)')
  // 底端倒影线
  drawStrokeLine(-1.0, 1.6, 'rgba(56, 189, 248, 0.75)')

  // 3. 关键振幅节点发光水珠点
  for (let i = 2; i < barCount - 2; i += 3) {
    if (wavePoints[i] > 6) {
      const px = i * stepX
      const py = centerY - wavePoints[i]
      ctx.beginPath()
      ctx.arc(px, py, 2.2, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#10b981'
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }
}

/**
 * 风格 2：全息对称极光律动柱 (Aurora Mirror Bars)
 */
function renderAuroraMirror(ctx: CanvasRenderingContext2D, width: number, _height: number, centerY: number) {
  const totalBarWidthRatio = 0.65
  const barWidth = (width / barCount) * totalBarWidthRatio
  const gap = (width / barCount) * (1 - totalBarWidthRatio)

  for (let i = 0; i < barCount; i++) {
    const val = Math.max(2.0, wavePoints[i])
    const x = i * (barWidth + gap) + gap / 2
    const topY = centerY - val
    const barTotalHeight = val * 2

    const grad = ctx.createLinearGradient(0, topY, 0, topY + barTotalHeight)
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.95)')
    grad.addColorStop(0.25, 'rgba(20, 184, 166, 0.95)')
    grad.addColorStop(0.5, 'rgba(16, 185, 129, 1)')
    grad.addColorStop(0.75, 'rgba(20, 184, 166, 0.95)')
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.95)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, topY, barWidth, barTotalHeight, [barWidth / 2])
    ctx.fill()

    if (playerStore.isPlaying && peakHeights[i] > 6) {
      const peakY1 = centerY - peakHeights[i] - 1.5
      const peakY2 = centerY + peakHeights[i] + 0.5
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
      ctx.beginPath()
      ctx.roundRect(x, peakY1, barWidth, 1.2, [1])
      ctx.roundRect(x, peakY2, barWidth, 1.2, [1])
      ctx.fill()
    }
  }
}

/**
 * 风格 3：声波粒子扩散环 (Ambient Ring - 紧凑型极光脉冲)
 */
function renderAmbientRing(ctx: CanvasRenderingContext2D, width: number, _height: number, centerY: number) {
  const stepX = width / (barCount - 1)
  for (let i = 0; i < barCount; i++) {
    const val = wavePoints[i]
    const x = i * stepX
    ctx.beginPath()
    ctx.fillStyle = `rgba(16, 185, 129, ${Math.min(0.8, val / 25)})`
    ctx.arc(x, centerY, Math.max(1.5, val * 0.45), 0, Math.PI * 2)
    ctx.fill()
  }
}

onMounted(() => {
  render()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<template>
  <div class="relative flex items-center justify-center h-16 w-full max-w-lg mx-auto pointer-events-none select-none">
    <canvas
      ref="canvasRef"
      width="480"
      height="68"
      class="w-full h-full object-contain filter drop-shadow-[0_0_18px_rgba(16,185,129,0.55)] transition-all duration-300"
    />
  </div>
</template>
