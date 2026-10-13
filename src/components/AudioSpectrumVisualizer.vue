<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'

const playerStore = usePlayerStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

// 模拟动态声波数据兜底（CORS 保护或无 WebAudio 时呈现优雅流体动效）
const simulatedHeights = ref<number[]>(Array.from({ length: 32 }, () => Math.random() * 20 + 5))

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  const realData = audioService.getByteFrequencyData()
  const barCount = 28
  const barWidth = (width / barCount) * 0.65
  const gap = (width / barCount) * 0.35

  for (let i = 0; i < barCount; i++) {
    let val = 0
    if (playerStore.isPlaying) {
      if (realData && realData.length > 0) {
        val = (realData[i % realData.length] / 255) * height * 0.9
      } else {
        // 自然正弦扰动 + 随机跳跃
        const t = Date.now() / 200
        const sine = Math.sin(t + i * 0.4) * 0.5 + 0.5
        val = (simulatedHeights.value[i] || 10) * sine * (height / 50)
        simulatedHeights.value[i] = Math.max(4, (simulatedHeights.value[i] * 0.9 + Math.random() * 35 * 0.1))
      }
    } else {
      val = 3 // 暂停时微弱常驻底线
    }

    const x = i * (barWidth + gap) + gap / 2
    const barHeight = Math.max(3, val)
    const y = height - barHeight

    // 绘制圆角渐变律动柱
    const grad = ctx.createLinearGradient(0, height, 0, 0)
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.4)')
    grad.addColorStop(0.6, 'rgba(20, 184, 166, 0.8)')
    grad.addColorStop(1, 'rgba(94, 234, 212, 1)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0])
    ctx.fill()
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
  <div class="relative flex items-center justify-center h-16 w-full max-w-md mx-auto pointer-events-none">
    <canvas ref="canvasRef" width="360" height="64" class="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(20,184,166,0.3)]"></canvas>
  </div>
</template>
