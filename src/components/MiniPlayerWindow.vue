<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useServerStore } from '../stores/server'
import { Play, Pause, SkipBack, SkipForward, X, Maximize2 } from 'lucide-vue-next'

const playerStore = usePlayerStore()
const serverStore = useServerStore()

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(playerStore.currentTrack?.coverArtId, 160) || ''
})

const currentLyric = computed(() => {
  if (playerStore.lyrics.length && playerStore.currentLyricIndex >= 0) {
    return playerStore.lyrics[playerStore.currentLyricIndex]?.text || ''
  }
  return playerStore.currentTrack?.artist || '暂无歌词'
})
</script>

<template>
  <div
    v-if="playerStore.showMiniPlayer && playerStore.currentTrack"
    class="fixed bottom-24 right-6 w-80 bg-neutral-900/95 border border-neutral-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-50 animate-fade-in flex flex-col gap-2.5 select-none"
  >
    <!-- 头部拖拽区与控制按钮 -->
    <div class="flex items-center justify-between text-xs text-neutral-400">
      <div class="flex items-center gap-1.5 font-medium text-[11px]">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        桌面迷你播放器
      </div>
      <div class="flex items-center gap-1">
        <button
          class="p-1 hover:text-white rounded hover:bg-neutral-800 transition cursor-pointer"
          title="全屏沉浸播放"
          @click="playerStore.showFullscreen = true"
        >
          <Maximize2 class="w-3.5 h-3.5" />
        </button>
        <button
          class="p-1 hover:text-white rounded hover:bg-neutral-800 transition cursor-pointer"
          title="关闭迷你小窗"
          @click="playerStore.showMiniPlayer = false"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 歌曲卡片信息 -->
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-neutral-800 overflow-hidden shrink-0 shadow">
        <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover" />
      </div>
      <div class="truncate flex-1">
        <div class="text-xs font-bold text-white truncate">
          {{ playerStore.currentTrack.title }}
        </div>
        <!-- 动态悬浮歌词展示 -->
        <div class="text-[11px] text-emerald-400 truncate mt-0.5 font-medium transition-all">
          {{ currentLyric }}
        </div>
      </div>
    </div>

    <!-- 控制按键与极简进度条 -->
    <div class="flex items-center justify-between pt-1 border-t border-neutral-800/80">
      <div class="flex-1 mr-3">
        <div class="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-emerald-500 rounded-full transition-all duration-300"
            :style="{ width: `${(playerStore.currentTime / (playerStore.duration || 1)) * 100}%` }"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button class="text-neutral-400 hover:text-white p-1 transition cursor-pointer" @click="playerStore.prev">
          <SkipBack class="w-4 h-4 fill-current" />
        </button>
        <button
          class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow hover:scale-105 active:scale-95 transition cursor-pointer"
          @click="playerStore.togglePlay"
        >
          <Pause v-if="playerStore.isPlaying" class="w-3.5 h-3.5 fill-current" />
          <Play v-else class="w-3.5 h-3.5 fill-current ml-0.5" />
        </button>
        <button class="text-neutral-400 hover:text-white p-1 transition cursor-pointer" @click="playerStore.next">
          <SkipForward class="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  </div>
</template>
