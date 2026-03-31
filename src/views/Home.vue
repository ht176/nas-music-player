<template>
  <div class="home">
    <h1 class="text-3xl font-bold mb-6">首页</h1>
    
    <!-- 连接状态 -->
    <div v-if="navidromeStore.hasError" class="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
      <p class="text-red-500">❌ 连接失败：{{ navidromeStore.error }}</p>
      <Button @click="handleTestConnection" class="mt-2" size="sm">
        重新连接
      </Button>
    </div>
    
    <!-- 最近播放 -->
    <section class="mt-8">
      <h2 class="text-xl font-semibold mb-4">🎵 推荐歌曲</h2>
      <div v-if="navidromeStore.isLoading" class="text-secondary">加载中...</div>
      <div v-else-if="navidromeStore.songs.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SongItem
          v-for="song in navidromeStore.songs"
          :key="song.id"
          :song="song"
          :cover-url="navidromeStore.getCoverArtUrl(song.coverArt)"
          @play="handlePlay(song)"
        />
      </div>
      <div v-else class="text-secondary">暂无推荐歌曲</div>
    </section>
    
    <!-- 推荐专辑 -->
    <section class="mt-8">
      <h2 class="text-xl font-semibold mb-4">💿 推荐专辑</h2>
      <div v-if="navidromeStore.isLoading" class="text-secondary">加载中...</div>
      <div v-else-if="navidromeStore.albums.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="album in navidromeStore.albums"
          :key="album.id"
          class="bg-secondary rounded-lg p-4 hover:bg-tertiary transition-colors cursor-pointer group"
          @click="handleAlbumClick(album)"
        >
          <img
            :src="navidromeStore.getCoverArtUrl(album.coverArt)"
            :alt="album.name"
            class="aspect-square object-cover rounded-md mb-3 group-hover:shadow-lg transition-shadow"
            @error="$event.target.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23333%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23666%22 x=%2250%22 y=%2250%22 text-anchor=%22middle%22%3ENo Cover%3C/text%3E%3C/svg%3E'"
          />
          <h3 class="font-medium truncate">{{ album.name }}</h3>
          <p class="text-sm text-tertiary truncate">{{ album.artist }}</p>
        </div>
      </div>
      <div v-else class="text-secondary">暂无推荐专辑</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNavidromeStore } from '@/stores/navidrome'
import { usePlayerStore } from '@/stores/player'
import SongItem from '@/components/music/SongItem.vue'
import Button from '@/components/common/Button.vue'
import type { Album } from '@/api/navidrome'

const router = useRouter()
const navidromeStore = useNavidromeStore()
const playerStore = usePlayerStore()

// 测试连接并加载数据
async function handleTestConnection() {
  const success = await navidromeStore.testConnection()
  if (success) {
    await Promise.all([
      navidromeStore.loadAlbums('random', 8),
      // 使用 getTopSongs 替代 getRandomSongs
      navidromeStore.loadSongs(12)
    ])
  }
}

// 播放歌曲
async function handlePlay(song: any) {
  console.log('播放歌曲:', song.title)
  await playerStore.playSong(song)
}

// 点击专辑
function handleAlbumClick(album: Album) {
  router.push(`/album/${album.id}`)
}

// 组件挂载时加载数据
onMounted(async () => {
  await handleTestConnection()
})
</script>

<style scoped>
.home {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}
</style>
