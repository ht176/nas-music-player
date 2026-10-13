<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useServerStore } from '../stores/server'
import AudioSpectrumVisualizer from './AudioSpectrumVisualizer.vue'
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sliders,
  Moon,
  Sparkles,
  Repeat,
  Shuffle,
} from 'lucide-vue-next'

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const lyricsContainer = ref<HTMLElement | null>(null)
const showSleepMenu = ref(false)

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(playerStore.currentTrack?.coverArtId, 600) || ''
})

// 格式化时间
const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const onProgressChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  playerStore.seek(val)
}

const progressPercent = computed(() => {
  const dur = playerStore.duration || 1
  return Math.min(100, Math.max(0, (playerStore.currentTime / dur) * 100))
})

// 歌词滚动居中同步
watch(
  () => playerStore.currentLyricIndex,
  (newIdx) => {
    if (newIdx < 0 || !lyricsContainer.value) return
    nextTick(() => {
      const activeEl = lyricsContainer.value?.querySelector(`[data-index="${newIdx}"]`) as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }
)
</script>

<template>
  <div
    v-if="playerStore.showFullscreen && playerStore.currentTrack"
    class="fixed inset-0 z-50 bg-neutral-950 flex flex-col justify-between p-6 sm:p-10 overflow-hidden animate-fade-in select-none"
  >
    <!-- Apple Music 风格动态极光背景 -->
    <div class="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      <div
        class="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-cover bg-center opacity-30 blur-[100px] scale-125 animate-pulse-slow"
        :style="{ backgroundImage: `url(${coverUrl})` }"
      />
      <div class="absolute inset-0 bg-neutral-950/70 backdrop-blur-2xl" />
    </div>

    <!-- 顶部导航与功能栏 -->
    <div class="flex items-center justify-between">
      <button
        class="p-2 rounded-full hover:bg-white/10 transition cursor-pointer text-neutral-300"
        @click="playerStore.showFullscreen = false"
      >
        <ChevronDown class="w-6 h-6" />
      </button>

      <!-- 音质徽章 -->
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm">
          <Sparkles class="w-3 h-3" />
          {{ playerStore.currentTrack.suffix || 'FLAC' }} LOSSLESS
        </span>
        <span v-if="playerStore.currentTrack.bitRate" class="text-[11px] text-neutral-400 font-mono">
          {{ playerStore.currentTrack.bitRate }} kbps
        </span>
      </div>

      <!-- 右上角工具：均衡器与睡眠定时器 -->
      <div class="flex items-center gap-2 relative">
        <button
          class="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="音效均衡器"
          @click="playerStore.showEQModal = true"
        >
          <Sliders class="w-5 h-5" />
        </button>

        <!-- 睡眠定时器按钮 -->
        <button
          class="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer relative"
          :class="{ 'text-emerald-400': playerStore.sleepTimerSecondsLeft > 0 }"
          title="睡眠定时器"
          @click="showSleepMenu = !showSleepMenu"
        >
          <Moon class="w-5 h-5" />
          <span
            v-if="playerStore.sleepTimerSecondsLeft > 0"
            class="absolute -top-1 -right-1 text-[9px] bg-emerald-500 text-neutral-950 font-bold px-1 rounded-full font-mono"
          >
            {{ Math.ceil(playerStore.sleepTimerSecondsLeft / 60) }}m
          </span>
        </button>

        <!-- 睡眠定时器选择下拉 -->
        <div
          v-if="showSleepMenu"
          class="absolute top-12 right-0 bg-neutral-900 border border-neutral-800 rounded-xl p-2 shadow-2xl space-y-1 w-36 z-50 animate-fade-in"
        >
          <div class="text-[10px] text-neutral-500 font-bold px-2 py-1">定时关闭</div>
          <button
            v-for="min in [0, 15, 30, 45, 60]"
            :key="min"
            class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-neutral-800 transition cursor-pointer"
            :class="[
              playerStore.sleepTimerMinutes === min ? 'text-emerald-400 font-bold' : 'text-neutral-300',
            ]"
            @click="playerStore.setSleepTimer(min); showSleepMenu = false"
          >
            {{ min === 0 ? '关闭定时器' : `${min} 分钟后停止` }}
          </button>
        </div>
      </div>
    </div>

    <!-- 中部：唱片与歌词分栏 -->
    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto w-full my-4 overflow-hidden">
      <!-- 左栏：唱片封面 / 黑胶唱盘机模拟 -->
      <div class="flex flex-col items-center justify-center relative">
        <!-- 模拟黑胶唱盘机外环与黑胶光盘 -->
        <div class="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
          <!-- 黑胶唱盘大圆盘 -->
          <div
            class="w-full h-full rounded-full bg-neutral-950 p-2 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 relative flex items-center justify-center"
            :class="[playerStore.isPlaying ? 'animate-vinyl' : '']"
            style="background: radial-gradient(circle, #1a1a1a 0%, #0d0d0d 40%, #151515 70%, #000 100%);"
          >
            <!-- 唱片黑胶微同心圆沟槽纹理层 -->
            <div class="absolute inset-2 sm:inset-3 rounded-full border border-white/[0.04] pointer-events-none"></div>
            <div class="absolute inset-6 sm:inset-8 rounded-full border border-white/[0.03] pointer-events-none"></div>
            <div class="absolute inset-10 sm:inset-14 rounded-full border border-white/[0.03] pointer-events-none"></div>
            <div class="absolute inset-16 sm:inset-20 rounded-full border border-white/[0.04] pointer-events-none"></div>

            <!-- 唱片黑胶反光高光锥形渐变 -->
            <div
              class="absolute inset-0 rounded-full pointer-events-none opacity-20"
              style="background: conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.2) 60deg, transparent 120deg, rgba(255,255,255,0.2) 240deg, transparent 300deg);"
            ></div>

            <!-- 唱片中心圆形封面 (Label) -->
            <div class="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full overflow-hidden shadow-2xl relative border-2 sm:border-4 border-neutral-900 z-10">
              <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover select-none" />
              <!-- 唱片中心金属轴孔 -->
              <div class="absolute inset-0 m-auto w-6 h-6 rounded-full bg-neutral-950 border-2 border-neutral-700/80 shadow-inner flex items-center justify-center">
                <div class="w-1.5 h-1.5 rounded-full bg-white/40"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center max-w-sm">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate drop-shadow-md">{{ playerStore.currentTrack.title }}</h2>
          <p class="text-sm font-medium text-neutral-400 mt-2 truncate">{{ playerStore.currentTrack.artist }} · {{ playerStore.currentTrack.album }}</p>
        </div>

        <!-- 动态律动频谱仪 -->
        <div class="w-full mt-3">
          <AudioSpectrumVisualizer />
        </div>
      </div>

      <!-- 右栏：逐行/逐字同步滚动歌词 -->
      <div
        ref="lyricsContainer"
        class="h-72 md:h-full max-h-[520px] overflow-y-auto flex flex-col items-center md:items-start text-center md:text-left space-y-8 py-28 select-none mask-gradient px-4 scroll-smooth"
      >
        <template v-if="playerStore.lyrics.length > 0">
          <div
            v-for="(line, idx) in playerStore.lyrics"
            :key="idx"
            :data-index="idx"
            class="transition-all duration-300 cursor-pointer font-medium max-w-lg leading-relaxed lyric-text"
            :class="[
              idx === playerStore.currentLyricIndex
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white text-2xl sm:text-3xl font-extrabold scale-105 origin-left drop-shadow-[0_0_20px_rgba(16,185,129,0.35)] tracking-normal'
                : 'text-neutral-500 hover:text-neutral-300 text-lg sm:text-xl scale-100 opacity-40 font-normal hover:opacity-80',
            ]"
            @click="playerStore.seek(line.time)"
          >
            {{ line.text }}
          </div>
        </template>
        <div v-else class="text-neutral-500 text-base my-auto mx-auto flex flex-col items-center gap-3">
          <Sparkles class="w-7 h-7 text-emerald-500/50 animate-pulse" />
          <span class="font-medium tracking-wide">沉浸纯音乐旋律</span>
        </div>
      </div>
    </div>

    <!-- 底部：全功能控制条 -->
    <div class="max-w-xl mx-auto w-full space-y-4 pb-3">
      <!-- 进度条 -->
      <div class="flex items-center gap-3 w-full text-xs text-neutral-400 font-mono">
        <span class="w-10 text-right">{{ formatTime(playerStore.currentTime) }}</span>
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
        <span class="w-10">{{ formatTime(playerStore.duration) }}</span>
      </div>

      <!-- 核心按键控制 -->
      <div class="flex items-center justify-between px-4">
        <button
          class="text-neutral-400 hover:text-white transition-all cursor-pointer p-2 rounded-xl hover:bg-white/5"
          :class="{ 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]': playerStore.playMode === 'random' }"
          @click="playerStore.togglePlayMode"
        >
          <Shuffle v-if="playerStore.playMode === 'random'" class="w-5 h-5" />
          <Repeat v-else class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-7">
          <button class="text-neutral-300 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer p-1" @click="playerStore.prev">
            <SkipBack class="w-7 h-7 fill-current" />
          </button>
          <button
            class="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-neutral-950 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.8)] hover:scale-105 active:scale-95 transition duration-200 cursor-pointer font-bold"
            @click="playerStore.togglePlay"
          >
            <Pause v-if="playerStore.isPlaying" class="w-7 h-7 fill-current" />
            <Play v-else class="w-7 h-7 fill-current ml-1" />
          </button>
          <button class="text-neutral-300 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer p-1" @click="playerStore.next">
            <SkipForward class="w-7 h-7 fill-current" />
          </button>
        </div>

        <button
          class="text-neutral-400 hover:text-white transition-all cursor-pointer p-2 rounded-xl hover:bg-white/5"
          @click="playerStore.showQueueDrawer = true"
        >
          <span class="text-xs font-mono font-medium">队列</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask-gradient {
  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
}
@keyframes pulse-slow {
  0%, 100% { transform: scale(1.2) rotate(0deg); }
  50% { transform: scale(1.3) rotate(3deg); }
}
.animate-pulse-slow {
  animation: pulse-slow 18s ease-in-out infinite;
}
</style>
