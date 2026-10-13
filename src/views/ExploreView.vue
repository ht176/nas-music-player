<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import AlbumCard from '../components/AlbumCard.vue'
import TrackRow from '../components/TrackRow.vue'
import type { Album, Track } from '../api/types'
import { Sparkles, ChevronUp, ChevronDown, Flame, Play, RefreshCw, Disc, Clock } from 'lucide-vue-next'

const router = useRouter()
const serverStore = useServerStore()
const playerStore = usePlayerStore()

const newestAlbums = ref<Album[]>([])
const recentAlbums = ref<Album[]>([])
const recommendedTracks = ref<Track[]>([])
const loading = ref(false)
const refreshingRecommendations = ref(false)

// 顶部横幅折叠状态（优先从 LocalStorage 读取）
const isBannerCollapsed = ref(localStorage.getItem('aura_explore_banner_collapsed') === 'true')

function toggleBanner() {
  isBannerCollapsed.value = !isBannerCollapsed.value
  localStorage.setItem('aura_explore_banner_collapsed', String(isBannerCollapsed.value))
}

async function loadRecommendations() {
  if (!serverStore.client) return
  refreshingRecommendations.value = true
  try {
    recommendedTracks.value = await serverStore.client.getRandomSongs(6)
  } catch (err) {
    console.error('获取推荐歌曲失败', err)
  } finally {
    refreshingRecommendations.value = false
  }
}

async function loadData() {
  if (!serverStore.client) return
  loading.value = true
  try {
    const [recent, newest, recSongs] = await Promise.all([
      serverStore.client.getAlbumList2('recent', 8),
      serverStore.client.getAlbumList2('newest', 8),
      serverStore.client.getRandomSongs(6),
    ])
    recentAlbums.value = recent
    newestAlbums.value = newest
    recommendedTracks.value = recSongs
  } catch (e) {
    console.error('加载媒体库失败', e)
  } finally {
    loading.value = false
  }
}

function playAllRecommendations() {
  if (recommendedTracks.value.length) {
    playerStore.playTrack(recommendedTracks.value[0], recommendedTracks.value)
  }
}

function goToAlbum(album: Album) {
  router.push(`/album/${album.id}`)
}

onMounted(() => {
  if (!serverStore.server) {
    router.replace('/settings')
  } else {
    loadData()
  }
})
</script>

<template>
  <div class="space-y-8 pb-12 animate-fade-in">
    <!-- 顶部流光迎宾横幅 (支持右上角自由收缩/展开，记忆偏好) -->
    <div class="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-neutral-900/60 border border-emerald-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
      <div class="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

      <!-- 横幅头部与折叠切换按钮 -->
      <div class="flex items-center justify-between relative z-10">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <Sparkles class="w-3.5 h-3.5 animate-spin-slow" />
          <span>私有云原生体验</span>
        </div>
        <button
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs border border-white/5 transition cursor-pointer"
          :title="isBannerCollapsed ? '展开横幅介绍' : '收起横幅'"
          @click="toggleBanner"
        >
          <span>{{ isBannerCollapsed ? '展开体验介绍' : '收起' }}</span>
          <ChevronDown v-if="isBannerCollapsed" class="w-3.5 h-3.5" />
          <ChevronUp v-else class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- 可展开/收起的详细迎宾文本 -->
      <div v-show="!isBannerCollapsed" class="relative z-10 mt-3 pt-1 transition-all">
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          AuraMusic · <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">极光音乐</span>
        </h1>
        <p class="text-xs sm:text-sm text-neutral-300/80 mt-1.5 max-w-lg leading-relaxed">
          全平台高保真串流，直连您的 Navidrome / Subsonic 私有音乐库，随时随地开启沉浸式听觉盛宴。
        </p>
      </div>
    </div>

    <!-- 🌟 智能推荐曲目 -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold text-neutral-200 flex items-center gap-2">
          <Flame class="w-5 h-5 text-amber-400" /> 推荐曲目
        </h2>
        <div class="flex items-center gap-2">
          <button
            class="text-xs text-neutral-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
            :disabled="refreshingRecommendations"
            @click="loadRecommendations"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': refreshingRecommendations }" /> 换一批
          </button>
          <button
            v-if="recommendedTracks.length"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition cursor-pointer"
            @click="playAllRecommendations"
          >
            <Play class="w-3.5 h-3.5 fill-current" /> 畅听推荐
          </button>
        </div>
      </div>

      <div v-if="loading && !recommendedTracks.length" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-12 rounded-xl bg-neutral-900/60 animate-pulse" />
      </div>
      <div v-else-if="recommendedTracks.length" class="space-y-1">
        <TrackRow
          v-for="(track, idx) in recommendedTracks"
          :key="track.id"
          :track="track"
          :index="idx"
          :is-active="playerStore.currentTrack?.id === track.id"
          :is-playing="playerStore.isPlaying"
          @play="playerStore.playTrack(track, recommendedTracks)"
        />
      </div>
    </div>

    <!-- 🕒 最近常听 (前置放置) -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-200 flex items-center gap-2">
          <Clock class="w-5 h-5 text-emerald-400" /> 最近常听
        </h2>
      </div>
      <div v-if="loading && !recentAlbums.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-48 rounded-xl bg-neutral-900/60 animate-pulse" />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <AlbumCard
          v-for="album in recentAlbums"
          :key="album.id"
          :album="album"
          @click="goToAlbum"
        />
      </div>
    </div>

    <!-- 💿 最新添加专辑 (调整到最近常听下方) -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-200 flex items-center gap-2">
          <Disc class="w-5 h-5 text-teal-400" /> 最新添加专辑
        </h2>
      </div>
      <div v-if="loading && !newestAlbums.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-48 rounded-xl bg-neutral-900/60 animate-pulse" />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <AlbumCard
          v-for="album in newestAlbums"
          :key="album.id"
          :album="album"
          @click="goToAlbum"
        />
      </div>
    </div>
  </div>
</template>
