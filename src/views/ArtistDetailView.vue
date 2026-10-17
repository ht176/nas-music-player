<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import AlbumCard from '../components/AlbumCard.vue'
import type { Album, Artist } from '../api/types'
import { User, Disc } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const serverStore = useServerStore()

const artist = ref<Artist | null>(null)
const loading = ref(true)

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(artist.value?.coverArtId, 300) || ''
})

async function fetchArtistDetail() {
  const id = route.params.id as string
  if (!id || !serverStore.client) return
  loading.value = true
  try {
    artist.value = await serverStore.client.getArtist(id)
  } catch (e) {
    console.error('获取艺术家详情失败', e)
  } finally {
    loading.value = false
  }
}

function goToAlbum(album: Album) {
  router.push(`/album/${album.id}`)
}

onMounted(() => {
  fetchArtistDetail()
})
</script>

<template>
  <div v-if="artist" class="space-y-8 pb-12">
    <!-- 艺术家头部 -->
    <div class="glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
      <div class="w-36 h-36 rounded-full overflow-hidden shadow-2xl bg-neutral-200 dark:bg-neutral-900 border border-[var(--theme-border)] shrink-0 flex items-center justify-center">
        <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover" />
        <User v-else class="w-16 h-16 text-[var(--theme-text-muted)]" />
      </div>
      <div class="space-y-2 text-center sm:text-left">
        <div class="text-xs uppercase tracking-wider text-[var(--theme-accent)] font-semibold">音乐人</div>
        <h1 class="text-3xl font-bold text-[var(--theme-text-primary)]">{{ artist.name }}</h1>
        <p class="text-xs text-[var(--theme-text-secondary)]">共计发行/包含 {{ artist.albums?.length || 0 }} 张专辑作品</p>
      </div>
    </div>

    <!-- 专辑列表 -->
    <div>
      <h2 class="text-lg font-semibold text-[var(--theme-text-primary)] mb-4 flex items-center gap-2">
        <Disc class="w-5 h-5 text-[var(--theme-accent)]" /> 全部专辑
      </h2>
      <div v-if="artist.albums?.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AlbumCard
          v-for="album in artist.albums"
          :key="album.id"
          :album="album"
          @click="goToAlbum"
        />
      </div>
      <div v-else class="text-neutral-500 text-sm py-8 text-center">
        暂无专辑数据
      </div>
    </div>
  </div>
</template>
