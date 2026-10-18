<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'

const playerStore = usePlayerStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

// 环形律动采样点数（与博文案例一致采用 80~100 根环绕辐射光柱）
const barCount = 84
const smoothedData = new Float32Array(barCount)
const peakData = new Float32Array(barCount)

// 随机索引映射表（如同博客中的 randomData 排序算法，打破单调阶梯感，让高低起伏更加错落有致、生动绚丽）
const freqIndexMap: number[] = []
for (let i = 0; i < barCount; i++) {
  freqIndexMap.push(i)
}
// 使用可控伪随机打乱相邻高低音分布，保证环绕圆周时视觉丰富
for (let i = freqIndexMap.length - 1; i > 0; i--) {
  const j = Math.floor(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % (i + 1)
  const positiveJ = Math.abs(j)
  const temp = freqIndexMap[i]
  freqIndexMap[i] = freqIndexMap[positiveJ]
  freqIndexMap[positiveJ] = temp
}

let rotationAngle = 0

function getThemeColors() {
  if (typeof document === 'undefined') {
    return { accent: '#10b981', accentSec: '#06b6d4', glow: 'rgba(16, 185, 129, 0.4)' }
  }
  const rootStyle = getComputedStyle(document.documentElement)
  const accent = rootStyle.getPropertyValue('--theme-accent').trim() || '#10b981'
  const accentSec = rootStyle.getPropertyValue('--theme-accent-secondary').trim() || '#06b6d4'
  const glow = rootStyle.getPropertyValue('--theme-glow').trim() || 'rgba(16, 185, 129, 0.4)'
  return { accent, accentSec, glow }
}

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
  const volumeFactor = rawVol > 0.01 ? Math.max(0.5, Math.min(1.0, Math.sqrt(rawVol))) : 0

  if (isPlaying) {
    rotationAngle += 0.003
  }

  // 1. 获取并映射音频能量数据
  for (let i = 0; i < barCount; i++) {
    let target = 0
    if (isPlaying && volumeFactor > 0.01) {
      if (isWebAudioLive && realData) {
        // 使用映射索引采样前 120 个有效音频能量频段
        const sampleIdx = Math.floor((freqIndexMap[i] / barCount) * Math.min(realData.length, 120))
        const val = realData[sampleIdx] || 0
        const normalized = val / 255
        // 强化低频与节拍爆发
        target = Math.pow(normalized, 1.2) * 55 * volumeFactor
      } else {
        // 离线/降级仿真呼吸波浪
        const t = (playerStore.currentTime || 0) * 4 + i * 0.25
        const wave = Math.sin(t) * 0.5 + Math.cos(t * 1.5 + i * 0.1) * 0.5
        target = (Math.abs(wave) * 35 + 4) * volumeFactor
      }
    } else {
      target = 0
    }

    // 弹性平滑阻尼
    const cur = smoothedData[i]
    if (target > cur) {
      smoothedData[i] = cur + (target - cur) * 0.5
    } else {
      smoothedData[i] = cur + (target - cur) * 0.15
    }

    if (smoothedData[i] > peakData[i]) {
      peakData[i] = smoothedData[i]
    } else {
      peakData[i] = Math.max(0, peakData[i] - 0.4)
    }
  }

  // 2. 绘制环绕唱片的径向脉冲柱 (按当前主题配色辐射发散)
  const cx = width / 2
  const cy = height / 2
  const baseRadius = 145
  const angleStep = (Math.PI * 2) / barCount
  const { accent, accentSec } = getThemeColors()

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotationAngle)

  for (let i = 0; i < barCount; i++) {
    const val = Math.max(2, smoothedData[i])
    ctx.save()
    ctx.rotate(angleStep * i)

    // 渐变光柱 (从贴近唱片的主题主色过渡到外圈副色与白亮高光)
    const barGrad = ctx.createLinearGradient(0, baseRadius, 0, baseRadius + val)
    barGrad.addColorStop(0, accent)
    barGrad.addColorStop(0.6, accentSec)
    barGrad.addColorStop(1, '#ffffff')

    ctx.fillStyle = barGrad
    ctx.beginPath()
    // 柱宽 3.5px，圆角
    ctx.roundRect(-1.75, baseRadius, 3.5, val, [1.75])
    ctx.fill()

    // 外边缘高光发光浮点
    if (val > 6) {
      ctx.beginPath()
      ctx.arc(0, baseRadius + val + 2.5, 1.6, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = accentSec
      ctx.shadowBlur = 6
      ctx.fill()
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }

  ctx.restore()

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
  <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
    <canvas
      ref="canvasRef"
      width="420"
      height="420"
      class="w-[155%] h-[155%] max-w-none max-h-none object-contain transition-all duration-500"
      :style="{ filter: 'drop-shadow(0 0 16px var(--theme-glow))' }"
    />
  </div>
</template>
