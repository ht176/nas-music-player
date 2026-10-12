<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import type { Artist } from '../api/types'
import { User } from 'lucide-vue-next'

const router = useRouter()
const serverStore = useServerStore()
const artists = ref<Artist[]>([])
const loading = ref(true)

async function loadArtists() {
  if (!serverStore.client) return
  loading.value = true
  try {
    artists.value = await serverStore.client.getArtists()
  } catch (e) {
    console.error('加载艺术家列表失败', e)
  } finally {
    loading.value = false
  }
}

function goToArtist(artist: Artist) {
  router.push(`/artist/${artist.id}`)
}

onMounted(() => {
  loadArtists()
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
        <User class="w-6 h-6 text-emerald-400" /> 艺术家
      </h1>
      <p class="text-sm text-neutral-400 mt-1">曲库中共收藏 {{ artists.length }} 位音乐人</p>
    </div>

    <div v-if="loading" class="text-center py-12 text-neutral-500 text-sm">
      正在加载艺术家...
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div
        v-for="artist in artists"
        :key="artist.id"
        class="group flex flex-col items-center p-4 rounded-2xl bg-neutral-900/60 hover:bg-neutral-800/80 cursor-pointer transition text-center"
        @click="goToArtist(artist)"
      >
        <div class="w-24 h-24 rounded-full bg-neutral-800 overflow-hidden shadow-lg mb-3 flex items-center justify-center border border-white/5 group-hover:scale-105 transition duration-300">
          <img
            v-if="serverStore.client?.getCoverArtUrl(artist.coverArtId, 200)"
            :src="serverStore.client?.getCoverArtUrl(artist.coverArtId, 200)"
            class="w-full h-full object-cover"
          />
          <User v-else class="w-10 h-10 text-neutral-600" />
        </div>
        <div class="text-sm font-semibold text-neutral-200 group-hover:text-white truncate max-w-full">
          {{ artist.name }}
        </div>
        <div class="text-xs text-neutral-500 mt-0.5">
          {{ artist.albumCount }} 张专辑
        </div>
      </div>
    </div>
  </div>
</template>
