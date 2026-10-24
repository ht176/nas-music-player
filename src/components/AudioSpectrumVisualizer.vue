<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'
import { useThemeStore } from '../stores/theme'

export type VisualizerMode =
  | 'neon-light-floor' // 案例四：赛博透视地坪垂直光柱与倒影 (默认)
  | 'neon-glow-line'   // 案例一：霓虹折线脉冲与频柱
  | 'aurora-mirror'    // 经典：极光对称柱

const props = withDefaults(
  defineProps<{
    mode?: VisualizerMode
  }>(),
  {
    mode: 'neon-light-floor',
  }
)

const playerStore = usePlayerStore()
const themeStore = useThemeStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null
let isRunning = false

// 采样点数
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

// 缓存主题颜色，杜绝每帧 getComputedStyle 引发的强制重排与渲染卡顿
let cachedColors = { accent: '#10b981', accentSec: '#06b6d4', glow: 'rgba(16, 185, 129, 0.4)' }

function updateCachedThemeColors() {
  if (typeof document === 'undefined') return
  const rootStyle = getComputedStyle(document.documentElement)
  cachedColors = {
    accent: rootStyle.getPropertyValue('--theme-accent').trim() || '#10b981',
    accentSec: rootStyle.getPropertyValue('--theme-accent-secondary').trim() || '#06b6d4',
    glow: rootStyle.getPropertyValue('--theme-glow').trim() || 'rgba(16, 185, 129, 0.4)',
  }
}

watch(() => themeStore.currentThemeId, () => {
  updateCachedThemeColors()
})

watch(() => playerStore.isPlaying, (playing) => {
  if (playing) {
    startAnimation()
  }
})

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
  const volumeFactor = rawVol > 0.01 ? Math.max(0.4, Math.min(1.0, Math.sqrt(rawVol))) : 0

  flowPhase += 0.038
  const centerY = height * 0.52
  const maxBarHalfHeight = height * 0.44

  // 1. 中间向两边对称采样计算 (Center to Edges Diffusion)
  // 杜绝顶格：采用合理线性归一化与适当动态增益，预留 25% 动态余量
  for (let i = 0; i < barCount; i++) {
    // 距几何中心的相对距离 (中心为 0，两端为 1)
    const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2)

    let targetVal = 0

    if (isPlaying && volumeFactor > 0.01) {
      if (isWebAudioLive && realData) {
        const n = Math.min(realData.length, 120)
        // 映射索引：中心对应低频，两侧对应中高频
        const sampleIdx = Math.floor(Math.pow(distFromCenter, 1.4) * (n - 1))
        const rawVal = realData[sampleIdx] || 0
        const prevVal = sampleIdx > 0 ? realData[sampleIdx - 1] : rawVal
        const nextVal = sampleIdx < n - 1 ? realData[sampleIdx + 1] : rawVal
        const blended = (rawVal * 0.6 + (prevVal + nextVal) * 0.2) / 255

        // 合理的动态缩放：既灵动又不会全屏顶死
        const centerWeight = 1.0 + (1.0 - distFromCenter) * 0.35
        const norm = Math.min(1.0, Math.pow(blended, 1.1) * 1.35 * centerWeight)
        targetVal = norm * (maxBarHalfHeight * 0.82) * volumeFactor
      } else {
        // 离线平滑仿真呼吸浪涌（对称且动态起伏自然）
        const t = (playerStore.currentTime || 0) * 4.5 + flowPhase
        const wave1 = Math.sin(t + distFromCenter * 2.8) * 0.45 + 0.45
        const wave2 = Math.cos(t * 0.7 - distFromCenter * 2.0) * 0.35 + 0.35
        const envelope = Math.cos(distFromCenter * (Math.PI / 2.3))
        const composite = (wave1 * 0.6 + wave2 * 0.4) * envelope
        targetVal = composite * (maxBarHalfHeight * 0.78) * volumeFactor
      }
    } else {
      targetVal = 1.0
    }

    // 动态双向弹簧阻尼 (上升 0.48，回落 0.18，节奏分明)
    const current = smoothedHeights[i]
    if (targetVal > current) {
      smoothedHeights[i] = current + (targetVal - current) * 0.48
    } else {
      smoothedHeights[i] = current + (targetVal - current) * 0.18
    }

    if (smoothedHeights[i] > peakHeights[i]) {
      peakHeights[i] = smoothedHeights[i]
    } else {
      peakHeights[i] = Math.max(1.0, peakHeights[i] - 0.45)
    }
  }

  // 2. 分支渲染各案例视觉
  if (props.mode === 'neon-glow-line') {
    renderNeonGlowLine(ctx, width, height, centerY)
  } else if (props.mode === 'aurora-mirror') {
    renderAuroraMirror(ctx, width, height, centerY)
  } else {
    // 默认：案例四 赛博透视地坪
    renderNeonLightFloor(ctx, width, height)
  }

  // 检查暂停或停止出声时的空闲状态，完全回落至 0 后停止 rAF 循环，节约 GPU/CPU
  if (!playerStore.isPlaying) {
    let hasEnergy = false
    for (let i = 0; i < barCount; i++) {
      if (smoothedHeights[i] > 1.2) {
        hasEnergy = true
        break
      }
    }
    if (!hasEnergy) {
      ctx.clearRect(0, 0, width, height)
      stopAnimation()
      return
    }
  }

  animId = requestAnimationFrame(render)
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
  const { accent, accentSec } = cachedColors

  // 1. 地坪流星扩散线
  for (let i = 0; i < sparks.length; i++) {
    const s = sparks[i]
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
    ctx.strokeStyle = i % 2 === 0 ? accent : accentSec
    ctx.lineWidth = 1.2 * perspectiveScale
    ctx.stroke()
  }

  // 2. 地坪对称激光基线
  const baseGrad = ctx.createLinearGradient(0, baseLineY, width, baseLineY)
  baseGrad.addColorStop(0, 'transparent')
  baseGrad.addColorStop(0.3, accentSec)
  baseGrad.addColorStop(0.5, '#ffffff')
  baseGrad.addColorStop(0.7, accentSec)
  baseGrad.addColorStop(1, 'transparent')

  ctx.beginPath()
  ctx.moveTo(0, baseLineY)
  ctx.lineTo(width, baseLineY)
  ctx.strokeStyle = baseGrad
  ctx.lineWidth = 2.5
  ctx.shadowColor = accent
  ctx.shadowBlur = 10
  ctx.stroke()
  ctx.shadowBlur = 0

  // 3. 垂直霓虹光柱 (中间向两边对称高度，不顶格)
  for (let i = 0; i < barCount; i++) {
    const val = Math.max(2.5, smoothedHeights[i] * 1.35)
    const x = i * stepX + stepX * 0.25
    const topY = baseLineY - val

    const colGrad = ctx.createLinearGradient(0, topY, 0, baseLineY)
    colGrad.addColorStop(0, i % 2 === 0 ? accent : accentSec)
    colGrad.addColorStop(0.7, i % 2 === 0 ? accentSec : accent)
    colGrad.addColorStop(1, '#ffffff')

    ctx.fillStyle = colGrad
    ctx.beginPath()
    ctx.roundRect(x, topY, barWidth, val, [barWidth / 2, barWidth / 2, 0, 0])
    ctx.fill()

    // 顶端发光白点
    if (val > 6) {
      ctx.beginPath()
      ctx.arc(x + barWidth / 2, topY, barWidth * 0.65, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = i % 2 === 0 ? accent : accentSec
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
  const { accent, accentSec } = cachedColors

  // 1. 底层密集频柱
  for (let i = 0; i < barCount; i++) {
    const val = Math.max(2.0, smoothedHeights[i])
    const x = i * stepX + stepX * 0.25
    const topY = centerY - val

    const grad = ctx.createLinearGradient(0, topY, 0, centerY)
    grad.addColorStop(0, accent)
    grad.addColorStop(0.5, accentSec)
    grad.addColorStop(1, 'transparent')

    ctx.fillStyle = grad
    ctx.fillRect(x, topY, barWidth, val)

    // 水面倒影
    ctx.fillStyle = accentSec
    ctx.globalAlpha = 0.15
    ctx.fillRect(x, centerY, barWidth, val * 0.35)
    ctx.globalAlpha = 1.0
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
  ctx.shadowColor = accentSec
  ctx.shadowBlur = 12
  ctx.stroke()
  ctx.shadowBlur = 0

  // 3. 基准白线
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
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
  const { accent, accentSec } = cachedColors

  for (let i = 0; i < barCount; i++) {
    const val = Math.max(2.0, smoothedHeights[i])
    const x = i * (barWidth + gap) + gap / 2
    const topY = centerY - val
    const barTotalHeight = val * 2

    const grad = ctx.createLinearGradient(0, topY, 0, topY + barTotalHeight)
    grad.addColorStop(0, accentSec)
    grad.addColorStop(0.5, accent)
    grad.addColorStop(1, accentSec)

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

function startAnimation() {
  if (isRunning) return
  if (typeof document !== 'undefined' && document.hidden) return
  isRunning = true
  animId = requestAnimationFrame(render)
}

function stopAnimation() {
  isRunning = false
  if (animId) {
    cancelAnimationFrame(animId)
    animId = null
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopAnimation()
  } else if (playerStore.isPlaying) {
    startAnimation()
  }
}

onMounted(() => {
  updateCachedThemeColors()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
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
