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
import WindowControls from './components/WindowControls.vue'
import UpdateDialog from './components/UpdateDialog.vue'
import ParticleBackground from './components/ParticleBackground.vue'
import GlobalToast from './components/GlobalToast.vue'
import { usePlayerStore } from './stores/player'
import { useServerStore } from './stores/server'
import { isDesktopApp, isTauriApp, listenTrayActions } from './services/desktop'
import { checkAppUpdate, type UpdateInfo } from './services/updater'
import { initGlobalShortcuts } from './services/shortcuts'

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const showSearch = ref(false)
const isDesktop = ref(isDesktopApp())
const autoUpdateInfo = ref<UpdateInfo | null>(null)
let unlistenTray: (() => void) | undefined
let cleanupShortcuts: (() => Promise<void>) | undefined

// 键盘快捷键监听
function handleKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  const isInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  if (isInput) return

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    showSearch.value = !showSearch.value
  } else if (e.code === 'Space') {
    e.preventDefault()
    playerStore.togglePlay()
  } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    playerStore.next()
  } else if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    playerStore.prev()
  } else if (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    playerStore.setVolume(Math.min(1, playerStore.volume + 0.05))
  } else if (e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    playerStore.setVolume(Math.max(0, playerStore.volume - 0.05))
  }
}

onMounted(async () => {
  serverStore.loadConfig()
  playerStore.initRestoredState()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('contextmenu', handleContextMenu)

  if (isDesktop.value) {
    unlistenTray = await listenTrayActions((action) => {
      if (action === 'toggle_play') {
        playerStore.togglePlay()
      } else if (action === 'prev') {
        playerStore.prev()
      } else if (action === 'next') {
        playerStore.next()
      }
    })

    cleanupShortcuts = await initGlobalShortcuts({
      togglePlay: () => playerStore.togglePlay(),
      prev: () => playerStore.prev(),
      next: () => playerStore.next(),
      volumeUp: () => playerStore.setVolume(Math.min(1, playerStore.volume + 0.05)),
      volumeDown: () => playerStore.setVolume(Math.max(0, playerStore.volume - 0.05)),
    })
  }

  // 仅在原生客户端环境下，启动 3 秒后在后台静默检测版本更新
  if (isTauriApp()) {
    setTimeout(async () => {
      try {
        const res = await checkAppUpdate()
        if (res.available) {
          autoUpdateInfo.value = res
        }
      } catch {
        // 容错静默
      }
    }, 3000)
  }
})

function handleContextMenu(e: MouseEvent) {
  // 禁止默认系统网页右键菜单
  e.preventDefault()
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('contextmenu', handleContextMenu)
  unlistenTray?.()
  cleanupShortcuts?.()
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-[#12131a] text-neutral-100 relative">
    <!-- 桌面极简迷你悬浮窗模式 (仅显示悬浮窗内容，彻底隐藏主界面) -->
    <template v-if="isDesktop && playerStore.showMiniPlayer">
      <MiniPlayerWindow :is-compact-desktop="true" />
    </template>

    <!-- 正常播放器界面 -->
    <template v-else>
      <!-- 桌面端顶部无边框拖拽栏与右上角窗口控制 (仅桌面程序生效) -->
      <header
        v-if="isDesktop"
        data-tauri-drag-region
        class="absolute top-0 left-0 right-0 h-8 flex items-center justify-between z-50 select-none bg-gradient-to-b from-[#12131a]/95 to-transparent backdrop-blur-xs cursor-move"
      >
        <div data-tauri-drag-region class="flex items-center gap-2 pl-3 text-[11px] text-neutral-300 font-medium pointer-events-none">
          <img src="/favicon.svg" class="w-4.5 h-4.5 rounded-sm object-cover" alt="AuraMusic" />
          <span>AuraMusic · 私有云音乐播放器</span>
        </div>
        <WindowControls class="pointer-events-auto" />
      </header>

      <!-- 全局炫彩流光氛围背景与互动音频星空粒子 (微调提高透明度与层次明度，避免死黑沉闷) -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div class="absolute -top-[25%] -left-[10%] w-[650px] h-[650px] rounded-full bg-emerald-500/15 blur-[120px] animate-pulse" />
        <div class="absolute top-[35%] -right-[15%] w-[550px] h-[550px] rounded-full bg-indigo-500/15 blur-[130px]" />
        <div class="absolute -bottom-[15%] left-[25%] w-[650px] h-[650px] rounded-full bg-teal-500/12 blur-[140px]" />
        <ParticleBackground :density="45" />
      </div>

      <!-- 桌面侧栏 (窄屏隐藏) -->
      <DesktopSidebar
        class="hidden md:flex z-20"
        :class="{ 'pt-8': isDesktop }"
        @open-search="showSearch = true"
      />

      <!-- 主工作区 -->
      <main
        class="flex-1 flex flex-col h-full overflow-hidden relative"
        :class="{ 'pt-8': isDesktop }"
        :style="{ paddingTop: !isDesktop ? 'env(safe-area-inset-top, 0px)' : undefined }"
      >
        <div
          class="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 md:px-8"
          :style="{
            paddingBottom: playerStore.currentTrack
              ? 'calc(3.5rem + 3.75rem + max(env(safe-area-inset-bottom, 0px), 8px) + 1rem)'
              : 'calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 0.75rem)'
          }"
        >
          <router-view />
        </div>

        <!-- 桌面端常驻底栏 (高度 80px，仅桌面显示) -->
        <PlayerBar class="hidden md:flex" :desktop-only="true" />

        <!-- 移动端一体化底部停靠系统 (胶囊播放器 + 底部Tab栏联动，绝对物理防重叠) -->
        <div class="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none flex flex-col justify-end">
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-3 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-3 scale-95"
          >
            <div v-if="playerStore.currentTrack" class="pointer-events-auto px-2.5 pb-2">
              <PlayerBar :mobile-only="true" />
            </div>
          </transition>
          <MobileTabBar class="pointer-events-auto" />
        </div>
      </main>

      <!-- 播放队列抽屉 (提高层级为 z-60，确保全屏模式下也能顺畅呼出) -->
      <QueueDrawer />

      <!-- 全屏黑胶/歌词沉浸视图 (z-50) -->
      <FullscreenPlayer />

      <!-- 全局快捷搜索浮窗 -->
      <SearchModal v-model="showSearch" />

      <!-- 专业 10 段图形均衡器 -->
      <EqualizerModal />

      <!-- Web 环境下的迷你浮窗 (仅在用户主动打开时显现) -->
      <MiniPlayerWindow v-if="!isDesktop && playerStore.showMiniPlayer" />

      <!-- 版本更新提醒气泡 -->
      <UpdateDialog v-if="autoUpdateInfo" :update-info="autoUpdateInfo" />
    </template>

    <!-- 全局丝滑极光胶囊通知系统 -->
    <GlobalToast />
  </div>
</template>
