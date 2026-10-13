<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useServerStore } from '../stores/server'
import AudioSpectrumVisualizer from './AudioSpectrumVisualizer.vue'
import LyricSearchModal from './LyricSearchModal.vue'
import TrackInfoModal from './TrackInfoModal.vue'
import AddToPlaylistModal from './AddToPlaylistModal.vue'
import ParticleBackground from './ParticleBackground.vue'
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
  FileSearch,
  Info,
  Activity,
  Volume2,
  VolumeX,
  FolderPlus,
} from 'lucide-vue-next'
import type { VisualizerMode } from './AudioSpectrumVisualizer.vue'
import VinylSpectrumVisualizer from './VinylSpectrumVisualizer.vue'

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const lyricsContainer = ref<HTMLElement | null>(null)
const showSleepMenu = ref(false)
const showLyricSearchModal = ref(false)
const showTrackInfoModal = ref(false)
const showAddToPlaylistModal = ref(false)
const VISUALIZER_STORAGE_KEY = 'aura_visualizer_mode'
const initialVisualizerMode = (localStorage.getItem(VISUALIZER_STORAGE_KEY) as VisualizerMode) || 'neon-light-floor'
const visualizerMode = ref<VisualizerMode>(
  ['neon-light-floor', 'neon-glow-line', 'aurora-mirror'].includes(initialVisualizerMode)
    ? initialVisualizerMode
    : 'neon-light-floor'
)

const visualizerModeLabels: Record<VisualizerMode, string> = {
  'neon-light-floor': '赛博地坪光柱倒影 (案例四)',
  'neon-glow-line': '霓虹折线脉冲 (案例一)',
  'aurora-mirror': '经典极光对称柱',
}

function cycleVisualizerMode() {
  const modes: VisualizerMode[] = ['neon-light-floor', 'neon-glow-line', 'aurora-mirror']
  const nextIdx = (modes.indexOf(visualizerMode.value) + 1) % modes.length
  visualizerMode.value = modes[nextIdx]
  localStorage.setItem(VISUALIZER_STORAGE_KEY, visualizerMode.value)
}

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(playerStore.currentTrack?.coverArtId, 600) || ''
})

// 格式化时间 (严密容错，避免 NaN / Infinity)
const formatTime = (sec: number | null | undefined) => {
  if (sec === null || sec === undefined || isNaN(sec) || !isFinite(sec) || sec <= 0) {
    return '0:00'
  }
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const onProgressChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  playerStore.seek(val)
}

const onVolumeChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  playerStore.setVolume(val)
}

const toggleMute = () => {
  if (playerStore.volume > 0) {
    playerStore.setVolume(0)
  } else {
    playerStore.setVolume(0.8)
  }
}

const progressPercent = computed(() => {
  const dur = (playerStore.duration && isFinite(playerStore.duration) && playerStore.duration > 0)
    ? playerStore.duration
    : (playerStore.currentTrack?.duration || 0)
  if (!dur || dur <= 0) return 0
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
  <Teleport to="body">
    <Transition name="fullscreen-slide">
      <div
        v-if="playerStore.showFullscreen && playerStore.currentTrack"
        class="fixed inset-0 z-50 bg-neutral-950 flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none"
      >
    <!-- Apple Music 风格动态极光背景与粒子流光 -->
    <div class="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      <div
        class="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-cover bg-center opacity-30 blur-[100px] scale-125 animate-pulse-slow"
        :style="{ backgroundImage: `url(${coverUrl})` }"
      />
      <div class="absolute inset-0 bg-neutral-950/70 backdrop-blur-2xl" />
      <ParticleBackground :density="60" />
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

      <!-- 右上角工具：歌曲属性、加入歌单、歌词替换、均衡器与睡眠定时器 -->
      <div class="flex items-center gap-2 relative">
        <button
          class="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="加入歌单"
          @click="showAddToPlaylistModal = true"
        >
          <FolderPlus class="w-5 h-5 text-neutral-300 hover:text-emerald-400" />
        </button>

        <button
          class="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="查看歌曲文件属性与物理存储信息"
          @click="showTrackInfoModal = true"
        >
          <Info class="w-5 h-5 text-neutral-300 hover:text-emerald-400" />
        </button>

        <button
          class="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="搜索替换当前歌词"
          @click="showLyricSearchModal = true"
        >
          <FileSearch class="w-5 h-5 text-emerald-400" />
        </button>

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

    <!-- 中部：唱片与歌词分栏 (流体弹性布局，设最小高度，底部留出 mb-8 与播放控制栏拉开明显呼吸空间) -->
    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center max-w-6xl mx-auto w-full my-2 mb-6 sm:mb-8 overflow-hidden min-h-[300px]">
      <!-- 左栏：唱片封面 / 黑胶唱盘机模拟 (下移一点，与右侧歌词视觉平衡) -->
      <div class="flex flex-col items-center justify-center relative w-full pt-6 md:pt-10">
        <!-- 模拟黑胶唱盘机外环与黑胶光盘 (缩小两号: w-48/h-48 到 w-72/h-72，配合 min-w/min-h) -->
        <div class="relative w-[36vmin] h-[36vmin] min-w-[180px] min-h-[180px] max-w-[280px] max-h-[280px] flex items-center justify-center shrink-0">
          <!-- 黑胶唱片背景环境光晕与呼吸环 -->
          <div
            class="absolute -inset-2 sm:-inset-3 rounded-full blur-xl pointer-events-none transition-all duration-700"
            :class="[
              playerStore.isPlaying
                ? 'bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-sky-500/25 opacity-100 scale-105'
                : 'bg-emerald-500/5 opacity-40 scale-100'
            ]"
          ></div>

          <!-- 黑胶唱片环形辐射律动特效 (基于 toolka 博客方案与黑胶唱片联动) -->
          <VinylSpectrumVisualizer />

          <!-- 黑胶唱盘大圆盘 -->
          <div
            class="w-full h-full rounded-full bg-neutral-950 p-2 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 relative flex items-center justify-center transition-transform duration-500"
            :class="[playerStore.isPlaying ? 'animate-vinyl shadow-[0_0_35px_rgba(16,185,129,0.25)]' : '']"
            style="background: radial-gradient(circle, #1a1a1a 0%, #0d0d0d 40%, #151515 70%, #000 100%);"
          >
            <!-- 唱片黑胶微同心圆沟槽纹理层 -->
            <div class="absolute inset-1.5 sm:inset-2 rounded-full border border-white/[0.04] pointer-events-none"></div>
            <div class="absolute inset-4 sm:inset-6 rounded-full border border-white/[0.03] pointer-events-none"></div>
            <div class="absolute inset-8 sm:inset-10 rounded-full border border-white/[0.03] pointer-events-none"></div>
            <div class="absolute inset-12 sm:inset-14 rounded-full border border-white/[0.04] pointer-events-none"></div>

            <!-- 唱片黑胶反光高光锥形渐变 -->
            <div
              class="absolute inset-0 rounded-full pointer-events-none opacity-20"
              style="background: conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.2) 60deg, transparent 120deg, rgba(255,255,255,0.2) 240deg, transparent 300deg);"
            ></div>

            <!-- 唱片中心圆形封面 (Label) -->
            <div class="w-[50%] h-[50%] rounded-full overflow-hidden shadow-2xl relative border-2 border-neutral-900 z-10">
              <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover select-none" />
              <!-- 唱片中心金属轴孔 -->
              <div class="absolute inset-0 m-auto w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-neutral-950 border-2 border-neutral-700/80 shadow-inner flex items-center justify-center">
                <div class="w-1 h-1 rounded-full bg-white/40"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-center max-w-sm px-2">
          <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate drop-shadow-md">{{ playerStore.currentTrack.title }}</h2>
          <p class="text-xs sm:text-sm font-medium text-neutral-400 mt-1 truncate">{{ playerStore.currentTrack.artist }} · {{ playerStore.currentTrack.album }}</p>
        </div>

        <!-- 动态律动频谱仪 (支持点击快速切换现代声波风格) -->
        <div
          class="w-full max-w-lg mt-1 relative group cursor-pointer"
          @click="cycleVisualizerMode"
          :title="`当前动效: ${visualizerModeLabels[visualizerMode]} (点击切换)`"
        >
          <AudioSpectrumVisualizer :mode="visualizerMode" />
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-emerald-400/80 font-mono flex items-center gap-1 select-none pointer-events-none">
            <Activity class="w-2.5 h-2.5" /> 点击切换律动风格
          </div>
        </div>
      </div>

      <!-- 右栏：逐行/逐字同步滚动歌词 (居中对齐，字号、行距与弹性优化) -->
      <div
        ref="lyricsContainer"
        class="h-64 md:h-full max-h-[460px] min-h-[220px] overflow-y-auto flex flex-col items-center text-center space-y-6 py-20 select-none mask-gradient px-4 scroll-smooth w-full"
      >
        <template v-if="playerStore.lyrics.length > 0">
          <div
            v-for="(line, idx) in playerStore.lyrics"
            :key="idx"
            :data-index="idx"
            class="transition-all duration-300 cursor-pointer font-medium max-w-xl leading-relaxed lyric-text w-full text-center"
            :class="[
              idx === playerStore.currentLyricIndex
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white text-xl sm:text-2xl font-extrabold scale-105 origin-center drop-shadow-[0_0_16px_rgba(16,185,129,0.35)] tracking-normal'
                : 'text-neutral-500 hover:text-neutral-300 text-base sm:text-lg scale-100 opacity-40 font-normal hover:opacity-80',
            ]"
            @click="playerStore.seek(line.time)"
          >
            {{ line.text }}
          </div>
        </template>
        <div v-else class="text-neutral-500 text-base my-auto mx-auto flex flex-col items-center gap-3">
          <Sparkles class="w-7 h-7 text-emerald-500/50 animate-pulse" />
          <span class="font-medium tracking-wide">沉浸纯音乐旋律</span>
          <button
            class="mt-1 px-3 py-1 rounded-full text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1"
            @click="showLyricSearchModal = true"
          >
            <FileSearch class="w-3.5 h-3.5" /> 搜索在线歌词
          </button>
        </div>
      </div>
    </div>

    <!-- 底部：全功能控制条 (强化顶部间隔与独立背景分层) -->
    <div class="max-w-xl mx-auto w-full space-y-4 pt-4 pb-3">
      <!-- 进度条 (清晰显示已播翡翠绿进度与未播半透明轨道) -->
      <div class="flex items-center gap-3 w-full text-xs text-neutral-400 font-mono">
        <span class="w-10 text-right">{{ formatTime(playerStore.currentTime) }}</span>
        <input
          type="range"
          min="0"
          :max="(playerStore.duration && isFinite(playerStore.duration) && playerStore.duration > 0) ? playerStore.duration : (playerStore.currentTrack?.duration || 100)"
          :value="playerStore.currentTime"
          @input="onProgressChange"
          class="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:h-2 transition-all shadow-inner"
          :style="{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${progressPercent}%, rgba(255, 255, 255, 0.18) ${progressPercent}%, rgba(255, 255, 255, 0.18) 100%)`
          }"
        />
        <span class="w-10">{{ formatTime(playerStore.duration || playerStore.currentTrack?.duration) }}</span>
      </div>

      <!-- 核心按键控制与音量调节 -->
      <div class="flex items-center justify-between px-2">
        <button
          class="text-neutral-400 hover:text-white transition-all cursor-pointer p-2 rounded-xl hover:bg-white/5"
          :class="{ 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]': playerStore.playMode === 'random' }"
          @click="playerStore.togglePlayMode"
          title="播放模式"
        >
          <Shuffle v-if="playerStore.playMode === 'random'" class="w-5 h-5" />
          <Repeat v-else class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-7">
          <button class="text-neutral-300 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer p-1" @click="playerStore.prev" title="上一首">
            <SkipBack class="w-7 h-7 fill-current" />
          </button>
          <button
            class="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-neutral-950 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.8)] hover:scale-105 active:scale-95 transition duration-200 cursor-pointer font-bold"
            @click="playerStore.togglePlay"
            :title="playerStore.isPlaying ? '暂停' : '播放'"
          >
            <Pause v-if="playerStore.isPlaying" class="w-7 h-7 fill-current" />
            <Play v-else class="w-7 h-7 fill-current ml-1" />
          </button>
          <button class="text-neutral-300 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer p-1" @click="playerStore.next" title="下一首">
            <SkipForward class="w-7 h-7 fill-current" />
          </button>
        </div>

        <!-- 右侧：音量调节与队列 -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <button
              class="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
              @click="toggleMute"
              :title="playerStore.volume === 0 ? '取消静音' : '静音'"
            >
              <VolumeX v-if="playerStore.volume === 0" class="w-4 h-4 text-rose-400" />
              <Volume2 v-else class="w-4 h-4 text-neutral-400 hover:text-emerald-400" />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="playerStore.volume"
              @input="onVolumeChange"
              class="w-16 sm:w-20 h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:h-2 transition-all shadow-inner"
              :style="{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${playerStore.volume * 100}%, rgba(255, 255, 255, 0.18) ${playerStore.volume * 100}%, rgba(255, 255, 255, 0.18) 100%)`
              }"
            />
          </div>

          <button
            class="text-neutral-400 hover:text-white transition-all cursor-pointer p-2 rounded-xl hover:bg-white/5"
            @click="playerStore.showQueueDrawer = true"
            title="播放队列"
          >
            <span class="text-xs font-mono font-medium">队列</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 歌词搜索替换弹窗 -->
    <LyricSearchModal v-model="showLyricSearchModal" />

    <!-- 歌曲文件属性与 NAS 物理信息弹窗 -->
    <TrackInfoModal v-model="showTrackInfoModal" />

    <!-- 添加到歌单弹窗 -->
    <AddToPlaylistModal
      v-model="showAddToPlaylistModal"
      :track="playerStore.currentTrack"
    />
      </div>
    </Transition>
  </Teleport>
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
@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-vinyl {
  animation: vinyl-spin 22s linear infinite;
}

/* 沉浸式全屏丝滑上升入场与渐变离场过渡 */
.fullscreen-slide-enter-active,
.fullscreen-slide-leave-active {
  transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}
.fullscreen-slide-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.985);
}
.fullscreen-slide-leave-to {
  opacity: 0;
  transform: translateY(24px) scale(0.985);
}
</style>
