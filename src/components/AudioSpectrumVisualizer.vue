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

// 模拟动态声波数据兜底（CORS 保护或无 WebAudio 时呈现高保真物理拟真波动）
const simulatedHeights = ref<number[]>(Array.from({ length: 48 }, () => Math.random() * 24 + 6))
const peakHeights = ref<number[]>(Array.from({ length: 48 }, () => 0))

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  const realData = audioService.getByteFrequencyData()
  const barCount = 36
  const barWidth = (width / barCount) * 0.62
  const gap = (width / barCount) * 0.38
  const centerY = height / 2

  for (let i = 0; i < barCount; i++) {
    let val = 0
    if (playerStore.isPlaying) {
      if (realData && realData.length > 0) {
        val = (realData[i % realData.length] / 255) * (height * 0.42)
      } else {
        const t = Date.now() / 180
        const sine = Math.sin(t + i * 0.38) * 0.5 + 0.5
        val = (simulatedHeights.value[i] || 10) * sine * (height / 80)
        simulatedHeights.value[i] = Math.max(4, simulatedHeights.value[i] * 0.9 + Math.random() * 40 * 0.1)
      }
    } else {
      val = 2.5
    }

    // 峰值回落物理模拟 (Peak decay)
    if (val > (peakHeights.value[i] || 0)) {
      peakHeights.value[i] = val
    } else {
      peakHeights.value[i] = Math.max(0, (peakHeights.value[i] || 0) - 0.75)
    }

    const x = i * (barWidth + gap) + gap / 2
    const currentHeight = Math.max(2.5, val)

    // 上下对称全息霓虹律动柱 (Cyberpunk Aurora Mirror)
    const topY = centerY - currentHeight
    const barTotalHeight = currentHeight * 2

    const grad = ctx.createLinearGradient(0, topY, 0, topY + barTotalHeight)
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.9)')   // 天蓝
    grad.addColorStop(0.3, 'rgba(20, 184, 166, 0.95)') // 极光青
    grad.addColorStop(0.5, 'rgba(16, 185, 129, 1)')    // 翡翠绿
    grad.addColorStop(0.7, 'rgba(20, 184, 166, 0.95)')
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.9)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, topY, barWidth, barTotalHeight, [barWidth / 2])
    ctx.fill()

    // 顶端与底端高亮发光浮标点 (Peak Cap Glow)
    if (playerStore.isPlaying && (peakHeights.value[i] || 0) > 4) {
      const peakY1 = centerY - (peakHeights.value[i] || 0) - 2
      const peakY2 = centerY + (peakHeights.value[i] || 0) + 1
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.fillRect(x, peakY1, barWidth, 1.5)
      ctx.fillRect(x, peakY2, barWidth, 1.5)
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
      width="400"
      height="64"
      class="w-full h-full object-contain filter drop-shadow-[0_0_14px_rgba(16,185,129,0.55)]"
    />
  </div>
</template>
