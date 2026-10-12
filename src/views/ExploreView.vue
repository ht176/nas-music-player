<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import AlbumCard from '../components/AlbumCard.vue'
import type { Album } from '../api/types'
import { Sparkles } from 'lucide-vue-next'

const router = useRouter()
const serverStore = useServerStore()

const newestAlbums = ref<Album[]>([])
const recentAlbums = ref<Album[]>([])
const loading = ref(false)

async function loadData() {
  if (!serverStore.client) return
  loading.value = true
  try {
    const [newest, recent] = await Promise.all([
      serverStore.client.getAlbumList2('newest', 8),
      serverStore.client.getAlbumList2('recent', 8),
    ])
    newestAlbums.value = newest
    recentAlbums.value = recent
  } catch (e) {
    console.error('加载媒体库失败', e)
  } finally {
    loading.value = false
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
  <div class="space-y-8 pb-12">
    <!-- 顶部流光迎宾横幅 -->
    <div class="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-neutral-900/60 border border-emerald-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div class="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      <div class="relative z-10">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
          <Sparkles class="w-3.5 h-3.5 animate-spin-slow" />
          <span>私有云原声体验</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          AuraMusic · <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">极光音乐</span>
        </h1>
        <p class="text-sm text-neutral-300/80 mt-2 max-w-lg leading-relaxed">
          全平台高保真串流，直连您的 Navidrome / Subsonic 私有音乐库，随时随地开启沉浸式听觉盛宴。
        </p>
      </div>
    </div>

    <!-- 最近添加 -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-200">最新添加专辑</h2>
      </div>
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-48 rounded-xl bg-neutral-900 animate-pulse" />
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

    <!-- 最近播放 -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-neutral-200">最近常听</h2>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <AlbumCard
          v-for="album in recentAlbums"
          :key="album.id"
          :album="album"
          @click="goToAlbum"
        />
      </div>
    </div>
  </div>
</template>
