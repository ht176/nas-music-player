<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Minus, Square, Copy, X } from 'lucide-vue-next'
import { isDesktopApp, minimizeWindow, toggleMaximizeWindow, closeWindow, isWindowMaximized } from '../services/desktop'

const isDesktop = ref(isDesktopApp())
const isMaximized = ref(false)

async function checkMaximized() {
  if (isDesktop.value) {
    isMaximized.value = await isWindowMaximized()
  }
}

async function handleToggleMaximize() {
  await toggleMaximizeWindow()
  await checkMaximized()
}

onMounted(() => {
  checkMaximized()
  window.addEventListener('resize', checkMaximized)
})
</script>

<template>
  <div v-if="isDesktop" class="flex items-center h-8 z-50 select-none text-neutral-400">
    <button
      class="w-11 h-8 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
      title="最小化"
      @click="minimizeWindow"
    >
      <Minus class="w-3.5 h-3.5" />
    </button>
    <button
      class="w-11 h-8 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
      :title="isMaximized ? '还原' : '最大化'"
      @click="handleToggleMaximize"
    >
      <Copy v-if="isMaximized" class="w-3 h-3 rotate-180" />
      <Square v-else class="w-3 h-3" />
    </button>
    <button
      class="w-11 h-8 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
      title="关闭 (最小化到系统托盘)"
      @click="closeWindow"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
</template>
