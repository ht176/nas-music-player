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
  Repeat1,
  Shuffle,
  FileSearch,
  Info,
  Activity,
  Volume2,
  VolumeX,
  FolderPlus,
  MoreHorizontal,
  Disc,
  FileText,
  ListMusic,
} from 'lucide-vue-next'
import type { VisualizerMode } from './AudioSpectrumVisualizer.vue'
import VinylSpectrumVisualizer from './VinylSpectrumVisualizer.vue'
import { useThemeStore } from '../stores/theme'

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const themeStore = useThemeStore()
const lyricsContainer = ref<HTMLElement | null>(null)
const mobileLyricsContainer = ref<HTMLElement | null>(null)
const showSleepMenu = ref(false)
const showMobileMore = ref(false)
const showLyricSearchModal = ref(false)
const showTrackInfoModal = ref(false)
const showAddToPlaylistModal = ref(false)
const mobileView = ref<'vinyl' | 'lyrics'>('vinyl')

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

const currentLyricText = computed(() => {
  if (playerStore.lyrics.length && playerStore.currentLyricIndex >= 0) {
    return playerStore.lyrics[playerStore.currentLyricIndex]?.text || ''
  }
  return ''
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

// 精准滚动歌词到视口中央 (兼容桌面端与移动端歌词容器)
const scrollToCurrentLyric = (smooth = true) => {
  const currentIdx = playerStore.currentLyricIndex
  if (currentIdx < 0) return
  nextTick(() => {
    const containers = [lyricsContainer.value, mobileLyricsContainer.value].filter(Boolean) as HTMLElement[]
    for (const container of containers) {
      const activeEl = container.querySelector(`[data-index="${currentIdx}"]`) as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
      }
    }
  })
}

// 1. 播放进度变更触发下一句滚动
watch(
  () => playerStore.currentLyricIndex,
  (newIdx) => {
    if (newIdx >= 0) {
      scrollToCurrentLyric(true)
    }
  }
)

// 2. 移动端视图切换到歌词时，立即对齐歌词
watch(
  mobileView,
  (view) => {
    if (view === 'lyrics') {
      setTimeout(() => scrollToCurrentLyric(false), 60)
    }
  }
)

// 3. 点击进入播放详情页时，立即定位到当前正在播放的对应歌词位置
watch(
  () => playerStore.showFullscreen,
  (show) => {
    if (show) {
      setTimeout(() => scrollToCurrentLyric(false), 50)
      setTimeout(() => scrollToCurrentLyric(true), 300)
    }
  }
)

// 4. 歌曲初次载入歌词解析完成后居中定位
watch(
  () => playerStore.lyrics,
  (newLyrics) => {
    if (playerStore.showFullscreen && newLyrics.length > 0) {
      setTimeout(() => scrollToCurrentLyric(false), 100)
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fullscreen-slide">
      <div
        v-if="playerStore.showFullscreen && playerStore.currentTrack"
        class="fixed inset-0 z-50 flex flex-col justify-between px-4 py-3 sm:p-6 md:p-8 overflow-hidden select-none transition-colors duration-500"
        :style="{
          backgroundColor: 'var(--theme-bg)',
          color: 'var(--theme-text-primary)',
          paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        }"
      >
        <!-- Apple Music 风格动态极光背景与粒子流光 (随主题自适应光色与背景) -->
        <div class="absolute inset-0 overflow-hidden -z-10 pointer-events-none transition-colors duration-700">
          <div
            class="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-cover bg-center opacity-30 blur-[100px] scale-125 animate-pulse-slow"
            :style="{ backgroundImage: `url(${coverUrl})` }"
          />
          <div class="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[140px] opacity-60 animate-pulse" :style="{ backgroundColor: 'var(--theme-aurora-1)' }" />
          <div class="absolute top-[30%] -right-[15%] w-[550px] h-[550px] rounded-full blur-[140px] opacity-50" :style="{ backgroundColor: 'var(--theme-aurora-2)' }" />
          <div class="absolute -bottom-[20%] left-[20%] w-[650px] h-[650px] rounded-full blur-[150px] opacity-40" :style="{ backgroundColor: 'var(--theme-aurora-3)' }" />
          <div
            class="absolute inset-0 backdrop-blur-2xl transition-colors duration-500"
            :style="{
              backgroundColor: themeStore.isLight ? 'rgba(255, 255, 255, 0.76)' : 'rgba(7, 9, 15, 0.82)'
            }"
          />
          <ParticleBackground :density="45" />
        </div>

        <!-- 顶部导航与功能栏 -->
        <div class="flex items-center justify-between relative z-20">
          <button
            class="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition cursor-pointer text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
            title="收起播放器"
            @click="playerStore.showFullscreen = false"
          >
            <ChevronDown class="w-6 h-6" />
          </button>

          <!-- 桌面端音质徽章 -->
          <div class="hidden md:flex items-center gap-2">
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-sm"
              :style="{
                backgroundColor: 'var(--theme-surface)',
                borderColor: 'var(--theme-border-highlight)',
                color: 'var(--theme-accent)'
              }"
            >
              <Sparkles class="w-3 h-3" />
              {{ playerStore.currentTrack.suffix || 'FLAC' }} LOSSLESS
            </span>
            <span v-if="playerStore.currentTrack.bitRate" class="text-[11px] text-[var(--theme-text-secondary)] font-mono">
              {{ playerStore.currentTrack.bitRate }} kbps
            </span>
          </div>

          <!-- 移动端专属：【唱片 / 歌词】快速切换药丸胶囊 -->
          <div class="flex md:hidden items-center p-0.5 rounded-full bg-black/5 dark:bg-white/10 border border-[var(--theme-border)] backdrop-blur-md">
            <button
              class="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer"
              :class="mobileView === 'vinyl' ? 'font-bold shadow-md' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'"
              :style="mobileView === 'vinyl' ? { background: 'var(--theme-accent)', color: themeStore.isLight ? '#ffffff' : '#0a0c13' } : {}"
              @click="mobileView = 'vinyl'"
            >
              <Disc class="w-3.5 h-3.5" /> 歌曲
            </button>
            <button
              class="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer"
              :class="mobileView === 'lyrics' ? 'font-bold shadow-md' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'"
              :style="mobileView === 'lyrics' ? { background: 'var(--theme-accent)', color: themeStore.isLight ? '#ffffff' : '#0a0c13' } : {}"
              @click="mobileView = 'lyrics'"
            >
              <FileText class="w-3.5 h-3.5" /> 歌词
            </button>
          </div>

          <!-- 桌面端右上角工具栏 (平铺) -->
          <div class="hidden md:flex items-center gap-2 relative">
            <button
              class="p-2 rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              title="加入歌单"
              @click="showAddToPlaylistModal = true"
            >
              <FolderPlus class="w-5 h-5" />
            </button>

            <button
              class="p-2 rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              title="查看歌曲文件属性与物理存储信息"
              @click="showTrackInfoModal = true"
            >
              <Info class="w-5 h-5" />
            </button>

            <button
              class="p-2 rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              title="搜索替换当前歌词"
              @click="showLyricSearchModal = true"
            >
              <FileSearch class="w-5 h-5" />
            </button>

            <button
              class="p-2 rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              title="音效均衡器"
              @click="playerStore.showEQModal = true"
            >
              <Sliders class="w-5 h-5" />
            </button>

            <!-- 睡眠定时器按钮 -->
            <button
              class="p-2 rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer relative"
              :style="playerStore.sleepTimerSecondsLeft > 0 ? { color: 'var(--theme-accent)' } : {}"
              title="睡眠定时器"
              @click="showSleepMenu = !showSleepMenu"
            >
              <Moon class="w-5 h-5" />
              <span
                v-if="playerStore.sleepTimerSecondsLeft > 0"
                class="absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded-full font-mono"
                :style="{ background: 'var(--theme-accent)', color: themeStore.isLight ? '#ffffff' : '#0a0c13' }"
              >
                {{ Math.ceil(playerStore.sleepTimerSecondsLeft / 60) }}m
              </span>
            </button>
          </div>

          <!-- 移动端右上角工具栏 (睡眠定时器 + 更多菜单折叠) -->
          <div class="flex md:hidden items-center gap-1 relative">
            <button
              class="p-2 rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] active:scale-90 transition cursor-pointer relative"
              :style="playerStore.sleepTimerSecondsLeft > 0 ? { color: 'var(--theme-accent)' } : {}"
              title="睡眠定时器"
              @click="showSleepMenu = !showSleepMenu; showMobileMore = false"
            >
              <Moon class="w-5 h-5" />
              <span
                v-if="playerStore.sleepTimerSecondsLeft > 0"
                class="absolute -top-0.5 -right-0.5 text-[8px] font-bold px-1 rounded-full font-mono"
                :style="{ background: 'var(--theme-accent)', color: themeStore.isLight ? '#ffffff' : '#0a0c13' }"
              >
                {{ Math.ceil(playerStore.sleepTimerSecondsLeft / 60) }}m
              </span>
            </button>

            <button
              class="p-2 rounded-full text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] active:scale-90 transition cursor-pointer"
              title="更多操作"
              @click="showMobileMore = !showMobileMore; showSleepMenu = false"
            >
              <MoreHorizontal class="w-5 h-5" />
            </button>

            <!-- 移动端更多操作折叠弹窗 -->
            <div
              v-if="showMobileMore"
              class="absolute top-12 right-0 bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-2xl p-2 shadow-2xl space-y-1 w-44 z-50 backdrop-blur-xl animate-fade-in"
            >
              <button
                class="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 text-[var(--theme-text-primary)] cursor-pointer"
                @click="showAddToPlaylistModal = true; showMobileMore = false"
              >
                <FolderPlus class="w-4 h-4 text-[var(--theme-accent)]" /> 加入歌单
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 text-[var(--theme-text-primary)] cursor-pointer"
                @click="showLyricSearchModal = true; showMobileMore = false"
              >
                <FileSearch class="w-4 h-4 text-[var(--theme-accent)]" /> 搜索替换歌词
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 text-[var(--theme-text-primary)] cursor-pointer"
                @click="playerStore.showEQModal = true; showMobileMore = false"
              >
                <Sliders class="w-4 h-4 text-[var(--theme-accent)]" /> 音效均衡器
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 text-[var(--theme-text-primary)] cursor-pointer"
                @click="showTrackInfoModal = true; showMobileMore = false"
              >
                <Info class="w-4 h-4 text-[var(--theme-text-secondary)]" /> 歌曲属性详情
              </button>
            </div>
          </div>

          <!-- 睡眠定时器选择下拉 (共用) -->
          <div
            v-if="showSleepMenu"
            class="absolute top-12 right-0 bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-2xl p-2 shadow-2xl space-y-1 w-36 z-50 backdrop-blur-xl animate-fade-in"
          >
            <div class="text-[10px] text-[var(--theme-text-secondary)] font-bold px-2 py-1">定时关闭</div>
            <button
              v-for="min in [0, 15, 30, 45, 60]"
              :key="min"
              class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              :style="playerStore.sleepTimerMinutes === min ? { color: 'var(--theme-accent)', fontWeight: 'bold' } : { color: 'var(--theme-text-secondary)' }"
              @click="playerStore.setSleepTimer(min); showSleepMenu = false"
            >
              {{ min === 0 ? '关闭定时器' : `${min} 分钟后停止` }}
            </button>
          </div>
        </div>

        <!-- ==================== 移动端专属：黑胶/歌词视图二选一 ==================== -->
        <div class="flex md:hidden flex-1 flex-col overflow-hidden w-full relative my-1">
          <!-- 移动端视图 A: 经典黑胶唱片模式 -->
          <div
            v-if="mobileView === 'vinyl'"
            class="flex-1 flex flex-col items-center justify-around py-2 w-full animate-fade-in"
          >
            <!-- 黑胶唱盘大光盘 -->
            <div
              class="relative w-[52vmin] h-[52vmin] min-w-[190px] min-h-[190px] max-w-[260px] max-h-[260px] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
              title="点击切换全屏歌词"
              @click="mobileView = 'lyrics'"
            >
              <!-- 环境律动光晕 (随主题动态变幻) -->
              <div
                class="absolute -inset-2 rounded-full blur-xl pointer-events-none transition-all duration-700"
                :style="{
                  background: playerStore.isPlaying ? 'radial-gradient(circle, var(--theme-glow) 0%, transparent 70%)' : 'transparent',
                  opacity: playerStore.isPlaying ? 1 : 0.2
                }"
              />

              <!-- 黑胶唱片环形辐射律动特效 -->
              <VinylSpectrumVisualizer />

              <!-- 黑胶唱盘圆盘 -->
              <div
                class="w-full h-full rounded-full bg-neutral-950 p-2 border border-white/10 relative flex items-center justify-center transition-all duration-500"
                :class="[playerStore.isPlaying ? 'animate-vinyl' : '']"
                :style="{
                  background: 'radial-gradient(circle, #1a1a1a 0%, #0d0d0d 40%, #151515 70%, #000 100%)',
                  boxShadow: playerStore.isPlaying ? '0 0 32px var(--theme-glow)' : '0 15px 40px rgba(0,0,0,0.6)'
                }"
              >
                <div class="absolute inset-1.5 rounded-full border border-white/[0.04] pointer-events-none" />
                <div class="absolute inset-4 rounded-full border border-white/[0.03] pointer-events-none" />
                <div class="absolute inset-8 rounded-full border border-white/[0.03] pointer-events-none" />

                <!-- 唱片中心圆形封面 -->
                <div class="w-[50%] h-[50%] rounded-full overflow-hidden shadow-2xl relative border-2 border-neutral-900 z-10">
                  <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover select-none" />
                  <div class="absolute inset-0 m-auto w-4 h-4 rounded-full bg-neutral-950 border-2 border-neutral-700 shadow-inner flex items-center justify-center">
                    <div class="w-1 h-1 rounded-full bg-white/40"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 歌曲标题与歌手 -->
            <div class="text-center px-4 max-w-sm mt-2">
              <h2 class="text-lg font-bold text-[var(--theme-text-primary)] tracking-tight truncate leading-tight">{{ playerStore.currentTrack.title }}</h2>
              <p class="text-xs font-medium text-[var(--theme-text-secondary)] mt-1 truncate">{{ playerStore.currentTrack.artist }} · {{ playerStore.currentTrack.album }}</p>
            </div>

            <!-- 动态律动频谱仪 -->
            <div class="w-full max-w-xs cursor-pointer" @click="cycleVisualizerMode">
              <AudioSpectrumVisualizer :mode="visualizerMode" />
            </div>

            <!-- 唱片下方实时歌词浮动胶囊 (轻触直接切入全屏歌词模式) -->
            <div
              v-if="currentLyricText"
              class="mx-4 px-4 py-2 rounded-full bg-[var(--theme-surface-solid)] border border-[var(--theme-border-highlight)] flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition max-w-[85vw]"
              :style="{ boxShadow: '0 4px 16px -2px var(--theme-glow)' }"
              @click="mobileView = 'lyrics'"
            >
              <span class="w-2 h-2 rounded-full animate-pulse shrink-0" :style="{ background: 'var(--theme-accent)' }" />
              <span class="text-xs font-semibold truncate select-none" :style="{ color: 'var(--theme-accent)' }">{{ currentLyricText }}</span>
            </div>
            <div v-else class="text-[11px] text-[var(--theme-text-muted)]">轻触唱片进入歌词视图</div>
          </div>

          <!-- 移动端视图 B: 沉浸式多行高亮滚动歌词 -->
          <div
            v-else
            ref="mobileLyricsContainer"
            class="flex-1 overflow-y-auto flex flex-col items-center text-center space-y-6 py-16 px-4 select-none mask-gradient scroll-smooth w-full animate-fade-in"
          >
            <template v-if="playerStore.lyrics.length > 0">
              <div
                v-for="(line, idx) in playerStore.lyrics"
                :key="idx"
                :data-index="idx"
                class="transition-all duration-300 cursor-pointer font-medium max-w-md leading-relaxed lyric-text w-full text-center"
                :class="[
                  idx === playerStore.currentLyricIndex
                    ? 'text-transparent bg-clip-text font-extrabold scale-105 origin-center text-lg sm:text-xl drop-shadow-md'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] text-sm sm:text-base opacity-45 font-normal hover:opacity-85',
                ]"
                :style="idx === playerStore.currentLyricIndex ? {
                  backgroundImage: 'linear-gradient(to right, var(--theme-accent), var(--theme-accent-secondary), var(--theme-text-primary))',
                  filter: 'drop-shadow(0 0 16px var(--theme-glow))'
                } : {}"
                @click="playerStore.seek(line.time)"
              >
                {{ line.text }}
              </div>
            </template>
            <div v-else class="text-[var(--theme-text-muted)] text-sm my-auto flex flex-col items-center gap-3">
              <Sparkles class="w-6 h-6 animate-pulse" :style="{ color: 'var(--theme-accent)' }" />
              <span>暂无歌词或为纯音乐</span>
              <button
                class="mt-1 px-3 py-1 rounded-full text-xs border transition cursor-pointer flex items-center gap-1"
                :style="{
                  color: 'var(--theme-accent)',
                  borderColor: 'var(--theme-border-highlight)',
                  backgroundColor: 'var(--theme-glow)'
                }"
                @click="showLyricSearchModal = true"
              >
                <FileSearch class="w-3.5 h-3.5" /> 搜索在线歌词
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== 桌面端专属：并列双分栏 (左黑胶唱片，右滚动歌词) ==================== -->
        <div class="hidden md:grid flex-1 grid-cols-2 gap-10 items-center max-w-6xl mx-auto w-full my-2 mb-6 overflow-hidden min-h-[300px]">
          <!-- 左栏：黑胶唱片机模拟 -->
          <div class="flex flex-col items-center justify-center relative w-full pt-6">
            <div class="relative w-[34vmin] h-[34vmin] min-w-[180px] min-h-[180px] max-w-[280px] max-h-[280px] flex items-center justify-center shrink-0">
              <div
                class="absolute -inset-3 rounded-full blur-xl pointer-events-none transition-all duration-700"
                :style="{
                  background: playerStore.isPlaying ? 'radial-gradient(circle, var(--theme-glow) 0%, transparent 70%)' : 'transparent',
                  opacity: playerStore.isPlaying ? 1 : 0.2
                }"
              />
              <VinylSpectrumVisualizer />
              <div
                class="w-full h-full rounded-full bg-neutral-950 p-2.5 border border-white/10 relative flex items-center justify-center transition-all duration-500"
                :class="[playerStore.isPlaying ? 'animate-vinyl' : '']"
                :style="{
                  background: 'radial-gradient(circle, #1a1a1a 0%, #0d0d0d 40%, #151515 70%, #000 100%)',
                  boxShadow: playerStore.isPlaying ? '0 0 35px var(--theme-glow)' : '0 20px 50px rgba(0,0,0,0.6)'
                }"
              >
                <div class="absolute inset-2 rounded-full border border-white/[0.04] pointer-events-none" />
                <div class="absolute inset-6 rounded-full border border-white/[0.03] pointer-events-none" />
                <div class="absolute inset-10 rounded-full border border-white/[0.03] pointer-events-none" />
                <div class="absolute inset-14 rounded-full border border-white/[0.04] pointer-events-none" />
                <div
                  class="absolute inset-0 rounded-full pointer-events-none opacity-20"
                  style="background: conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.2) 60deg, transparent 120deg, rgba(255,255,255,0.2) 240deg, transparent 300deg);"
                />
                <div class="w-[50%] h-[50%] rounded-full overflow-hidden shadow-2xl relative border-2 border-neutral-900 z-10">
                  <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover select-none" />
                  <div class="absolute inset-0 m-auto w-5 h-5 rounded-full bg-neutral-950 border-2 border-neutral-700/80 shadow-inner flex items-center justify-center">
                    <div class="w-1 h-1 rounded-full bg-white/40"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 text-center max-w-sm px-2">
              <h2 class="text-xl sm:text-2xl font-extrabold text-[var(--theme-text-primary)] tracking-tight truncate drop-shadow-md">{{ playerStore.currentTrack.title }}</h2>
              <p class="text-xs sm:text-sm font-medium text-[var(--theme-text-secondary)] mt-1 truncate">{{ playerStore.currentTrack.artist }} · {{ playerStore.currentTrack.album }}</p>
            </div>

            <div
              class="w-full max-w-lg mt-1 relative group cursor-pointer"
              @click="cycleVisualizerMode"
              :title="`当前动效: ${visualizerModeLabels[visualizerMode]} (点击切换)`"
            >
              <AudioSpectrumVisualizer :mode="visualizerMode" />
              <div
                class="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono flex items-center gap-1 select-none pointer-events-none"
                :style="{ color: 'var(--theme-accent)' }"
              >
                <Activity class="w-2.5 h-2.5" /> 点击切换律动风格
              </div>
            </div>
          </div>

          <!-- 右栏：逐行同步滚动歌词 -->
          <div
            ref="lyricsContainer"
            class="h-full max-h-[460px] min-h-[220px] overflow-y-auto flex flex-col items-center text-center space-y-6 py-20 select-none mask-gradient px-4 scroll-smooth w-full"
          >
            <template v-if="playerStore.lyrics.length > 0">
              <div
                v-for="(line, idx) in playerStore.lyrics"
                :key="idx"
                :data-index="idx"
                class="transition-all duration-300 cursor-pointer font-medium max-w-xl leading-relaxed lyric-text w-full text-center"
                :class="[
                  idx === playerStore.currentLyricIndex
                    ? 'text-transparent bg-clip-text font-extrabold scale-105 origin-center text-xl sm:text-2xl tracking-normal drop-shadow-md'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] text-base sm:text-lg scale-100 opacity-45 font-normal hover:opacity-85',
                ]"
                :style="idx === playerStore.currentLyricIndex ? {
                  backgroundImage: 'linear-gradient(to right, var(--theme-accent), var(--theme-accent-secondary), var(--theme-text-primary))',
                  filter: 'drop-shadow(0 0 16px var(--theme-glow))'
                } : {}"
                @click="playerStore.seek(line.time)"
              >
                {{ line.text }}
              </div>
            </template>
            <div v-else class="text-[var(--theme-text-muted)] text-base my-auto mx-auto flex flex-col items-center gap-3">
              <Sparkles class="w-7 h-7 animate-pulse" :style="{ color: 'var(--theme-accent)' }" />
              <span class="font-medium tracking-wide">沉浸纯音乐旋律</span>
              <button
                class="mt-1 px-3 py-1 rounded-full text-xs border transition cursor-pointer flex items-center gap-1"
                :style="{
                  color: 'var(--theme-accent)',
                  borderColor: 'var(--theme-border-highlight)',
                  backgroundColor: 'var(--theme-glow)'
                }"
                @click="showLyricSearchModal = true"
              >
                <FileSearch class="w-3.5 h-3.5" /> 搜索在线歌词
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== 底部：全功能控制条 (桌面端与移动端按需分流) ==================== -->
        <div class="max-w-xl mx-auto w-full space-y-3 pt-2">
          <!-- 进度条 -->
          <div class="flex items-center gap-2.5 w-full text-xs text-[var(--theme-text-secondary)] font-mono">
            <span class="w-9 text-right text-[11px]">{{ formatTime(playerStore.currentTime) }}</span>
            <input
              type="range"
              min="0"
              :max="(playerStore.duration && isFinite(playerStore.duration) && playerStore.duration > 0) ? playerStore.duration : (playerStore.currentTrack?.duration || 100)"
              :value="playerStore.currentTime"
              @input="onProgressChange"
              class="w-full h-1.5 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all shadow-inner"
              :style="{
                accentColor: 'var(--theme-accent)',
                background: `linear-gradient(to right, var(--theme-accent) 0%, var(--theme-accent) ${progressPercent}%, var(--theme-border) ${progressPercent}%, var(--theme-border) 100%)`
              }"
            />
            <span class="w-9 text-[11px]">{{ formatTime(playerStore.duration || playerStore.currentTrack?.duration) }}</span>
          </div>

          <!-- 核心控制按键 -->
          <div class="flex items-center justify-between px-2">
            <!-- 播放模式切换 -->
            <button
              class="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer p-2 rounded-xl active:scale-90"
              :style="playerStore.playMode !== 'sequence' ? { color: 'var(--theme-accent)', filter: 'drop-shadow(0 0 8px var(--theme-glow))' } : {}"
              @click="playerStore.togglePlayMode"
              :title="playerStore.playMode === 'sequence' ? '列表循环' : (playerStore.playMode === 'single' ? '单曲循环' : '随机播放')"
            >
              <Shuffle v-if="playerStore.playMode === 'random'" class="w-5 h-5" />
              <Repeat1 v-else-if="playerStore.playMode === 'single'" class="w-5 h-5" />
              <Repeat v-else class="w-5 h-5" />
            </button>

            <!-- 核心播放三联键 -->
            <div class="flex items-center gap-6 sm:gap-7">
              <button class="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:scale-110 active:scale-95 transition cursor-pointer p-1" @click="playerStore.prev" title="上一首">
                <SkipBack class="w-7 h-7 fill-current" />
              </button>
              <button
                class="h-14 w-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition duration-200 cursor-pointer font-bold"
                :style="{
                  background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accent-secondary))',
                  color: themeStore.isLight ? '#ffffff' : '#0a0c13',
                  boxShadow: '0 0 25px var(--theme-glow)'
                }"
                @click="playerStore.togglePlay"
                :title="playerStore.isPlaying ? '暂停' : '播放'"
              >
                <Pause v-if="playerStore.isPlaying" class="w-7 h-7 fill-current" />
                <Play v-else class="w-7 h-7 fill-current ml-1" />
              </button>
              <button class="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:scale-110 active:scale-95 transition cursor-pointer p-1" @click="playerStore.next" title="下一首">
                <SkipForward class="w-7 h-7 fill-current" />
              </button>
            </div>

            <!-- 右侧：桌面端音量与队列，移动端仅队列抽屉 -->
            <div class="flex items-center gap-2">
              <div class="hidden md:flex items-center gap-2">
                <button
                  class="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer p-1"
                  @click="toggleMute"
                  :title="playerStore.volume === 0 ? '取消静音' : '静音'"
                >
                  <VolumeX v-if="playerStore.volume === 0" class="w-4 h-4 text-rose-400" />
                  <Volume2 v-else class="w-4 h-4 text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)]" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  :value="playerStore.volume"
                  @input="onVolumeChange"
                  class="w-20 h-1.5 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all shadow-inner"
                  :style="{
                    accentColor: 'var(--theme-accent)',
                    background: `linear-gradient(to right, var(--theme-accent) 0%, var(--theme-accent) ${playerStore.volume * 100}%, var(--theme-border) ${playerStore.volume * 100}%, var(--theme-border) 100%)`
                  }"
                />
              </div>

              <button
                class="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-90"
                @click="playerStore.showQueueDrawer = true"
                title="播放队列"
              >
                <ListMusic class="w-5 h-5 md:w-4 md:h-4" />
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
