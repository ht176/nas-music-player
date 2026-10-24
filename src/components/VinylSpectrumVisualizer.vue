<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'
import { useThemeStore } from '../stores/theme'

const playerStore = usePlayerStore()
const themeStore = useThemeStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null
let isRunning = false

// 环形律动采样点数
const barCount = 84
const smoothedData = new Float32Array(barCount)
const peakData = new Float32Array(barCount)

// 随机索引映射表（打破单调阶梯感，让高低起伏更加错落有致）
const freqIndexMap: number[] = []
for (let i = 0; i < barCount; i++) {
  freqIndexMap.push(i)
}
for (let i = freqIndexMap.length - 1; i > 0; i--) {
  const j = Math.floor(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % (i + 1)
  const positiveJ = Math.abs(j)
  const temp = freqIndexMap[i]
  freqIndexMap[i] = freqIndexMap[positiveJ]
  freqIndexMap[positiveJ] = temp
}

let rotationAngle = 0

// 缓存主题颜色，避免每帧触发强制重排 (layout thrashing)
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
  if (!isRunning) return

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
        const sampleIdx = Math.floor((freqIndexMap[i] / barCount) * Math.min(realData.length, 120))
        const val = realData[sampleIdx] || 0
        const normalized = val / 255
        target = Math.pow(normalized, 1.2) * 55 * volumeFactor
      } else {
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

  // 2. 绘制环绕唱片的径向脉冲柱
  const cx = width / 2
  const cy = height / 2
  const baseRadius = 145
  const angleStep = (Math.PI * 2) / barCount
  const { accent, accentSec } = cachedColors

  // 单一共享渐变：避免在 84 次子循环中重复构造 84 个 CanvasGradient 对象
  const sharedGrad = ctx.createLinearGradient(0, baseRadius, 0, baseRadius + 45)
  sharedGrad.addColorStop(0, accent)
  sharedGrad.addColorStop(0.6, accentSec)
  sharedGrad.addColorStop(1, '#ffffff')

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotationAngle)

  ctx.fillStyle = sharedGrad

  for (let i = 0; i < barCount; i++) {
    const val = Math.max(2, smoothedData[i])
    ctx.save()
    ctx.rotate(angleStep * i)

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
      ctx.fillStyle = sharedGrad
    }

    ctx.restore()
  }

  ctx.restore()

  // 当处于暂停且能量完全释放时，暂停 rAF 循环，节约电量与计算资源
  if (!isPlaying) {
    let hasEnergy = false
    for (let i = 0; i < barCount; i++) {
      if (smoothedData[i] > 1) {
        hasEnergy = true
        break
      }
    }
    if (!hasEnergy) {
      stopAnimation()
      return
    }
  }

  animId = requestAnimationFrame(render)
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
