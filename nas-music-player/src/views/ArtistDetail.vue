<template>
  <div class="artist-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      <p class="mt-4 text-secondary">加载中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-16 h-16 mb-4 text-red-500">
        <circle cx="12" cy="12" r="10"/>
        <path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
      <p class="text-lg text-secondary">{{ error }}</p>
      <Button @click="loadArtist" variant="primary" class="mt-4">
        重试
      </Button>
    </div>
    
    <!-- 艺术家内容 -->
    <div v-else-if="artist" class="artist-content">
      <!-- 头部信息 -->
      <div class="artist-header">
        <div class="artist-image-wrapper">
          <img
            v-if="artistImageUrl"
            :src="artistImageUrl"
            :alt="artist.name"
            class="artist-image"
            @error="handleImageError"
          />
          <div v-else class="artist-image-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
        
        <div class="artist-info">
          <p class="artist-label">艺术家</p>
          <h1 class="artist-name">{{ artist.name }}</h1>
          
          <div class="artist-meta">
            <span>{{ artist.albumCount }} 张专辑</span>
          </div>
          
          <!-- 操作按钮 -->
          <div class="artist-actions">
            <Button @click="handlePlayTopSongs" variant="primary" size="lg">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-2">
                <path d="M8 5v14l11-7z"/>
              </svg>
              播放热门歌曲
            </Button>
          </div>
        </div>
      </div>
      
      <!-- 专辑列表 -->
      <div class="albums-section">
        <h2 class="section-title">专辑</h2>
        
        <div v-if="albums.length > 0" class="albums-grid">
          <div
            v-for="album in albums"
            :key="album.id"
            class="album-card"
            @click="handleAlbumClick(album)"
          >
            <div class="album-card-cover">
              <img
                v-if="album.coverArt"
                :src="getCoverUrl(album.coverArt)"
                :alt="album.name"
                class="album-card-image"
                @error="(e: any) => e.target.style.display='none'"
              />
              <div v-else class="album-card-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            </div>
            
            <div class="album-card-info">
              <h3 class="album-card-title">{{ album.name }}</h3>
              <p class="album-card-year">{{ album.year }}</p>
              <p class="album-card-count">{{ album.songCount }} 首歌曲</p>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <p class="text-secondary">暂无专辑信息</p>
        </div>
      </div>
      
      <!-- 热门歌曲 -->
      <div class="top-songs-section" v-if="topSongs.length > 0">
        <h2 class="section-title">热门歌曲</h2>
        
        <div class="songs-list">
          <div
            v-for="(song, index) in topSongs"
            :key="song.id"
            class="song-item"
            :class="{ 'is-playing': player.currentSong?.id === song.id }"
            @dblclick="handlePlaySong(song)"
          >
            <!-- 序号 -->
            <div class="song-index">
              <span v-if="player.currentSong?.id !== song.id" class="index-number">{{ index + 1 }}</span>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" class="playing-icon">
                <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
              </svg>
            </div>
            
            <!-- 标题 -->
            <div class="song-main" @click="handlePlaySong(song)">
              <div class="song-title">{{ song.title }}</div>
            </div>
            
            <!-- 专辑 -->
            <div class="song-album">{{ song.album }}</div>
            
            <!-- 时长 -->
            <div class="song-duration">{{ formatDuration(song.duration) }}</div>
            
            <!-- 操作按钮 -->
            <div class="song-actions">
              <button
                class="action-btn"
                title="播放"
                @click="handlePlaySong(song)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { getArtist, getAlbum, getCoverArtUrl, type Artist, type Album, type Song, getTopSongs } from '@/api/navidrome'
import Button from '@/components/common/Button.vue'

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()

const artist = ref<Artist | null>(null)
const albums = ref<Album[]>([])
const topSongs = ref<Song[]>([])
const artistImageUrl = ref<string>('')
const loading = ref(true)
const error = ref<string | null>(null)

// 格式化时长
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 获取专辑封面
function getCoverUrl(id: string) {
  return getCoverArtUrl(id)
}

// 处理图片加载失败
function handleImageError() {
  artistImageUrl.value = ''
}

// 加载艺术家详情
async function loadArtist() {
  loading.value = true
  error.value = null
  
  try {
    const artistId = route.params.id as string
    const data = await getArtist(artistId)
    
    artist.value = data.artist
    artistImageUrl.value = data.artist.artistImageUrl || ''
    
    // 加载专辑列表
    if (data.artist.album) {
      albums.value = data.artist.album
    }
    
    // 加载热门歌曲
    if (artist.value && artist.value.name) {
      try {
        topSongs.value = await getTopSongs(20)
        // 过滤出该艺术家的歌曲
        topSongs.value = topSongs.value.filter(song => 
          song.artist === artist.value!.name
        ).slice(0, 10)
      } catch (e) {
        console.warn('Failed to load top songs:', e)
        topSongs.value = []
      }
    }
  } catch (e: any) {
    console.error('Failed to load artist:', e)
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

// 播放热门歌曲
async function handlePlayTopSongs() {
  if (topSongs.value.length > 0) {
    await player.playSong(topSongs.value[0])
  } else if (albums.value.length > 0) {
    // 如果没有热门歌曲，播放第一张专辑的第一首歌
    try {
      const album = await getAlbum(albums.value[0].id)
      if (album.songs && album.songs.length > 0) {
        await player.playSong(album.songs[0])
      }
    } catch (e) {
      console.error('Failed to play:', e)
    }
  }
}

// 播放单曲
async function handlePlaySong(song: Song) {
  await player.playSong(song)
}

// 点击专辑
function handleAlbumClick(album: Album) {
  router.push(`/album/${album.id}`)
}

onMounted(() => {
  loadArtist()
})
</script>

<style scoped>
.artist-detail {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

/* 加载和错误状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

/* 艺术家内容 */
.artist-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* 头部 */
.artist-header {
  display: flex;
  gap: 32px;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border-subtle);
}

.artist-image-wrapper {
  flex-shrink: 0;
}

.artist-image {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.artist-image-placeholder {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.artist-image-placeholder svg {
  width: 120px;
  height: 120px;
  color: var(--text-tertiary);
}

.artist-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.artist-label {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.artist-name {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.artist-meta {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 24px;
}

.artist-actions {
  display: flex;
  gap: 12px;
}

/* 专辑列表 */
.albums-section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
}

.album-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.album-card:hover {
  transform: translateY(-4px);
}

.album-card-cover {
  position: relative;
  aspect-square;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  background: var(--bg-tertiary);
}

.album-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-card-placeholder svg {
  width: 60px;
  height: 60px;
  color: var(--text-tertiary);
}

.album-card-info {
  padding: 0 4px;
}

.album-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.album-card-year {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.album-card-count {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 热门歌曲 */
.top-songs-section {
  margin-bottom: 32px;
}

.songs-list {
  display: flex;
  flex-direction: column;
}

.song-item {
  display: grid;
  grid-template-columns: 48px 1fr 1fr 80px 60px;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.song-item:hover {
  background: var(--bg-tertiary);
}

.song-item.is-playing {
  background: var(--primary-soft);
}

.song-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--text-tertiary);
  font-size: 14px;
}

.playing-icon {
  width: 20px;
  height: 20px;
  color: var(--primary);
}

.song-main {
  min-width: 0;
}

.song-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-album {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-duration {
  font-size: 13px;
  color: var(--text-tertiary);
  font-family: 'SF Mono', monospace;
  text-align: right;
}

.song-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.song-item:hover .song-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--text-secondary);
}

/* 响应式 */
@media (max-width: 1024px) {
  .song-item {
    grid-template-columns: 48px 1fr 80px 60px;
  }
  
  .song-album {
    display: none;
  }
}

@media (max-width: 768px) {
  .artist-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .artist-image,
  .artist-image-placeholder {
    width: 200px;
    height: 200px;
  }
  
  .artist-info {
    align-items: center;
  }
  
  .artist-name {
    font-size: 28px;
  }
  
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }
  
  .song-item {
    grid-template-columns: 40px 1fr 60px 40px;
    gap: 12px;
    padding: 10px 12px;
  }
  
  .song-duration {
    font-size: 12px;
  }
  
  .song-actions {
    display: none;
  }
}
</style>
