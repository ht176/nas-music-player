<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'

export type VisualizerMode =
  | 'holographic-ribbon' // 案例三：全息丝带流体多波层 (默认)
  | 'neon-light-floor'   // 案例四：赛博透视地坪光柱与流星倒影
  | 'neon-glow-line'     // 案例一：荧光波形连线与光斑柱
  | 'aurora-mirror'      // 经典：极光对称柱

const props = withDefaults(
  defineProps<{
    mode?: VisualizerMode
  }>(),
  {
    mode: 'holographic-ribbon',
  }
)

const playerStore = usePlayerStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

// 采样点数与阻尼平滑数组
const barCount = 48
const smoothedHeights = new Float32Array(barCount)
const peakHeights = new Float32Array(barCount)

// 粒子系统（用于案例四地坪粒子与案例一霓虹环境浮光）
interface SparkParticle {
  x: number
  y: number
  speed: number
  length: number
  color: string
}
const sparks: SparkParticle[] = []
for (let i = 0; i < 35; i++) {
  sparks.push({
    x: Math.random() * 540,
    y: Math.random() * 30 + 60,
    speed: Math.random() * 2.5 + 1.2,
    length: Math.random() * 15 + 8,
    color: ['#10b981', '#06b6d4', '#a855f7', '#f43f5e'][Math.floor(Math.random() * 4)],
  })
}

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

  flowPhase += 0.035
  const centerY = height * 0.58
  const maxBarHalfHeight = height * 0.46

  // 1. 计算每个频段的真实声学与弹性平滑
  for (let i = 0; i < barCount; i++) {
    let targetVal = 0

    if (isPlaying && volumeFactor > 0.01) {
      if (isWebAudioLive && realData) {
        const n = realData.length
        // 人耳非线性对数频段采样映射 (低频密集响应，高频适度补偿)
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

    // 动态双向弹簧阻尼 (上升 0.38，回落 0.12)
    const current = smoothedHeights[i]
    if (targetVal > current) {
      smoothedHeights[i] = current + (targetVal - current) * 0.38
    } else {
      smoothedHeights[i] = current + (targetVal - current) * 0.12
    }

    if (smoothedHeights[i] > peakHeights[i]) {
      peakHeights[i] = smoothedHeights[i]
    } else {
      peakHeights[i] = Math.max(1.0, peakHeights[i] - 0.45)
    }
  }

  // 2. 分支渲染各案例视觉
  if (props.mode === 'holographic-ribbon') {
    renderHolographicRibbon(ctx, width, height, centerY)
  } else if (props.mode === 'neon-light-floor') {
    renderNeonLightFloor(ctx, width, height)
  } else if (props.mode === 'neon-glow-line') {
    renderNeonGlowLine(ctx, width, height, centerY)
  } else {
    renderAuroraMirror(ctx, width, height, centerY)
  }

  animId = requestAnimationFrame(render)
}

/**
 * 🌟 案例三：全息丝带流体多波层 (Holographic Multi-Layer Ribbon Waves)
 * 特点：半透明多色极光波纹层叠交织（蓝、青、紫、品红、金），高光基准线贯穿，两端收敛，灵动非凡
 */
function renderHolographicRibbon(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  centerY: number
) {
  const stepX = width / (barCount - 1)

  // 绘制层叠波形函数 (波形谐波、相位偏移、渐变色、上下振幅系数)
  const drawWaveLayer = (
    phaseOffset: number,
    harmonicFactor: number,
    upScale: number,
    downScale: number,
    colorStops: [number, string][],
    lineWidth = 1.2
  ) => {
    ctx.beginPath()

    // 顶部波峰曲线
    ctx.moveTo(0, centerY)
    for (let i = 0; i < barCount - 1; i++) {
      const bell = Math.sin((i / (barCount - 1)) * Math.PI)
      const ripple = Math.sin(flowPhase * 1.5 + i * 0.3 + phaseOffset) * 0.25 + 0.75
      const h0 = smoothedHeights[i] * bell * upScale * ripple
      const h1 = smoothedHeights[i + 1] * Math.sin(((i + 1) / (barCount - 1)) * Math.PI) * upScale * ripple

      const x0 = i * stepX
      const y0 = centerY - h0 * harmonicFactor
      const x1 = (i + 1) * stepX
      const y1 = centerY - h1 * harmonicFactor
      const midX = (x0 + x1) / 2
      const midY = (y0 + y1) / 2
      ctx.quadraticCurveTo(x0, y0, midX, midY)
    }

    // 底部波谷对称曲线
    for (let i = barCount - 1; i > 0; i--) {
      const bell = Math.sin((i / (barCount - 1)) * Math.PI)
      const ripple = Math.cos(flowPhase * 1.2 + i * 0.25 + phaseOffset) * 0.2 + 0.8
      const h0 = smoothedHeights[i] * bell * downScale * ripple
      const h1 = smoothedHeights[i - 1] * Math.sin(((i - 1) / (barCount - 1)) * Math.PI) * downScale * ripple

      const x0 = i * stepX
      const y0 = centerY + h0 * harmonicFactor * 0.65
      const x1 = (i - 1) * stepX
      const y1 = centerY + h1 * harmonicFactor * 0.65
      const midX = (x0 + x1) / 2
      const midY = (y0 + y1) / 2
      ctx.quadraticCurveTo(x0, y0, midX, midY)
    }
    ctx.closePath()

    const grad = ctx.createLinearGradient(0, 0, width, 0)
    colorStops.forEach(([pos, col]) => grad.addColorStop(pos, col))

    ctx.fillStyle = grad
    ctx.fill()

    ctx.strokeStyle = colorStops[1] ? colorStops[1][1] : 'rgba(255,255,255,0.7)'
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }

  // 1. 蓝青主波（最高耸）
  drawWaveLayer(0, 1.25, 1.0, 0.7, [
    [0, 'rgba(56, 189, 248, 0.05)'],
    [0.3, 'rgba(56, 189, 248, 0.35)'],
    [0.55, 'rgba(20, 184, 166, 0.4)'],
    [1, 'rgba(56, 189, 248, 0.05)'],
  ], 1.5)

  // 2. 翡翠蓝绿谐波
  drawWaveLayer(1.2, 0.95, 0.85, 0.55, [
    [0, 'rgba(16, 185, 129, 0.05)'],
    [0.4, 'rgba(16, 185, 129, 0.45)'],
    [0.7, 'rgba(6, 182, 212, 0.4)'],
    [1, 'rgba(16, 185, 129, 0.05)'],
  ], 1.2)

  // 3. 品红/紫红浪漫交织波
  drawWaveLayer(2.5, 0.8, 0.7, 0.85, [
    [0, 'rgba(244, 63, 94, 0.05)'],
    [0.35, 'rgba(236, 72, 153, 0.45)'],
    [0.65, 'rgba(168, 85, 247, 0.4)'],
    [1, 'rgba(244, 63, 94, 0.05)'],
  ], 1.2)

  // 4. 金黄/落日暖色柔波
  drawWaveLayer(3.8, 0.55, 0.5, 0.4, [
    [0, 'rgba(251, 191, 36, 0.02)'],
    [0.5, 'rgba(245, 158, 11, 0.35)'],
    [0.85, 'rgba(239, 68, 68, 0.3)'],
    [1, 'rgba(251, 191, 36, 0.02)'],
  ], 1.0)

  // 5. 贯穿中心的水平发光基准光刃 (Horizontal Laser Center Line)
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  const lineGrad = ctx.createLinearGradient(0, 0, width, 0)
  lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0.2)')
  lineGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)')
  lineGrad.addColorStop(0.5, 'rgba(94, 234, 212, 1)')
  lineGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.85)')
  lineGrad.addColorStop(1, 'rgba(251, 191, 36, 0.2)')
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 2.0
  ctx.shadowColor = '#5eead4'
  ctx.shadowBlur = 10
  ctx.stroke()
  ctx.shadowBlur = 0
}

/**
 * 🌟 案例四：赛博透视地坪光柱与流星倒影 (Cyber Neon Light Floor)
 * 特点：垂直独立密集荧光光柱，基线剧烈发光，地坪流星透视倒影向视口延伸
 */
function renderNeonLightFloor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const baseLineY = height * 0.65
  const stepX = width / barCount
  const barWidth = stepX * 0.48

  // 1. 地坪透视扩散流星线 (Floor Speed Rays)
  for (let s of sparks) {
    if (playerStore.isPlaying) {
      s.y += s.speed
      if (s.y > height) {
        s.y = baseLineY + 2
        s.x = Math.random() * width
      }
    }
    const perspectiveScale = 1 + ((s.y - baseLineY) / (height - baseLineY)) * 0.8
    const rayLength = s.length * perspectiveScale
    ctx.beginPath()
    ctx.moveTo(s.x, s.y)
    ctx.lineTo(s.x, s.y + rayLength)
    ctx.strokeStyle = s.color
    ctx.lineWidth = 1.2 * perspectiveScale
    ctx.stroke()
  }

  // 2. 地坪基线强激光辉光 (Floor Base Neon Beam)
  const baseGrad = ctx.createLinearGradient(0, baseLineY, width, baseLineY)
  baseGrad.addColorStop(0, 'rgba(168, 85, 247, 0.3)')
  baseGrad.addColorStop(0.3, 'rgba(236, 72, 153, 0.95)')
  baseGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)')
  baseGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.95)')
  baseGrad.addColorStop(1, 'rgba(16, 185, 129, 0.3)')

  ctx.beginPath()
  ctx.moveTo(0, baseLineY)
  ctx.lineTo(width, baseLineY)
  ctx.strokeStyle = baseGrad
  ctx.lineWidth = 3
  ctx.shadowColor = '#ec4899'
  ctx.shadowBlur = 12
  ctx.stroke()
  ctx.shadowBlur = 0

  // 3. 垂直霓虹光柱 (自基线向上拔起)
  for (let i = 0; i < barCount; i++) {
    const val = Math.max(3.0, smoothedHeights[i] * 1.1)
    const x = i * stepX + stepX * 0.25
    const topY = baseLineY - val

    // 渐变光柱 (蓝青 -> 品红紫)
    const colGrad = ctx.createLinearGradient(0, topY, 0, baseLineY)
    colGrad.addColorStop(0, i % 2 === 0 ? 'rgba(56, 189, 248, 1)' : 'rgba(244, 63, 94, 1)')
    colGrad.addColorStop(0.7, i % 2 === 0 ? 'rgba(168, 85, 247, 0.85)' : 'rgba(236, 72, 153, 0.85)')
    colGrad.addColorStop(1, 'rgba(255, 255, 255, 1)')

    ctx.fillStyle = colGrad
    ctx.beginPath()
    ctx.roundRect(x, topY, barWidth, val, [barWidth / 2, barWidth / 2, 0, 0])
    ctx.fill()

    // 顶端白亮发光点 (Top Head Cap)
    if (val > 8) {
      ctx.beginPath()
      ctx.arc(x + barWidth / 2, topY, barWidth * 0.7, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = i % 2 === 0 ? '#38bdf8' : '#f43f5e'
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }
}

/**
 * 🌟 案例一：荧光波形连线与光斑柱 (Neon Glow Line & Bar Grid)
 * 特点：底层亮紫粉色频柱密集阵列 + 表层白亮极光折线包裹连通
 */
function renderNeonGlowLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  centerY: number
) {
  const stepX = width / barCount
  const barWidth = stepX * 0.45

  // 1. 底层密集品红/紫罗兰频柱
  for (let i = 0; i < barCount; i++) {
    const val = Math.max(2.0, smoothedHeights[i])
    const x = i * stepX + stepX * 0.25
    const topY = centerY - val

    const grad = ctx.createLinearGradient(0, topY, 0, centerY)
    grad.addColorStop(0, 'rgba(244, 63, 94, 0.95)')
    grad.addColorStop(0.5, 'rgba(217, 70, 239, 0.75)')
    grad.addColorStop(1, 'rgba(168, 85, 247, 0.3)')

    ctx.fillStyle = grad
    ctx.fillRect(x, topY, barWidth, val)

    // 水面微弱镜像倒影
    ctx.fillStyle = 'rgba(217, 70, 239, 0.15)'
    ctx.fillRect(x, centerY, barWidth, val * 0.35)
  }

  // 2. 表层贯穿白亮发光轮廓曲线 (包裹在柱子外围的脉冲光线)
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  for (let i = 0; i < barCount - 1; i++) {
    const x0 = i * stepX + stepX * 0.5
    const y0 = centerY - smoothedHeights[i] * 1.05
    const x1 = (i + 1) * stepX + stepX * 0.5
    const y1 = centerY - smoothedHeights[i + 1] * 1.05
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  }
  ctx.lineTo(width, centerY)

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.2
  ctx.shadowColor = '#d946ef'
  ctx.shadowBlur = 12
  ctx.stroke()
  ctx.shadowBlur = 0

  // 3. 基准白线
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 1
  ctx.stroke()
}

/**
 * 经典：极光全息对称柱 (Aurora Mirror Bars)
 */
function renderAuroraMirror(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  centerY: number
) {
  const totalBarWidthRatio = 0.65
  const barWidth = (width / barCount) * totalBarWidthRatio
  const gap = (width / barCount) * (1 - totalBarWidthRatio)

  for (let i = 0; i < barCount; i++) {
    const val = Math.max(2.0, smoothedHeights[i])
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

onMounted(() => {
  render()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<template>
  <div class="relative flex items-center justify-center h-20 w-full max-w-lg mx-auto pointer-events-none select-none">
    <canvas
      ref="canvasRef"
      width="520"
      height="80"
      class="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(20,184,166,0.6)] transition-all duration-300"
    />
  </div>
</template>
