<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'

const props = withDefaults(
  defineProps<{
    mode?: 'bars' | 'wave' | 'mirror'
  }>(),
  {
    mode: 'mirror',
  }
)

const playerStore = usePlayerStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

// 48 个频段，低频到高频对数加权映射
const barCount = 42
const smoothedHeights = new Float32Array(barCount)
const peakHeights = new Float32Array(barCount)

// 拟真声波相位参数（在纯原生播放或频段极暗时产生温润拟真正弦流体）
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

  flowPhase += 0.045
  const centerY = height / 2
  const maxBarHalfHeight = height * 0.44

  // 计算每根律动柱宽度与间隙
  const totalBarWidthRatio = 0.68
  const barWidth = (width / barCount) * totalBarWidthRatio
  const gap = (width / barCount) * (1 - totalBarWidthRatio)

  for (let i = 0; i < barCount; i++) {
    let targetVal = 0

    if (isPlaying) {
      if (isWebAudioLive && realData) {
        // 对数/非线性频段采样映射：人耳对低频到中低频最敏感
        // 低频对应 20Hz~250Hz，中频 250Hz~4kHz，高频 4kHz~20kHz
        const n = realData.length
        // 指数映射采样点：低频集中细分采样
        const sampleIdx = Math.floor(Math.pow(i / (barCount - 1), 1.8) * (n - 1))
        const rawVal = realData[sampleIdx] || 0

        // 引入相邻平滑，避免突兀单柱跳变
        const prevVal = sampleIdx > 0 ? realData[sampleIdx - 1] : rawVal
        const nextVal = sampleIdx < n - 1 ? realData[sampleIdx + 1] : rawVal
        const blended = (rawVal * 0.6 + (prevVal + nextVal) * 0.2) / 255

        // 人耳听感补偿（高频轻微增益，避免右侧完全平直）
        const earCompensation = 1 + (i / barCount) * 0.35
        targetVal = Math.min(1, blended * earCompensation) * maxBarHalfHeight
      } else {
        // 当流媒体由浏览器原生直推时（CORS限制），使用基于歌曲当前时间戳的高保真物理流体声学模型
        const t = (playerStore.currentTime || 0) * 4 + flowPhase
        // 多谐波自然重叠 (仿交响/人声呼吸波束)
        const wave1 = Math.sin(t + i * 0.28) * 0.45 + 0.5
        const wave2 = Math.cos(t * 0.7 - i * 0.19) * 0.35 + 0.5
        const wave3 = Math.sin(t * 1.6 + i * 0.5) * 0.2 + 0.5
        // 呈现中间丰满、两端优雅收敛的声波自然鼓形曲线 (Bell Envelope)
        const bell = Math.sin((i / (barCount - 1)) * Math.PI)
        const composite = (wave1 * 0.5 + wave2 * 0.35 + wave3 * 0.15) * (0.35 + bell * 0.65)
        targetVal = composite * maxBarHalfHeight * 0.88
      }
    } else {
      // 暂停时微弱常驻静息呼吸底线
      targetVal = 2.0
    }

    // 动态阻尼弹性过渡 (Spring / Damping lerp)
    // 上升快(0.35)，下降慢(0.12)，带来极其丝滑高级的视觉质感
    const current = smoothedHeights[i]
    if (targetVal > current) {
      smoothedHeights[i] = current + (targetVal - current) * 0.36
    } else {
      smoothedHeights[i] = current + (targetVal - current) * 0.12
    }

    const val = Math.max(2.0, smoothedHeights[i])

    // 峰值指示点模拟 (Peak Decay)
    if (val > peakHeights[i]) {
      peakHeights[i] = val
    } else {
      peakHeights[i] = Math.max(2.0, peakHeights[i] - 0.55)
    }

    const x = i * (barWidth + gap) + gap / 2
    const topY = centerY - val
    const barTotalHeight = val * 2

    // 绘制镜面对称渐变发光柱 (Aurora Fluid Beam)
    const grad = ctx.createLinearGradient(0, topY, 0, topY + barTotalHeight)
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.95)')   // 顶端天蓝高光
    grad.addColorStop(0.25, 'rgba(20, 184, 166, 0.95)') // 极光青
    grad.addColorStop(0.5, 'rgba(16, 185, 129, 1)')     // 核心翡翠绿
    grad.addColorStop(0.75, 'rgba(20, 184, 166, 0.95)')
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.95)')   // 底端天蓝高光

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, topY, barWidth, barTotalHeight, [barWidth / 2])
    ctx.fill()

    // 顶端/底端粒子浮标微光 (Peak Caps)
    if (isPlaying && peakHeights[i] > 6) {
      const peakY1 = centerY - peakHeights[i] - 1.5
      const peakY2 = centerY + peakHeights[i] + 0.5
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
      ctx.beginPath()
      ctx.roundRect(x, peakY1, barWidth, 1.2, [1])
      ctx.roundRect(x, peakY2, barWidth, 1.2, [1])
      ctx.fill()
    }
  }

  animId = requestAnimationFrame(render)
}

onMounted(() => {
  render()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<template>
  <div class="relative flex items-center justify-center h-16 w-full max-w-md mx-auto pointer-events-none select-none">
    <canvas
      ref="canvasRef"
      width="440"
      height="64"
      class="w-full h-full object-contain filter drop-shadow-[0_0_16px_rgba(16,185,129,0.55)]"
    />
  </div>
</template>
