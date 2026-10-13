<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'

export type VisualizerMode =
  | 'holographic-ribbon' // 案例三：中间向两边对称扩散的全息丝带流体波
  | 'neon-light-floor'   // 案例四：中间向两边扩散的赛博地坪垂直光柱与倒影
  | 'neon-glow-line'     // 案例一：中间向两边扩散的霓虹折线脉冲
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

// 采样点数必须为偶数（方便从中间向两侧完全镜像扩散）
const barCount = 48
const smoothedHeights = new Float32Array(barCount)
const peakHeights = new Float32Array(barCount)

// 赛博地坪流星粒子（案例四）
interface SparkParticle {
  x: number
  y: number
  speed: number
  length: number
  color: string
}
const sparks: SparkParticle[] = []
for (let i = 0; i < 40; i++) {
  sparks.push({
    x: Math.random() * 600,
    y: Math.random() * 40 + 80,
    speed: Math.random() * 3.2 + 1.6,
    length: Math.random() * 22 + 10,
    color: ['#10b981', '#06b6d4', '#a855f7', '#f43f5e', '#38bdf8'][Math.floor(Math.random() * 5)],
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
  const rawVol = playerStore.volume ?? 0.8
  // 智能音量保护，避免低音量时无律动
  const volumeFactor = rawVol > 0.01 ? Math.max(0.5, Math.min(1.0, Math.sqrt(rawVol))) : 0

  flowPhase += 0.038
  const centerY = height * 0.52
  const maxBarHalfHeight = height * 0.44

  // 1. 中间向两边对称采样计算 (Center to Edges Diffusion)
  // 低频（重低音、鼓点）集中在画面正中心，高频与泛音对称向左右两侧延伸展开
  for (let i = 0; i < barCount; i++) {
    // 计算当前条离中心的相对距离 distanceFromCenter: 中心为 0，两端为 1
    const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2)

    let targetVal = 0

    if (isPlaying && volumeFactor > 0.01) {
      if (isWebAudioLive && realData) {
        const n = Math.min(realData.length, 128)
        // 映射索引：中心对应低频 (0)，两侧对应中高频
        const sampleIdx = Math.floor(Math.pow(distFromCenter, 1.45) * (n - 1))
        const rawVal = realData[sampleIdx] || 0
        const prevVal = sampleIdx > 0 ? realData[sampleIdx - 1] : rawVal
        const nextVal = sampleIdx < n - 1 ? realData[sampleIdx + 1] : rawVal
        const blended = (rawVal * 0.6 + (prevVal + nextVal) * 0.2) / 255

        // 非线性动态增强与中心鼓点加权 (中心低频更澎湃)
        const centerBassBoost = 1.0 + (1.0 - distFromCenter) * 0.6
        const powerBoost = Math.pow(blended, 1.22) * 2.0 * centerBassBoost
        targetVal = Math.min(1.0, powerBoost) * maxBarHalfHeight * volumeFactor
      } else {
        // 仿真平滑呼吸浪涌（对称）
        const t = (playerStore.currentTime || 0) * 5 + flowPhase
        const wave1 = Math.sin(t + distFromCenter * 3.14) * 0.5 + 0.5
        const wave2 = Math.cos(t * 0.8 - distFromCenter * 2.2) * 0.4 + 0.5
        const bell = Math.cos(distFromCenter * (Math.PI / 2)) // 中心高两端低
        const composite = (wave1 * 0.55 + wave2 * 0.45) * (0.3 + bell * 0.7)
        targetVal = composite * maxBarHalfHeight * 0.95 * volumeFactor
      }
    } else {
      targetVal = 1.5
    }

    // 动态双向弹簧阻尼 (上升 0.55 冲顶抓节拍，回落 0.16 保持张力)
    const current = smoothedHeights[i]
    if (targetVal > current) {
      smoothedHeights[i] = current + (targetVal - current) * 0.55
    } else {
      smoothedHeights[i] = current + (targetVal - current) * 0.16
    }

    if (smoothedHeights[i] > peakHeights[i]) {
      peakHeights[i] = smoothedHeights[i]
    } else {
      peakHeights[i] = Math.max(1.5, peakHeights[i] - 0.55)
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
 * 🌟 案例三：全息丝带流体多波层 (Holographic Ribbon Waves)
 * 中间向两侧对称扩散，两端优雅收拢贴合激光基准线
 */
function renderHolographicRibbon(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  centerY: number
) {
  const stepX = width / (barCount - 1)

  const drawWaveLayer = (
    phaseOffset: number,
    harmonicFactor: number,
    upScale: number,
    downScale: number,
    colorStops: [number, string][],
    lineWidth = 1.6
  ) => {
    ctx.beginPath()

    // 顶部波峰曲线
    ctx.moveTo(0, centerY)
    for (let i = 0; i < barCount - 1; i++) {
      const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2)
      // 包络线让中心波峰最高，两端平滑归零贴合基准线
      const envelope = Math.cos(distFromCenter * (Math.PI / 2))
      const ripple = Math.sin(flowPhase * 1.5 + distFromCenter * 2.8 + phaseOffset) * 0.2 + 0.8
      const h0 = smoothedHeights[i] * envelope * upScale * ripple
      const h1 =
        smoothedHeights[i + 1] *
        Math.cos((Math.abs(i + 1 - (barCount - 1) / 2) / ((barCount - 1) / 2)) * (Math.PI / 2)) *
        upScale *
        ripple

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
      const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2)
      const envelope = Math.cos(distFromCenter * (Math.PI / 2))
      const ripple = Math.cos(flowPhase * 1.2 + distFromCenter * 2.5 + phaseOffset) * 0.18 + 0.82
      const h0 = smoothedHeights[i] * envelope * downScale * ripple
      const h1 =
        smoothedHeights[i - 1] *
        Math.cos((Math.abs(i - 1 - (barCount - 1) / 2) / ((barCount - 1) / 2)) * (Math.PI / 2)) *
        downScale *
        ripple

      const x0 = i * stepX
      const y0 = centerY + h0 * harmonicFactor * 0.65
      const x1 = (i - 1) * stepX
      const y1 = centerY + h1 * harmonicFactor * 0.65
      const midX = (x0 + x1) / 2
      const midY = (y0 + y1) / 2
      ctx.quadraticCurveTo(x0, y0, midX, midY)
    }
    ctx.closePath()

    // 中间向两端对称渐变
    const grad = ctx.createLinearGradient(0, 0, width, 0)
    colorStops.forEach(([pos, col]) => grad.addColorStop(pos, col))

    ctx.fillStyle = grad
    ctx.fill()

    ctx.strokeStyle = colorStops[1] ? colorStops[1][1] : 'rgba(255,255,255,0.7)'
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }

  // 1. 蓝青主波（中心高耸壮阔）
  drawWaveLayer(0, 1.45, 1.35, 0.95, [
    [0, 'rgba(56, 189, 248, 0.05)'],
    [0.25, 'rgba(56, 189, 248, 0.35)'],
    [0.5, 'rgba(20, 184, 166, 0.55)'],
    [0.75, 'rgba(56, 189, 248, 0.35)'],
    [1, 'rgba(56, 189, 248, 0.05)'],
  ], 2.0)

  // 2. 翡翠蓝绿谐波
  drawWaveLayer(1.2, 1.15, 1.1, 0.8, [
    [0, 'rgba(16, 185, 129, 0.05)'],
    [0.3, 'rgba(16, 185, 129, 0.45)'],
    [0.5, 'rgba(6, 182, 212, 0.5)'],
    [0.7, 'rgba(16, 185, 129, 0.45)'],
    [1, 'rgba(16, 185, 129, 0.05)'],
  ], 1.6)

  // 3. 品红/紫红浪漫交织波
  drawWaveLayer(2.5, 0.95, 0.9, 1.05, [
    [0, 'rgba(244, 63, 94, 0.05)'],
    [0.3, 'rgba(236, 72, 153, 0.45)'],
    [0.5, 'rgba(168, 85, 247, 0.5)'],
    [0.7, 'rgba(236, 72, 153, 0.45)'],
    [1, 'rgba(244, 63, 94, 0.05)'],
  ], 1.6)

  // 4. 金黄柔波
  drawWaveLayer(3.8, 0.75, 0.7, 0.6, [
    [0, 'rgba(251, 191, 36, 0.02)'],
    [0.35, 'rgba(245, 158, 11, 0.35)'],
    [0.5, 'rgba(251, 191, 36, 0.45)'],
    [0.65, 'rgba(245, 158, 11, 0.35)'],
    [1, 'rgba(251, 191, 36, 0.02)'],
  ], 1.4)

  // 5. 贯穿中心的发光激光基线 (对称渐变)
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  const lineGrad = ctx.createLinearGradient(0, 0, width, 0)
  lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0.2)')
  lineGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)')
  lineGrad.addColorStop(0.5, 'rgba(94, 234, 212, 1)')
  lineGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.85)')
  lineGrad.addColorStop(1, 'rgba(56, 189, 248, 0.2)')
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 2.0
  ctx.shadowColor = '#5eead4'
  ctx.shadowBlur = 10
  ctx.stroke()
  ctx.shadowBlur = 0
}

/**
 * 🌟 案例四：赛博透视地坪光柱与流星倒影 (Cyber Neon Light Floor)
 * 垂直光柱从中心向两端对称排列，地坪流星向外迸射
 */
function renderNeonLightFloor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const baseLineY = height * 0.65
  const stepX = width / barCount
  const barWidth = stepX * 0.48

  // 1. 地坪流星扩散线
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

  // 2. 地坪对称激光基线
  const baseGrad = ctx.createLinearGradient(0, baseLineY, width, baseLineY)
  baseGrad.addColorStop(0, 'rgba(168, 85, 247, 0.3)')
  baseGrad.addColorStop(0.3, 'rgba(236, 72, 153, 0.95)')
  baseGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)')
  baseGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.95)')
  baseGrad.addColorStop(1, 'rgba(168, 85, 247, 0.3)')

  ctx.beginPath()
  ctx.moveTo(0, baseLineY)
  ctx.lineTo(width, baseLineY)
  ctx.strokeStyle = baseGrad
  ctx.lineWidth = 3
  ctx.shadowColor = '#ec4899'
  ctx.shadowBlur = 12
  ctx.stroke()
  ctx.shadowBlur = 0

  // 3. 垂直霓虹光柱 (中间向两边对称高度)
  for (let i = 0; i < barCount; i++) {
    const val = Math.max(3.0, smoothedHeights[i] * 1.55)
    const x = i * stepX + stepX * 0.25
    const topY = baseLineY - val

    const colGrad = ctx.createLinearGradient(0, topY, 0, baseLineY)
    colGrad.addColorStop(0, i % 2 === 0 ? 'rgba(56, 189, 248, 1)' : 'rgba(244, 63, 94, 1)')
    colGrad.addColorStop(0.7, i % 2 === 0 ? 'rgba(168, 85, 247, 0.85)' : 'rgba(236, 72, 153, 0.85)')
    colGrad.addColorStop(1, 'rgba(255, 255, 255, 1)')

    ctx.fillStyle = colGrad
    ctx.beginPath()
    ctx.roundRect(x, topY, barWidth, val, [barWidth / 2, barWidth / 2, 0, 0])
    ctx.fill()

    // 顶端发光白点
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
 * 中间向两侧对称扩散
 */
function renderNeonGlowLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  centerY: number
) {
  const stepX = width / barCount
  const barWidth = stepX * 0.45

  // 1. 底层密集频柱
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

    // 水面倒影
    ctx.fillStyle = 'rgba(217, 70, 239, 0.15)'
    ctx.fillRect(x, centerY, barWidth, val * 0.35)
  }

  // 2. 表层贯穿白亮发光轮廓曲线
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
  <div class="relative flex items-center justify-center h-28 w-full max-w-xl mx-auto pointer-events-none select-none">
    <canvas
      ref="canvasRef"
      width="600"
      height="120"
      class="w-full h-full object-contain filter drop-shadow-[0_0_24px_rgba(20,184,166,0.65)] transition-all duration-300"
    />
  </div>
</template>
