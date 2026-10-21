<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
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
  Music2,
} from 'lucide-vue-next'
import { isDesktopApp, exitMiniMode, expandMiniWindow, collapseMiniWindow } from '../services/desktop'
import AddToPlaylistModal from './AddToPlaylistModal.vue'
import LyricTicker from './LyricTicker.vue'
import gsap from 'gsap'

const props = defineProps<{
  isCompactDesktop?: boolean
}>()

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const showAddToPlaylist = ref(false)

const miniPlayerRoot = ref<HTMLElement | null>(null)
const heartBtnRef = ref<HTMLElement | null>(null)
const playBtnRef = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(playerStore.currentTrack?.coverArtId, 160) || ''
})

// 收藏按钮点击爆弹回弹触觉反馈 (GSAP)
function handleToggleStar() {
  if (playerStore.currentTrack) {
    playerStore.toggleStar(playerStore.currentTrack)
    if (heartBtnRef.value) {
      gsap.fromTo(
        heartBtnRef.value,
        { scale: 0.75 },
        {
          scale: 1.35,
          duration: 0.16,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(heartBtnRef.value, { scale: 1, duration: 0.28, ease: 'elastic.out(1.2, 0.4)' })
          },
        }
      )
    }
  }
}

// 播放/暂停按钮轻微缩放呼吸微动效
function handleTogglePlay() {
  if (playBtnRef.value) {
    gsap.fromTo(playBtnRef.value, { scale: 0.88 }, { scale: 1, duration: 0.24, ease: 'back.out(2.5)' })
  }
  playerStore.togglePlay()
}

function handleSeekProgress(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  if (rect.width > 0 && playerStore.duration) {
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    playerStore.seek(playerStore.duration * ratio)
  }
}

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

onMounted(() => {
  if (miniPlayerRoot.value) {
    ctx = gsap.context(() => {
      gsap.from('.mini-fade-in', {
        autoAlpha: 0,
        y: 8,
        stagger: 0.04,
        duration: 0.4,
        ease: 'power2.out',
      })
    }, miniPlayerRoot.value)
  }
})

onUnmounted(() => {
  ctx?.revert()
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
    ref="miniPlayerRoot"
    @dblclick.prevent.stop=""
    :class="[
      isCompactDesktop
        ? 'w-full h-full rounded-2xl px-3 py-2 flex flex-col justify-between select-none shadow-[0_16px_36px_rgba(0,0,0,0.65)] relative overflow-hidden transition-colors duration-500'
        : 'fixed bottom-24 right-6 w-92 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.7)] backdrop-blur-2xl px-3.5 py-2.5 z-50 animate-fade-in flex flex-col gap-1.5 select-none transition-colors duration-500'
    ]"
    :style="{
      backgroundColor: 'var(--theme-bg-translucent)',
      backdropFilter: 'blur(28px) saturate(180%)',
      borderColor: 'var(--theme-border)',
      borderWidth: '1px',
      borderStyle: 'solid',
    }"
  >
    <!-- 背景流光呼吸光晕 (随音频/主题自适应微光) -->
    <div
      class="absolute -inset-4 pointer-events-none -z-10 blur-[40px] opacity-40 transition-opacity duration-700"
      :class="{ 'opacity-65 animate-pulse': playerStore.isPlaying }"
      :style="{
        background: `radial-gradient(circle at 30% 50%, var(--theme-accent) 0%, transparent 70%)`,
      }"
    />

    <!-- 上半部分：黑胶微缩滑出封面 + 中间歌曲名与实时歌词 + 动态音浪 + 右上角控制 -->
    <div
      data-tauri-drag-region
      @dblclick.prevent.stop=""
      class="flex items-center gap-2.5 cursor-move flex-1 min-h-0"
    >
      <!-- 封面主图 (独立圆角卡片，播放时伴随柔和声学微光晕) -->
      <div
        class="relative w-9 h-9 rounded-lg bg-neutral-800 overflow-hidden shrink-0 shadow-md border transition-all duration-300 pointer-events-none flex items-center justify-center"
        :style="{
          borderColor: playerStore.isPlaying ? 'var(--theme-accent)' : 'var(--theme-border)',
          boxShadow: playerStore.isPlaying ? '0 0 10px var(--theme-glow)' : 'none',
        }"
      >
        <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover" alt="Cover" />
        <Music2 v-else class="w-4 h-4 opacity-60 text-[var(--theme-text-muted)]" />
      </div>

      <!-- 歌名与实时动态歌词 -->
      <div class="truncate flex-1 pointer-events-none min-w-0 pr-1">
        <div class="flex items-center gap-1.5 truncate">
          <span class="text-xs font-bold text-[var(--theme-text-primary)] truncate leading-tight">
            {{ playerStore.currentTrack.title }}
          </span>
          <!-- 动态迷你声波柱状图 (播放中跳动) -->
          <div v-if="playerStore.isPlaying" class="flex items-end gap-0.5 h-3 shrink-0">
            <span class="w-0.5 rounded-full bg-[var(--theme-accent)] wave-bar-1" />
            <span class="w-0.5 rounded-full bg-[var(--theme-accent)] wave-bar-2" />
            <span class="w-0.5 rounded-full bg-[var(--theme-accent)] wave-bar-3" />
            <span class="w-0.5 rounded-full bg-[var(--theme-accent)] wave-bar-4" />
          </div>
        </div>
        <!-- 动态连续平滑滚动歌词 (支持单/双行) -->
        <div class="mt-0.5 overflow-hidden">
          <LyricTicker
            :lyrics="playerStore.lyrics"
            :active-index="playerStore.currentLyricIndex"
            :display-lines="playerStore.lyricDisplayLines"
            :fallback-text="playerStore.currentTrack?.artist || '享受纯粹私有音乐'"
            size="sm"
          />
        </div>
      </div>

      <!-- 右上角快捷操作：还原窗口与关闭迷你播放器 -->
      <div class="flex items-center gap-0.5 shrink-0 self-start pointer-events-auto text-[var(--theme-text-muted)]">
        <button
          class="p-1 hover:text-[var(--theme-text-primary)] rounded hover:bg-white/10 transition cursor-pointer"
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

    <!-- 下半部分：极简流光进度条 + 核心播放控制 + 右侧快捷功能(收藏 / 加入歌单) -->
    <div
      class="flex items-center justify-between pt-1 gap-2"
      :style="{
        borderTop: '1px solid var(--theme-border)',
      }"
    >
      <!-- 极简流光渐变进度条 -->
      <div class="flex-1 min-w-[50px] relative group/prog cursor-pointer" @click="handleSeekProgress">
        <div
          class="w-full h-1 rounded-full overflow-hidden"
          :style="{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }"
        >
          <div
            class="h-full rounded-full transition-all duration-300 relative"
            :style="{
              width: `${(playerStore.currentTime / (playerStore.duration || 1)) * 100}%`,
              background: `linear-gradient(90deg, var(--theme-accent), var(--theme-accent-secondary))`,
              boxShadow: '0 0 10px var(--theme-glow)',
            }"
          />
        </div>
      </div>

      <!-- 核心播放控制 (上一首 / 播放暂停 / 下一首) -->
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          class="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] p-1 transition cursor-pointer active:scale-95"
          @click="playerStore.prev"
          title="上一首"
        >
          <SkipBack class="w-3.5 h-3.5 fill-current" />
        </button>
        <button
          ref="playBtnRef"
          class="w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-90 transition-all cursor-pointer font-bold"
          :style="{
            backgroundColor: 'var(--theme-accent)',
            color: 'var(--theme-bg)',
            boxShadow: '0 0 14px var(--theme-glow)',
          }"
          @click="handleTogglePlay"
          title="播放/暂停"
        >
          <Pause v-if="playerStore.isPlaying" class="w-3 h-3 fill-current" />
          <Play v-else class="w-3 h-3 fill-current ml-0.5" />
        </button>
        <button
          class="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] p-1 transition cursor-pointer active:scale-95"
          @click="playerStore.next"
          title="下一首"
        >
          <SkipForward class="w-3.5 h-3.5 fill-current" />
        </button>
      </div>

      <!-- 右侧音乐快捷操作 (收藏 / 加入歌单) -->
      <div
        class="flex items-center gap-1 pl-1.5 shrink-0"
        :style="{ borderLeft: '1px solid var(--theme-border)' }"
      >
        <!-- 收藏按钮 (带弹跳动效) -->
        <button
          ref="heartBtnRef"
          class="p-1 rounded hover:bg-white/5 transition cursor-pointer"
          :class="{
            'text-rose-500 hover:text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]': playerStore.currentTrack.starred,
            'text-[var(--theme-text-muted)] hover:text-rose-400': !playerStore.currentTrack.starred,
          }"
          :title="playerStore.currentTrack.starred ? '取消收藏' : '收藏'"
          @click.stop="handleToggleStar"
        >
          <Heart class="w-3.5 h-3.5" :class="{ 'fill-current': playerStore.currentTrack.starred }" />
        </button>

        <!-- 加入歌单按钮 -->
        <button
          class="p-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)] rounded hover:bg-white/5 transition cursor-pointer"
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
