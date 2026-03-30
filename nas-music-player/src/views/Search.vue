<template>
  <div class="search">
    <h1 class="text-3xl font-bold mb-6">搜索</h1>
    
    <!-- 搜索框 -->
    <div class="search-box mb-6">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索歌曲、专辑、艺术家..."
          class="w-full px-4 py-3 pl-12 bg-secondary rounded-lg border border-border-subtle focus:border-primary focus:outline-none text-primary placeholder-text-tertiary transition-colors"
          @input="handleSearch"
          @keyup.enter="handleSearch"
        />
        <svg
          class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <button
          v-if="searchQuery"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-primary transition-colors"
          @click="clearSearch"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center text-secondary py-12">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      <p class="mt-4">搜索中...</p>
    </div>
    
    <!-- 搜索结果 -->
    <div v-else-if="hasSearched" class="search-results">
      <!-- 歌曲结果 -->
      <section v-if="result.songs.length > 0" class="mb-8">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          歌曲
          <span class="text-sm text-tertiary font-normal">({{ result.songs.length }})</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SongItem
            v-for="song in result.songs"
            :key="song.id"
            :song="song"
            :cover-url="getCoverUrl(song.coverArt)"
            @play="handlePlay(song)"
          />
        </div>
      </section>
      
      <!-- 专辑结果 -->
      <section v-if="result.albums.length > 0" class="mb-8">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
          </svg>
          专辑
          <span class="text-sm text-tertiary font-normal">({{ result.albums.length }})</span>
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="album in result.albums"
            :key="album.id"
            class="bg-secondary rounded-lg p-4 hover:bg-tertiary transition-colors cursor-pointer group"
            @click="handleAlbumClick(album)"
          >
            <img
              :src="getCoverUrl(album.coverArt)"
              :alt="album.name"
              class="aspect-square object-cover rounded-md mb-3 group-hover:shadow-lg transition-shadow"
              @error="(e: any) => e.target.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23333%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23666%22 x=%2250%22 y=%2250%22 text-anchor=%22middle%22%3ENo Cover%3C/text%3E%3C/svg%3E'"
            />
            <h3 class="font-medium truncate">{{ album.name }}</h3>
            <p class="text-sm text-tertiary truncate">{{ album.artist }}</p>
          </div>
        </div>
      </section>
      
      <!-- 艺术家结果 -->
      <section v-if="result.artists.length > 0" class="mb-8">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          艺术家
          <span class="text-sm text-tertiary font-normal">({{ result.artists.length }})</span>
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="artist in result.artists"
            :key="artist.id"
            class="bg-secondary rounded-lg p-4 hover:bg-tertiary transition-colors cursor-pointer text-center group"
            @click="handleArtistClick(artist)"
          >
            <img
              v-if="artist.artistImageUrl"
              :src="artist.artistImageUrl"
              :alt="artist.name"
              class="w-24 h-24 mx-auto rounded-full object-cover mb-3 group-hover:shadow-lg transition-shadow"
              @error="(e: any) => e.target.style.display='none'"
            />
            <div v-else class="w-24 h-24 mx-auto rounded-full bg-tertiary mb-3 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-12 h-12 text-text-tertiary">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h3 class="font-medium truncate">{{ artist.name }}</h3>
            <p class="text-sm text-tertiary">{{ artist.albumCount }} 张专辑</p>
          </div>
        </div>
      </section>
      
      <!-- 无结果 -->
      <div v-if="noResults" class="text-center text-secondary py-12">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-16 h-16 mx-auto mb-4 opacity-50">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <p class="text-lg">未找到匹配的结果</p>
        <p class="text-sm mt-2">试试其他关键词吧</p>
      </div>
    </div>
    
    <!-- 初始状态 -->
    <div v-else class="text-center text-secondary py-12">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-24 h-24 mx-auto mb-4 opacity-30">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <p class="text-lg">输入关键词开始搜索</p>
      <p class="text-sm mt-2">支持搜索歌曲、专辑、艺术家</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { search3, getCoverArtUrl } from '@/api/navidrome'
import SongItem from '@/components/music/SongItem.vue'
import type { Song, Album, Artist } from '@/api/navidrome'

const router = useRouter()
const playerStore = usePlayerStore()

const searchQuery = ref('')
const isLoading = ref(false)
const hasSearched = ref(false)

const result = reactive({
  songs: [] as Song[],
  albums: [] as Album[],
  artists: [] as Artist[],
})

const noResults = computed(() => {
  return hasSearched.value && result.songs.length === 0 && result.albums.length === 0 && result.artists.length === 0
})

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// 处理搜索
async function handleSearch() {
  if (!searchQuery.value.trim()) {
    hasSearched.value = false
    result.songs = []
    result.albums = []
    result.artists = []
    return
  }

  // 防抖 500ms
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    isLoading.value = true
    hasSearched.value = true

    try {
      const searchResult = await search3(searchQuery.value, 20)
      
      result.songs = searchResult.song || []
      result.albums = searchResult.album || []
      result.artists = searchResult.artist || []
    } catch (error) {
      console.error('Search failed:', error)
      result.songs = []
      result.albums = []
      result.artists = []
    } finally {
      isLoading.value = false
      debounceTimer = null
    }
  }, 500)
}

// 清空搜索
function clearSearch() {
  searchQuery.value = ''
  hasSearched.value = false
  result.songs = []
  result.albums = []
  result.artists = []
}

// 播放歌曲
async function handlePlay(song: Song) {
  await playerStore.playSong(song)
}

// 点击专辑
function handleAlbumClick(album: Album) {
  router.push(`/album/${album.id}`)
}

// 点击艺术家
function handleArtistClick(artist: Artist) {
  router.push(`/artist/${artist.id}`)
}

// 获取专辑封面 URL
function getCoverUrl(coverArtId: string) {
  return getCoverArtUrl(coverArtId)
}
</script>

<style scoped>
.search {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.search-box {
  max-width: 600px;
}

.search-results section h2 {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
