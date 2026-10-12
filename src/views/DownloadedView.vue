<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cacheService, type CachedTrackRecord } from '../services/cache'
import { usePlayerStore } from '../stores/player'
import TrackRow from '../components/TrackRow.vue'
import { DownloadCloud, Play, Trash2, HardDrive } from 'lucide-vue-next'

const playerStore = usePlayerStore()
const cachedRecords = ref<CachedTrackRecord[]>([])
const loading = ref(true)

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const totalSize = ref(0)

async function loadCachedTracks() {
  loading.value = true
  try {
    const records = await cacheService.getAllCachedTracks()
    cachedRecords.value = records
    totalSize.value = records.reduce((acc, r) => acc + (r.size || 0), 0)
  } catch (e) {
    console.error('加载离线歌曲失败', e)
  } finally {
    loading.value = false
  }
}

function playAll() {
  if (cachedRecords.value.length) {
    const tracks = cachedRecords.value.map((r) => r.track)
    playerStore.playTrack(tracks[0], tracks)
  }
}

async function clearAllCache() {
  if (!confirm('确定清空所有本地离线音乐缓存吗？')) return
  await cacheService.clearAll()
  loadCachedTracks()
}

onMounted(() => {
  loadCachedTracks()
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- 头部信息 -->
    <div class="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 bg-gradient-to-b from-emerald-950/40 via-neutral-900/40 to-transparent p-6 rounded-2xl border border-emerald-500/10">
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <div class="w-36 h-36 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-neutral-950 shadow-xl shrink-0">
          <DownloadCloud class="w-16 h-16 stroke-[1.5]" />
        </div>
        <div class="space-y-2 text-center sm:text-left">
          <div class="text-xs uppercase tracking-wider text-emerald-400 font-semibold">本地存储</div>
          <h1 class="text-3xl font-bold text-white">已下载音乐</h1>
          <div class="flex items-center gap-3 text-xs text-neutral-400">
            <span>{{ cachedRecords.length }} 首离线曲目</span>
            <span>·</span>
            <span class="flex items-center gap-1 font-mono text-neutral-300">
              <HardDrive class="w-3.5 h-3.5 text-emerald-400" /> {{ formatSize(totalSize) }}
            </span>
          </div>
          <div class="pt-2">
            <button
              class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition shadow-lg cursor-pointer disabled:opacity-50"
              :disabled="!cachedRecords.length"
              @click="playAll"
            >
              <Play class="w-4 h-4 fill-current" /> 离线畅听全部
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="cachedRecords.length"
        class="text-xs text-neutral-400 hover:text-rose-400 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 transition cursor-pointer self-center sm:self-start"
        @click="clearAllCache"
      >
        <Trash2 class="w-4 h-4" /> 清空全部缓存
      </button>
    </div>

    <!-- 歌曲列表 -->
    <div v-if="loading" class="text-center py-12 text-neutral-500 text-sm">
      正在读取本地离线库...
    </div>

    <div v-else-if="cachedRecords.length" class="space-y-1">
      <TrackRow
        v-for="(record, idx) in cachedRecords"
        :key="record.id"
        :track="record.track"
        :index="idx"
        :is-active="playerStore.currentTrack?.id === record.id"
        :is-playing="playerStore.isPlaying"
        @play="playerStore.playTrack(record.track, cachedRecords.map(r => r.track))"
      />
    </div>

    <div v-else class="text-center py-20 text-neutral-500 text-sm">
      本地暂无离线音乐。在任意歌曲列表中点击下载图标，即可缓存至本地断网畅听。
    </div>
  </div>
</template>
