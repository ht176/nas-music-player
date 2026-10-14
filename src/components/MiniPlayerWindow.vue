<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useServerStore } from '../stores/server'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Maximize2,
  Heart,
  FolderPlus,
} from 'lucide-vue-next'
import { isDesktopApp, exitMiniMode, expandMiniWindow, collapseMiniWindow } from '../services/desktop'
import AddToPlaylistModal from './AddToPlaylistModal.vue'

const props = defineProps<{
  isCompactDesktop?: boolean
}>()

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const showAddToPlaylist = ref(false)

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(playerStore.currentTrack?.coverArtId, 160) || ''
})

const currentLyric = computed(() => {
  if (playerStore.lyrics.length && playerStore.currentLyricIndex >= 0) {
    return playerStore.lyrics[playerStore.currentLyricIndex]?.text || ''
  }
  return playerStore.currentTrack?.artist || '暂无歌词'
})

// 当加入歌单弹窗打开/关闭时，在桌面迷你模式下动态扩展/收缩窗口高度
watch(showAddToPlaylist, async (val) => {
  if (props.isCompactDesktop && isDesktopApp()) {
    if (val) {
      await expandMiniWindow()
    } else {
      await collapseMiniWindow()
    }
  }
})

async function handleRestore() {
  playerStore.showMiniPlayer = false
  if (isDesktopApp()) {
    await exitMiniMode()
  }
}

async function handleCloseMini() {
  playerStore.showMiniPlayer = false
  if (isDesktopApp()) {
    await exitMiniMode()
  }
}

function handleOpenAddToPlaylist() {
  showAddToPlaylist.value = true
}
</script>

<template>
  <div
    v-if="playerStore.currentTrack"
    @dblclick.prevent.stop=""
    :class="[
      isCompactDesktop
        ? 'w-full h-full bg-[#111116] border border-white/10 rounded-xl px-3 py-2 flex flex-col justify-between select-none shadow-2xl relative overflow-hidden'
        : 'fixed bottom-24 right-6 w-80 bg-neutral-900/95 border border-neutral-700/80 rounded-2xl shadow-2xl backdrop-blur-xl px-3 py-2.5 z-50 animate-fade-in flex flex-col gap-1.5 select-none'
    ]"
  >
    <!-- 上半部分：左侧封面 + 中间歌曲名与实时歌词(可拖拽区域) + 右上角还原与关闭 -->
    <div
      data-tauri-drag-region
      @dblclick.prevent.stop=""
      class="flex items-center gap-2.5 cursor-move flex-1 min-h-0"
    >
      <!-- 封面 -->
      <div class="w-9 h-9 rounded-lg bg-neutral-800 overflow-hidden shrink-0 shadow pointer-events-none border border-white/10">
        <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover" />
      </div>

      <!-- 歌名与歌词 -->
      <div class="truncate flex-1 pointer-events-none min-w-0">
        <div class="text-xs font-bold text-white truncate leading-tight">
          {{ playerStore.currentTrack.title }}
        </div>
        <!-- 动态悬浮歌词展示 -->
        <div class="text-[11px] text-emerald-400 truncate mt-0.5 font-medium transition-all leading-tight">
          {{ currentLyric }}
        </div>
      </div>

      <!-- 右上角快捷操作：还原窗口与关闭迷你播放器 -->
      <div class="flex items-center gap-0.5 shrink-0 text-neutral-400 self-start pointer-events-auto">
        <button
          class="p-1 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
          title="还原并展开主界面"
          @click.stop="handleRestore"
        >
          <Maximize2 class="w-3.5 h-3.5" />
        </button>
        <button
          class="p-1 hover:text-rose-400 rounded hover:bg-white/10 transition cursor-pointer"
          title="关闭迷你小窗"
          @click.stop="handleCloseMini"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 下半部分：极简进度条 + 核心播放控制 + 右侧快捷功能(收藏 / 加入歌单) -->
    <div class="flex items-center justify-between pt-1 border-t border-neutral-800/80 gap-2">
      <!-- 极简进度条 -->
      <div class="flex-1 min-w-[45px]">
        <div class="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-emerald-500 rounded-full transition-all duration-300"
            :style="{ width: `${(playerStore.currentTime / (playerStore.duration || 1)) * 100}%` }"
          />
        </div>
      </div>

      <!-- 核心播放控制 (上一首 / 播放暂停 / 下一首) -->
      <div class="flex items-center gap-1.5 shrink-0">
        <button class="text-neutral-400 hover:text-white p-1 transition cursor-pointer" @click="playerStore.prev" title="上一首">
          <SkipBack class="w-3.5 h-3.5 fill-current" />
        </button>
        <button
          class="w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow hover:scale-105 active:scale-95 transition cursor-pointer font-bold"
          @click="playerStore.togglePlay"
          title="播放/暂停"
        >
          <Pause v-if="playerStore.isPlaying" class="w-3 h-3 fill-current" />
          <Play v-else class="w-3 h-3 fill-current ml-0.5" />
        </button>
        <button class="text-neutral-400 hover:text-white p-1 transition cursor-pointer" @click="playerStore.next" title="下一首">
          <SkipForward class="w-3.5 h-3.5 fill-current" />
        </button>
      </div>

      <!-- 右侧音乐快捷操作 (收藏 / 加入歌单) -->
      <div class="flex items-center gap-1 pl-1.5 border-l border-neutral-800 shrink-0 text-neutral-400">
        <!-- 收藏按钮 -->
        <button
          class="p-1 rounded hover:bg-neutral-800 transition cursor-pointer"
          :class="{
            'text-rose-500 hover:text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]': playerStore.currentTrack.starred,
            'text-neutral-400 hover:text-rose-400': !playerStore.currentTrack.starred
          }"
          :title="playerStore.currentTrack.starred ? '取消收藏' : '收藏'"
          @click.stop="playerStore.toggleStar(playerStore.currentTrack)"
        >
          <Heart class="w-3.5 h-3.5" :class="{ 'fill-current': playerStore.currentTrack.starred }" />
        </button>

        <!-- 加入歌单按钮 -->
        <button
          class="p-1 text-neutral-400 hover:text-emerald-400 rounded hover:bg-neutral-800 transition cursor-pointer"
          title="加入歌单"
          @click.stop="handleOpenAddToPlaylist"
        >
          <FolderPlus class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 加入歌单选择弹窗 -->
    <AddToPlaylistModal
      v-model="showAddToPlaylist"
      :track="playerStore.currentTrack"
    />
  </div>
</template>
