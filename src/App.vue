<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import DesktopSidebar from './components/DesktopSidebar.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import PlayerBar from './components/PlayerBar.vue'
import FullscreenPlayer from './components/FullscreenPlayer.vue'
import QueueDrawer from './components/QueueDrawer.vue'
import SearchModal from './components/SearchModal.vue'
import EqualizerModal from './components/EqualizerModal.vue'
import MiniPlayerWindow from './components/MiniPlayerWindow.vue'
import { usePlayerStore } from './stores/player'
import { useServerStore } from './stores/server'

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const showSearch = ref(false)

// 监听快捷键 Ctrl+K / Cmd+K 呼出全局搜索
function handleKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    showSearch.value = !showSearch.value
  }
}

onMounted(() => {
  serverStore.loadConfig()
  playerStore.initRestoredState()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-[#0a0a0f] text-neutral-100 relative">
    <!-- 全局炫彩流光氛围背景 -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      <div class="absolute -top-[30%] -left-[10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[130px] animate-pulse" />
      <div class="absolute top-[40%] -right-[15%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[140px]" />
      <div class="absolute -bottom-[20%] left-[25%] w-[600px] h-[600px] rounded-full bg-rose-500/8 blur-[150px]" />
    </div>

    <!-- 桌面侧栏 (窄屏隐藏) -->
    <DesktopSidebar class="hidden md:flex z-20" @open-search="showSearch = true" />

    <!-- 主工作区 -->
    <main class="flex-1 flex flex-col h-full overflow-hidden relative">
      <div class="flex-1 overflow-y-auto px-4 py-6 md:px-8" :class="{ 'pb-28': playerStore.currentTrack, 'pb-16': !playerStore.currentTrack }">
        <router-view />
      </div>

      <!-- 常驻底部播放控制栏 -->
      <PlayerBar />

      <!-- 移动端底部 Tab 栏 -->
      <MobileTabBar />
    </main>

    <!-- 播放队列抽屉 -->
    <QueueDrawer />

    <!-- 全屏黑胶/歌词沉浸视图 -->
    <FullscreenPlayer />

    <!-- 全局快捷搜索浮窗 -->
    <SearchModal v-model="showSearch" />

    <!-- 专业 10 段图形均衡器 -->
    <EqualizerModal />

    <!-- 桌面极简悬浮迷你播放器 -->
    <MiniPlayerWindow />
  </div>
</template>
