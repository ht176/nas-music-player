<template>
  <div class="playlist-detail">
    <!-- 歌单头部 -->
    <div class="flex items-start gap-6 mb-8">
      <!-- 封面 -->
      <div class="w-52 h-52 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
        <div class="text-6xl">🎵</div>
      </div>
      
      <!-- 信息 -->
      <div class="flex-1">
        <p class="text-sm text-tertiary mb-2">歌单</p>
        <h1 class="text-4xl font-bold mb-4">{{ playlist?.name || '加载中...' }}</h1>
        <p v-if="playlist?.description" class="text-secondary mb-4">{{ playlist.description }}</p>
        <div class="flex items-center gap-4 text-sm text-tertiary">
          <span>{{ playlist?.songCount || 0 }} 首歌曲</span>
          <span>•</span>
          <span>创建于 {{ formatDate(playlist?.createdAt) }}</span>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex items-center gap-3 mt-6">
          <Button @click="handlePlayAll" variant="primary" size="lg" :disabled="!playlist || playlist.songs.length === 0">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-2">
              <path d="M8 5v14l11-7z"/>
            </svg>
            播放全部
          </Button>
          <Button @click="handleEdit" variant="secondary" size="lg">
            编辑歌单
          </Button>
        </div>
      </div>
    </div>
    
    <!-- 歌曲列表 -->
    <div v-if="playlist && playlist.songs.length > 0">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">歌曲列表</h2>
        <span class="text-tertiary">{{ playlist.songs.length }} 首</span>
      </div>
      
      <div class="space-y-2">
        <div
          v-for="(song, index) in playlistSongs"
          :key="song.id"
          class="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors group"
        >
          <!-- 序号 -->
          <span class="w-8 text-center text-tertiary">{{ index + 1 }}</span>
          
          <!-- 封面 -->
          <img
            :src="getCoverUrl(song.coverArt)"
            :alt="song.album"
            class="w-12 h-12 rounded object-cover"
          />
          
          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ song.title }}</div>
            <div class="text-sm text-tertiary truncate">{{ song.artist }}</div>
          </div>
          
          <!-- 专辑 -->
          <div class="hidden md:block text-sm text-tertiary truncate w-48">
            {{ song.album }}
          </div>
          
          <!-- 时长 -->
          <div class="text-sm text-tertiary w-16 text-right">
            {{ formatDuration(song.duration) }}
          </div>
          
          <!-- 操作 -->
          <button
            class="p-2 opacity-0 group-hover:opacity-100 hover:bg-tertiary rounded transition-all"
            title="播放"
            @click="handlePlaySong(song)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button
            class="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 rounded transition-all"
            title="从歌单移除"
            @click="handleRemoveSong(song.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="playlist" class="text-center text-secondary py-12">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-24 h-24 mx-auto mb-4 opacity-30">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
      <p class="text-lg">这个歌单还没有歌曲</p>
      <p class="text-sm mt-2">去音乐库添加一些歌曲吧</p>
      <Button @click="router.push('/library')" variant="primary" class="mt-4">
        去音乐库
      </Button>
    </div>
    
    <!-- 加载中 -->
    <div v-else class="text-center text-secondary py-12">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      <p class="mt-4">加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { getSong, getCoverArtUrl } from '@/api/navidrome'
import Button from '@/components/common/Button.vue'
import type { Song } from '@/api/navidrome'

interface PlaylistType {
  id: string
  name: string
  songs: string[]
  songCount: number
  createdAt?: string
  updatedAt?: string
  description?: string
}

const router = useRouter()
const route = useRoute()
const playerStore = usePlayerStore()

const playlist = ref<PlaylistType | null>(null)
const playlistSongs = ref<Song[]>([])

// 格式化日期
function formatDate(dateString?: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 格式化时长
function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 获取专辑封面
function getCoverUrl(id: string) {
  return getCoverArtUrl(id)
}

// 加载歌单详情
async function loadPlaylist() {
  const playlistId = route.params.id as string
  const saved = localStorage.getItem('playlists')
  
  if (saved) {
    try {
      const playlists: PlaylistType[] = JSON.parse(saved)
      playlist.value = playlists.find(p => p.id === playlistId) || null
      
      // 加载歌曲详情
      if (playlist.value && playlist.value.songs.length > 0) {
        const songPromises = playlist.value.songs.map((id: string) => getSong(id))
        playlistSongs.value = await Promise.all(songPromises)
      }
    } catch (e) {
      console.error('Failed to load playlist:', e)
      playlist.value = null
    }
  }
}

// 播放全部
async function handlePlayAll() {
  if (playlistSongs.value.length > 0) {
    await playerStore.playSong(playlistSongs.value[0])
    // TODO: 添加到播放队列
  }
}

// 播放单曲
async function handlePlaySong(song: Song) {
  await playerStore.playSong(song)
}

// 编辑歌单
function handleEdit() {
  router.push(`/playlist/${route.params.id}/edit`)
}

// 移除歌曲
async function handleRemoveSong(songId: string) {
  if (!playlist.value) return
  
  if (confirm('确定要从歌单中移除这首歌曲吗？')) {
    playlist.value.songs = playlist.value.songs.filter((id: string) => id !== songId)
    playlist.value.songCount = playlist.value.songs.length
    
    // 保存到 localStorage
    const saved = localStorage.getItem('playlists')
    if (saved) {
      const playlists: PlaylistType[] = JSON.parse(saved)
      const index = playlists.findIndex(p => p.id === playlist.value!.id)
      if (index !== -1) {
        playlists[index] = playlist.value
        localStorage.setItem('playlists', JSON.stringify(playlists))
      }
    }
    
    // 重新加载
    await loadPlaylist()
  }
}

onMounted(() => {
  loadPlaylist()
})
</script>

<style scoped>
.playlist-detail {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}
</style>
