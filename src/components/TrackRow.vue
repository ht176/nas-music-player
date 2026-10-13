<script setup lang="ts">
import { computed } from 'vue'
import type { Track } from '../api/types'
import { usePlayerStore } from '../stores/player'
import { Heart, Plus, Download, Check, ListPlus } from 'lucide-vue-next'
import { cacheService } from '../services/cache'
import { onMounted, ref } from 'vue'
import AddToPlaylistModal from './AddToPlaylistModal.vue'

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

const formattedDuration = computed(() => {
  const dur = props.track.duration || 0
  const m = Math.floor(dur / 60)
  const s = Math.floor(dur % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
})

const onToggleHeart = (e: MouseEvent) => {
  e.stopPropagation()
  playerStore.toggleStar(props.track)
}

const onAddToQueue = (e: MouseEvent) => {
  e.stopPropagation()
  playerStore.addToQueue(props.track)
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
      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.08)]' 
      : 'hover:bg-white/[0.04] hover:border-white/5 text-neutral-300'"
    @click="emit('play', props.track)"
  >
    <div class="flex items-center gap-3.5 overflow-hidden">
      <!-- 序号或动态声波指示 -->
      <div class="w-6 flex items-center justify-center shrink-0">
        <template v-if="props.isActive && props.isPlaying">
          <div class="flex items-end gap-[2px] h-3.5">
            <span class="w-[3px] bg-emerald-400 rounded-full wave-bar-1"></span>
            <span class="w-[3px] bg-emerald-400 rounded-full wave-bar-2"></span>
            <span class="w-[3px] bg-emerald-400 rounded-full wave-bar-3"></span>
            <span class="w-[3px] bg-emerald-400 rounded-full wave-bar-4"></span>
          </div>
        </template>
        <template v-else-if="props.isActive">
          <span class="text-xs text-emerald-400 font-bold">▶</span>
        </template>
        <template v-else>
          <span class="text-xs text-neutral-500 font-mono group-hover:hidden">{{ props.index + 1 }}</span>
          <span class="text-xs text-neutral-300 hidden group-hover:inline-block">▶</span>
        </template>
      </div>

      <!-- 歌曲信息 -->
      <div class="truncate">
        <div class="truncate text-sm font-medium transition-colors" :class="props.isActive ? 'text-emerald-400 font-semibold' : 'text-neutral-200 group-hover:text-white'">
          {{ props.track.title }}
        </div>
        <div class="truncate text-xs text-neutral-400/80 group-hover:text-neutral-400">
          {{ props.track.artist }} · {{ props.track.album }}
        </div>
      </div>
    </div>

    <!-- 右侧操作与时长 -->
    <div class="flex items-center gap-2.5 text-xs text-neutral-400 shrink-0">
      <!-- 收藏红心 -->
      <button
        class="transition-all p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
        :class="props.track.starred ? 'text-rose-500 opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'opacity-0 group-hover:opacity-100 hover:text-rose-400'"
        title="收藏"
        @click="onToggleHeart"
      >
        <Heart class="w-4 h-4" :class="{ 'fill-current': props.track.starred }" />
      </button>

      <!-- 离线下载按钮 -->
      <button
        class="transition-all p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
        :class="isCached ? 'text-emerald-400 opacity-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'opacity-0 group-hover:opacity-100 hover:text-white'"
        :title="isCached ? '已离线下载' : '离线下载到本地'"
        @click="onDownload"
      >
        <Check v-if="isCached" class="w-4 h-4 stroke-[2.5]" />
        <Download v-else class="w-4 h-4" :class="{ 'animate-bounce text-emerald-400': isDownloading }" />
      </button>

      <!-- 添加到指定歌单 -->
      <button
        class="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-white/10 hover:text-emerald-400 cursor-pointer"
        title="添加到歌单"
        @click.stop="showAddToPlaylist = true"
      >
        <ListPlus class="w-4 h-4" />
      </button>

      <!-- 添加到播放队列 -->
      <button
        class="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer"
        title="添加到接下来播放"
        @click="onAddToQueue"
      >
        <Plus class="w-4 h-4" />
      </button>

      <!-- 格式标签 (FLAC/MP3) -->
      <span v-if="props.track.suffix" class="uppercase text-[10px] px-1.5 py-0.5 rounded font-mono font-medium tracking-wider bg-white/5 border border-white/10 text-neutral-400">
        {{ props.track.suffix }}
      </span>

      <span class="w-11 text-right font-mono text-neutral-400">{{ formattedDuration }}</span>
    </div>

    <!-- 歌单添加弹窗 -->
    <AddToPlaylistModal
      v-model="showAddToPlaylist"
      :track="props.track"
    />
  </div>
</template>
