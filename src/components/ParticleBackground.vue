<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { audioService } from '../services/audio'
import { usePlayerStore } from '../stores/player'
import { useThemeStore } from '../stores/theme'

const props = withDefaults(
  defineProps<{
    interactive?: boolean
    density?: number
  }>(),
  {
    interactive: true,
    density: 55,
  }
)

const playerStore = usePlayerStore()
const themeStore = useThemeStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

interface Particle {
  x: number
  y: number
  baseRadius: number
  radius: number
  vx: number
  vy: number
  alpha: number
  color: string
  pulsePhase: number
}

const particles: Particle[] = []

watch(() => themeStore.currentThemeId, () => {
  if (canvasRef.value) {
    initParticles(canvasRef.value.width, canvasRef.value.height)
  }
})

let mouse = { x: -1000, y: -1000 }

function handleMouseMove(e: MouseEvent) {
  if (!props.interactive) return
  mouse.x = e.clientX
  mouse.y = e.clientY
}

function handleMouseLeave() {
  mouse.x = -1000
  mouse.y = -1000
}

function initParticles(width: number, height: number) {
  particles.length = 0
  const count = Math.min(90, Math.floor((width * height) / 22000) * (props.density / 40))

  for (let i = 0; i < count; i++) {
    const baseRadius = Math.random() * 2.2 + 0.8
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      baseRadius,
      radius: baseRadius,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      alpha: Math.random() * 0.45 + 0.15,
      color: themeStore.currentTheme.colors.particles[Math.floor(Math.random() * themeStore.currentTheme.colors.particles.length)],
      pulsePhase: Math.random() * Math.PI * 2,
    })
  }
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  if (!parent) return
  const rect = parent.getBoundingClientRect()
  canvas.width = rect.width || window.innerWidth
  canvas.height = rect.height || window.innerHeight
  initParticles(canvas.width, canvas.height)
}

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)

  // 获取实时音频频域能量倍率（0 ~ 1.5）
  let energyMultiplier = 1
  if (playerStore.isPlaying) {
    const freq = audioService.getByteFrequencyData()
    if (freq && freq.length > 0) {
      let sum = 0
      const sampleCount = Math.min(16, freq.length)
      for (let i = 0; i < sampleCount; i++) {
        sum += freq[i]
      }
      const avg = sum / sampleCount
      energyMultiplier = 1 + (avg / 255) * 1.6
    } else {
      energyMultiplier = 1.25 + Math.sin(Date.now() / 400) * 0.25
    }
  }

  // 1. 绘制粒子
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    p.pulsePhase += 0.02 * energyMultiplier

    // 随音乐节拍呼吸
    p.radius = p.baseRadius * (1 + Math.sin(p.pulsePhase) * 0.3 * (energyMultiplier - 0.5))

    // 移动
    p.x += p.vx * energyMultiplier
    p.y += p.vy * energyMultiplier

    // 边缘环绕
    if (p.x < -10) p.x = width + 10
    if (p.x > width + 10) p.x = -10
    if (p.y < -10) p.y = height + 10
    if (p.y > height + 10) p.y = -10

    // 鼠标排斥/牵引
    const dx = mouse.x - p.x
    const dy = mouse.y - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 130 && dist > 0) {
      const force = (130 - dist) / 130
      p.x -= (dx / dist) * force * 2.5
      p.y -= (dy / dist) * force * 2.5
    }

    // 绘制柔和星芒光晕
    ctx.beginPath()
    const currentAlpha = Math.min(0.85, p.alpha * (energyMultiplier * 0.8))
    ctx.fillStyle = `${p.color} ${currentAlpha})`
    ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2)
    ctx.fill()
  }

  // 2. 绘制粒子之间的近邻能量连线 (Constellation 效果)
  const maxConnDist = 95
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i]
      const p2 = particles[j]
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < maxConnDist) {
        const lineAlpha = (1 - dist / maxConnDist) * 0.16 * energyMultiplier
        ctx.beginPath()
        ctx.strokeStyle = `rgba(16, 185, 129, ${Math.min(0.3, lineAlpha)})`
        ctx.lineWidth = 0.75
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }
    }
  }

  animId = requestAnimationFrame(render)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  if (props.interactive) {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
  }
  render()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeave)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none absolute inset-0 z-0 opacity-80 transition-opacity duration-1000"
  />
</template>
