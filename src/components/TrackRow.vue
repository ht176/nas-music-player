<script setup lang="ts">
import { computed } from 'vue'
import type { Track } from '../api/types'
import { usePlayerStore } from '../stores/player'
import { Heart, Plus, Download, Check, ListPlus, CornerDownRight, MoreHorizontal } from 'lucide-vue-next'
import { cacheService } from '../services/cache'
import { onMounted, ref } from 'vue'
import AddToPlaylistModal from './AddToPlaylistModal.vue'
import gsap from 'gsap'

const props = defineProps<{
  track: Track
  index: number
  isActive?: boolean
  isPlaying?: boolean
}>()

const emit = defineEmits<{
  (e: 'play', track: Track): void
}>()

const playerStore = usePlayerStore()
const isCached = ref(false)
const isDownloading = ref(false)
const showAddToPlaylist = ref(false)
const showMobileMenu = ref(false)

const formattedDuration = computed(() => {
  const dur = props.track.duration || 0
  const m = Math.floor(dur / 60)
  const s = Math.floor(dur % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
})

const onToggleHeart = (e: MouseEvent) => {
  e.stopPropagation()
  const el = e.currentTarget as HTMLElement
  if (el) {
    gsap.fromTo(el, { scale: 1.35, rotate: -15 }, { scale: 1, rotate: 0, duration: 0.45, ease: 'elastic.out(1, 0.4)' })
  }
  playerStore.toggleStar(props.track)
}

const onAddToQueue = (e: MouseEvent) => {
  e.stopPropagation()
  playerStore.addToQueue(props.track)
}

const onPlayNext = (e: MouseEvent) => {
  e.stopPropagation()
  playerStore.playNext(props.track)
}

const onDownload = async (e: MouseEvent) => {
  e.stopPropagation()
  if (isCached.value || isDownloading.value) return
  isDownloading.value = true
  try {
    await playerStore.downloadTrack(props.track)
    isCached.value = true
  } catch (err) {
    console.error('下载失败', err)
  } finally {
    isDownloading.value = false
  }
}

onMounted(async () => {
  isCached.value = await cacheService.isCached(props.track.id)
})
</script>

<template>
  <div
    class="group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border border-transparent"
    :class="props.isActive 
      ? 'bg-[var(--theme-accent)]/15 border-[var(--theme-accent)]/30 text-[var(--theme-accent)] shadow-[0_0_15px_var(--theme-glow)]' 
      : 'hover:bg-black/5 dark:hover:bg-white/[0.04] hover:border-black/5 dark:hover:border-white/5 text-[var(--theme-text-primary)]'"
    @click="emit('play', props.track)"
  >
    <div class="flex items-center gap-3.5 overflow-hidden">
      <!-- 序号或动态声波指示 -->
      <div class="w-6 flex items-center justify-center shrink-0">
        <template v-if="props.isActive && props.isPlaying">
          <div class="flex items-end gap-[2px] h-3.5">
            <span class="w-[3px] rounded-full wave-bar-1" :style="{ background: 'var(--theme-accent)' }"></span>
            <span class="w-[3px] rounded-full wave-bar-2" :style="{ background: 'var(--theme-accent)' }"></span>
            <span class="w-[3px] rounded-full wave-bar-3" :style="{ background: 'var(--theme-accent)' }"></span>
            <span class="w-[3px] rounded-full wave-bar-4" :style="{ background: 'var(--theme-accent)' }"></span>
          </div>
        </template>
        <template v-else-if="props.isActive">
          <span class="text-xs font-bold" :style="{ color: 'var(--theme-accent)' }">▶</span>
        </template>
        <template v-else>
          <span class="text-xs text-[var(--theme-text-muted)] font-mono group-hover:hidden">{{ props.index + 1 }}</span>
          <span class="text-xs text-[var(--theme-accent)] hidden group-hover:inline-block">▶</span>
        </template>
      </div>

      <!-- 歌曲信息 -->
      <div class="truncate">
        <div class="truncate text-sm font-medium transition-colors" :class="props.isActive ? 'text-[var(--theme-accent)] font-semibold' : 'text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)]'">
          {{ props.track.title }}
        </div>
        <div class="truncate text-xs text-[var(--theme-text-secondary)] mt-0.5">
          {{ props.track.artist }} · {{ props.track.album }}
        </div>
      </div>
    </div>

    <!-- 移动端专属右侧操作区 (触控优化，折叠菜单) -->
    <div class="flex sm:hidden items-center gap-1.5 text-xs text-neutral-400 shrink-0 relative" @click.stop>
      <!-- 收藏红心 (移动端常显轻透明度，触控即达) -->
      <button
        class="p-2 rounded-lg cursor-pointer transition active:scale-90"
        :class="props.track.starred ? 'text-rose-500 scale-110' : 'text-neutral-500 hover:text-rose-400'"
        title="收藏"
        @click="onToggleHeart"
      >
        <Heart class="w-4 h-4" :class="{ 'fill-current': props.track.starred }" />
      </button>

      <!-- 移动端更多操作按钮 -->
      <button
        class="p-2 text-neutral-400 hover:text-white rounded-lg transition cursor-pointer active:scale-90"
        title="更多操作"
        @click="showMobileMenu = !showMobileMenu"
      >
        <MoreHorizontal class="w-4 h-4" />
      </button>

      <!-- 移动端弹出快捷操作菜单 -->
      <div
        v-if="showMobileMenu"
        class="absolute right-0 top-10 bg-neutral-900/95 border border-neutral-700/80 rounded-2xl p-1.5 shadow-2xl space-y-1 w-36 z-50 backdrop-blur-xl animate-fade-in text-[11px]"
      >
        <button
          class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-800 text-neutral-200 cursor-pointer"
          @click="onPlayNext(); showMobileMenu = false"
        >
          <CornerDownRight class="w-3.5 h-3.5 text-teal-400" /> 下一首播放
        </button>
        <button
          class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-800 text-neutral-200 cursor-pointer"
          @click="onAddToQueue(); showMobileMenu = false"
        >
          <Plus class="w-3.5 h-3.5 text-neutral-300" /> 加入播放队列
        </button>
        <button
          class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-800 text-neutral-200 cursor-pointer"
          @click="showAddToPlaylist = true; showMobileMenu = false"
        >
          <ListPlus class="w-3.5 h-3.5 text-emerald-400" /> 添加到歌单
        </button>
        <button
          class="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-800 text-neutral-200 cursor-pointer"
          @click="onDownload(); showMobileMenu = false"
        >
          <Check v-if="isCached" class="w-3.5 h-3.5 text-emerald-400" />
          <Download v-else class="w-3.5 h-3.5 text-amber-400" /> {{ isCached ? '已在离线库' : '离线下载' }}
        </button>
      </div>

      <span class="text-[11px] font-mono text-neutral-500 ml-1">{{ formattedDuration }}</span>
    </div>

    <!-- 桌面端专属右侧平铺操作与时长 (全功能 + hover 显示) -->
    <div class="hidden sm:flex items-center gap-2.5 text-xs text-[var(--theme-text-secondary)] shrink-0">
      <!-- 收藏红心 -->
      <button
        class="transition-all p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
        :class="props.track.starred ? 'text-rose-500 opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'opacity-0 group-hover:opacity-100 hover:text-rose-400'"
        title="收藏"
        @click="onToggleHeart"
      >
        <Heart class="w-4 h-4" :class="{ 'fill-current': props.track.starred }" />
      </button>

      <!-- 离线下载按钮 -->
      <button
        class="transition-all p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
        :class="isCached ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 hover:text-[var(--theme-text-primary)]'"
        :style="isCached ? { color: 'var(--theme-accent)' } : undefined"
        :title="isCached ? '已离线下载' : '离线下载到本地'"
        @click="onDownload"
      >
        <Check v-if="isCached" class="w-4 h-4 stroke-[2.5]" />
        <Download v-else class="w-4 h-4" :class="{ 'animate-bounce': isDownloading }" :style="isDownloading ? { color: 'var(--theme-accent)' } : undefined" />
      </button>

      <!-- 添加到指定歌单 -->
      <button
        class="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
        :class="'hover:text-[var(--theme-accent)]'"
        title="添加到歌单"
        @click.stop="showAddToPlaylist = true"
      >
        <ListPlus class="w-4 h-4" />
      </button>

      <!-- 下一首插队播放 -->
      <button
        class="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
        :class="'hover:text-[var(--theme-accent-secondary)]'"
        title="设置为下一首播放"
        @click="onPlayNext"
      >
        <CornerDownRight class="w-4 h-4" />
      </button>

      <!-- 添加到播放队列末尾 -->
      <button
        class="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--theme-text-primary)] cursor-pointer"
        title="添加到播放队列末尾"
        @click="onAddToQueue"
      >
        <Plus class="w-4 h-4" />
      </button>

      <!-- 格式标签 (FLAC/MP3) -->
      <span v-if="props.track.suffix" class="uppercase text-[10px] px-1.5 py-0.5 rounded font-mono font-medium tracking-wider bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[var(--theme-text-secondary)]">
        {{ props.track.suffix }}
      </span>

      <span class="w-11 text-right font-mono text-[var(--theme-text-secondary)]">{{ formattedDuration }}</span>
    </div>

    <!-- 歌单添加弹窗：按需延迟挂载，大幅降低虚拟 DOM 节点与内存开销 -->
    <AddToPlaylistModal
      v-if="showAddToPlaylist"
      v-model="showAddToPlaylist"
      :track="props.track"
    />
  </div>
</template>
