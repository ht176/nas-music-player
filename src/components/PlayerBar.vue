<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useServerStore } from '../stores/server'
import { isDesktopApp, enterMiniMode, exitMiniMode } from '../services/desktop'
import TrackInfoModal from './TrackInfoModal.vue'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Maximize2,
  FileText,
  Heart,
  ListMusic,
  Sliders,
  PictureInPicture2,
  Info,
} from 'lucide-vue-next'

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const showTrackInfo = ref(false)

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(playerStore.currentTrack?.coverArtId, 120) || ''
})

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const progressPercent = computed(() => {
  const dur = playerStore.duration || 1
  return Math.min(100, Math.max(0, (playerStore.currentTime / dur) * 100))
})

const currentLyricText = computed(() => {
  if (playerStore.lyrics.length && playerStore.currentLyricIndex >= 0) {
    return playerStore.lyrics[playerStore.currentLyricIndex]?.text || ''
  }
  return ''
})

const onProgressChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  playerStore.seek(val)
}

const onVolumeChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  playerStore.setVolume(val)
}

async function toggleMiniPlayer() {
  if (playerStore.showMiniPlayer) {
    playerStore.showMiniPlayer = false
    if (isDesktopApp()) {
      await exitMiniMode()
    }
  } else {
    playerStore.showMiniPlayer = true
    if (isDesktopApp()) {
      await enterMiniMode()
    }
  }
}
</script>

<template>
  <div v-if="playerStore.currentTrack" class="fixed bottom-0 left-0 right-0 h-20 glass-panel border-t border-white/10 px-5 flex items-center justify-between z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
    <!-- 顶部极细渐变微光线 -->
    <div class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

    <!-- 主界面浮动单行实时歌词胶囊 (与底部控制栏显著拉开间距: -top-16，内边距增大: px-6 py-2.5) -->
    <div
      v-if="currentLyricText"
      class="absolute -top-16 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full bg-neutral-900/95 border border-emerald-500/35 text-sm sm:text-base text-emerald-300 font-semibold backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.7)] flex items-center gap-2.5 cursor-pointer hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all max-w-[85vw] group overflow-hidden"
      @click="playerStore.showFullscreen = true"
      title="点击进入全屏沉浸歌词"
    >
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.9)]"></span>
      <div class="relative overflow-hidden h-6 flex items-center max-w-[70vw]">
        <Transition name="lyric-scroll" mode="out-in">
          <span :key="currentLyricText" class="truncate tracking-wide block select-none">
            {{ currentLyricText }}
          </span>
        </Transition>
      </div>
    </div>

    <!-- 左侧：当前歌曲信息与单行歌词 -->
    <div class="flex items-center gap-3.5 w-1/4 min-w-[200px]">
      <div
        class="h-12 w-12 rounded-xl overflow-hidden bg-neutral-800 shrink-0 cursor-pointer shadow-md group relative border border-white/10 transition-transform duration-300 hover:scale-105"
        @click="playerStore.showFullscreen = true"
      >
        <img v-if="coverUrl" :src="coverUrl" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-xs">
          <Maximize2 class="w-4 h-4 text-white drop-shadow" />
        </div>
      </div>
      <div class="truncate">
        <div class="text-sm font-semibold text-neutral-100 truncate cursor-pointer hover:text-emerald-400 transition-colors" @click="playerStore.showFullscreen = true">
          {{ playerStore.currentTrack.title }}
        </div>
        <div class="text-xs text-neutral-400 truncate mt-0.5 flex items-center gap-1.5">
          <span class="truncate">{{ playerStore.currentTrack.artist }}</span>
        </div>
      </div>
      <button
        class="text-neutral-400 hover:text-white transition-all p-1.5 rounded-lg hover:bg-white/5 cursor-pointer shrink-0 ml-1"
        :class="{ 'text-rose-500 hover:text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]': playerStore.currentTrack.starred }"
        title="收藏"
        @click="playerStore.toggleStar(playerStore.currentTrack)"
      >
        <Heart class="w-4 h-4" :class="{ 'fill-current': playerStore.currentTrack.starred }" />
      </button>
    </div>

    <!-- 中间：核心控制与区分已播/未播的进度条 -->
    <div class="flex flex-col items-center max-w-xl w-2/4">
      <div class="flex items-center gap-6 mb-1.5">
        <button class="text-neutral-300 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer p-1" @click="playerStore.prev" title="上一首">
          <SkipBack class="w-5 h-5 fill-current" />
        </button>

        <button
          class="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-neutral-950 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition duration-200 cursor-pointer font-bold"
          @click="playerStore.togglePlay"
          :title="playerStore.isPlaying ? '暂停' : '播放'"
        >
          <Pause v-if="playerStore.isPlaying" class="w-5 h-5 fill-current" />
          <Play v-else class="w-5 h-5 fill-current ml-0.5" />
        </button>

        <button class="text-neutral-300 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer p-1" @click="playerStore.next" title="下一首">
          <SkipForward class="w-5 h-5 fill-current" />
        </button>
      </div>

      <!-- 进度条：清晰区分已播放与未播放轨道 -->
      <div class="flex items-center gap-2.5 w-full text-xs text-neutral-400 font-mono">
        <span class="w-9 text-right text-[11px]">{{ formatTime(playerStore.currentTime) }}</span>
        <input
          type="range"
          min="0"
          :max="playerStore.duration || 100"
          :value="playerStore.currentTime"
          @input="onProgressChange"
          class="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:h-2 transition-all shadow-inner"
          :style="{
            background: `linear-gradient(to right, #10b981 ${progressPercent}%, rgba(255, 255, 255, 0.15) ${progressPercent}%)`
          }"
        />
        <span class="w-9 text-[11px]">{{ formatTime(playerStore.duration) }}</span>
      </div>
    </div>

    <!-- 右侧：播放模式、迷你悬浮窗、音量、EQ、播放列表与全屏歌词触发 -->
    <div class="flex items-center justify-end gap-2 w-1/4">
      <!-- 播放模式切换 (支持列表循环 / 单曲循环 / 随机播放) -->
      <button
        class="text-neutral-400 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5 cursor-pointer"
        :class="{ 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]': playerStore.playMode !== 'loop' }"
        @click="playerStore.togglePlayMode"
        :title="playerStore.playMode === 'random' ? '当前模式: 随机播放' : playerStore.playMode === 'single' ? '当前模式: 单曲循环' : '当前模式: 列表循环'"
      >
        <Shuffle v-if="playerStore.playMode === 'random'" class="w-4 h-4" />
        <Repeat1 v-else-if="playerStore.playMode === 'single'" class="w-4 h-4" />
        <Repeat v-else class="w-4 h-4" />
      </button>

      <!-- 桌面端独占：迷你浮窗模式 (网页端/移动端不展示) -->
      <button
        v-if="isDesktopApp()"
        class="text-neutral-400 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5 cursor-pointer"
        :class="{ 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20': playerStore.showMiniPlayer }"
        @click="toggleMiniPlayer"
        title="桌面迷你悬浮窗"
      >
        <PictureInPicture2 class="w-4 h-4" />
      </button>

      <button
        class="text-neutral-400 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5 cursor-pointer"
        :class="{ 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20': playerStore.showEQModal }"
        @click="playerStore.showEQModal = !playerStore.showEQModal"
        title="10段图形均衡器"
      >
        <Sliders class="w-4 h-4" />
      </button>

      <button
        class="text-neutral-400 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5 cursor-pointer"
        :class="{ 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20': playerStore.showQueueDrawer }"
        @click="playerStore.showQueueDrawer = !playerStore.showQueueDrawer"
        title="当前播放队列"
      >
        <ListMusic class="w-4 h-4" />
      </button>

      <button
        class="text-neutral-400 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5 cursor-pointer"
        :class="{ 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20': showTrackInfo }"
        @click="showTrackInfo = !showTrackInfo"
        title="查看歌曲文件属性与物理存储路径"
      >
        <Info class="w-4 h-4" />
      </button>

      <button
        class="text-neutral-400 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5 cursor-pointer"
        :class="{ 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20': playerStore.showFullscreen }"
        @click="playerStore.showFullscreen = !playerStore.showFullscreen"
        title="歌词与全屏"
      >
        <FileText class="w-4 h-4" />
      </button>

      <div class="hidden sm:flex items-center gap-1.5 pl-2">
        <button
          class="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
          @click="playerStore.volume === 0 ? playerStore.setVolume(0.8) : playerStore.setVolume(0)"
          :title="playerStore.volume === 0 ? '取消静音' : '点击静音'"
        >
          <VolumeX v-if="playerStore.volume === 0" class="w-4 h-4 text-rose-400" />
          <Volume2 v-else class="w-4 h-4" />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="playerStore.volume"
          @input="onVolumeChange"
          class="w-20 h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:h-2 transition-all shadow-inner"
          :style="{
            background: `linear-gradient(to right, #10b981 ${playerStore.volume * 100}%, rgba(255, 255, 255, 0.15) ${playerStore.volume * 100}%)`
          }"
        />
      </div>
    </div>

    <!-- 歌曲文件属性与 NAS 物理信息弹窗 -->
    <TrackInfoModal v-model="showTrackInfo" />
  </div>
</template>

<style scoped>
.lyric-scroll-enter-active,
.lyric-scroll-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.lyric-scroll-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.lyric-scroll-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}
</style>
