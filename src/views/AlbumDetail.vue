<template>
  <div class="album-detail">
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
      <Button @click="loadAlbum" variant="primary" class="mt-4">
        重试
      </Button>
    </div>
    
    <!-- 专辑内容 -->
    <div v-else-if="album" class="album-content">
      <!-- 头部信息 -->
      <div class="album-header">
        <div class="album-cover-wrapper">
          <img
            v-if="coverUrl"
            :src="coverUrl"
            :alt="album.name"
            class="album-cover"
          />
          <div v-else class="album-cover-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        </div>
        
        <div class="album-info">
          <p class="album-label">专辑</p>
          <h1 class="album-title">{{ album.name }}</h1>
          <p v-if="album.artist" class="artist-name">{{ album.artist }}</p>
          
          <div class="album-meta">
            <span>{{ album.songCount }} 首歌曲</span>
            <span v-if="album.year">• {{ album.year }}</span>
            <span v-if="album.genre">• {{ album.genre }}</span>
          </div>
          
          <!-- 操作按钮 -->
          <div class="album-actions">
            <Button @click="handlePlayAll" variant="primary" size="lg" :disabled="!songs.length">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-2">
                <path d="M8 5v14l11-7z"/>
              </svg>
              播放全部
            </Button>
            <Button @click="handleShuffle" variant="secondary" size="lg" :disabled="!songs.length">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 mr-2">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
              </svg>
              随机播放
            </Button>
          </div>
        </div>
      </div>
      
      <!-- 歌曲列表 -->
      <div class="songs-section">
        <h2 class="section-title">歌曲列表</h2>
        
        <div class="songs-list">
          <div
            v-for="(song, index) in songs"
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
            
            <!-- 标题和艺术家 -->
            <div class="song-main" @click="handlePlaySong(song)">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist mobile-only">{{ song.artist }}</div>
            </div>
            
            <!-- 艺术家（桌面端） -->
            <div class="song-artist desktop-only">{{ song.artist }}</div>
            
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
              <button
                class="action-btn"
                title="添加到播放队列"
                @click.stop="handleAddToQueue(song)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                  <path d="M12 5v14M5 12h14"/>
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
import { useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { getAlbum, getCoverArtUrl, type Album, type Song } from '@/api/navidrome'
import Button from '@/components/common/Button.vue'

const route = useRoute()
const player = usePlayerStore()

const album = ref<Album | null>(null)
const songs = ref<Song[]>([])
const coverUrl = ref<string>('')
const loading = ref(true)
const error = ref<string | null>(null)

// 格式化时长
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 加载专辑详情
async function loadAlbum() {
  loading.value = true
  error.value = null
  
  try {
    const albumId = route.params.id as string
    const data = await getAlbum(albumId)
    
    album.value = data
    songs.value = data.songs || []
    
    if (data.coverArt) {
      coverUrl.value = getCoverArtUrl(data.coverArt)
    }
  } catch (e: any) {
    console.error('Failed to load album:', e)
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

// 播放全部
async function handlePlayAll() {
  if (songs.value.length > 0) {
    await player.playSong(songs.value[0])
    // TODO: 添加到播放队列
  }
}

// 随机播放
async function handleShuffle() {
  if (songs.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * songs.value.length)
    await player.playSong(songs.value[randomIndex])
    player.setPlayMode('shuffle')
  }
}

// 播放单曲
async function handlePlaySong(song: Song) {
  await player.playSong(song)
}

// 添加到播放队列
async function handleAddToQueue(song: Song) {
  // TODO: 实现播放队列功能
  console.log('Add to queue:', song.title)
}

onMounted(() => {
  loadAlbum()
})
</script>

<style scoped>
.album-detail {
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

/* 专辑内容 */
.album-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* 头部 */
.album-header {
  display: flex;
  gap: 32px;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border-subtle);
}

.album-cover-wrapper {
  flex-shrink: 0;
}

.album-cover {
  width: 300px;
  height: 300px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.album-cover-placeholder {
  width: 300px;
  height: 300px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-cover-placeholder svg {
  width: 120px;
  height: 120px;
  color: var(--text-tertiary);
}

.album-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.album-label {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.album-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.artist-name {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.album-meta {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 24px;
}

.album-actions {
  display: flex;
  gap: 12px;
}

/* 歌曲列表 */
.songs-section {
  margin-top: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.songs-list {
  display: flex;
  flex-direction: column;
}

.song-item {
  display: grid;
  grid-template-columns: 48px 1fr 1fr 80px 80px;
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
  margin-bottom: 4px;
}

.song-artist {
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

/* 响应式 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 1024px) {
  .song-item {
    grid-template-columns: 48px 1fr 80px 60px;
  }
  
  .song-artist.desktop-only {
    display: none;
  }
  
  .song-artist.mobile-only {
    display: block;
  }
}

@media (max-width: 768px) {
  .album-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .album-cover,
  .album-cover-placeholder {
    width: 240px;
    height: 240px;
  }
  
  .album-info {
    align-items: center;
  }
  
  .album-title {
    font-size: 28px;
  }
  
  .artist-name {
    font-size: 16px;
  }
  
  .album-actions {
    width: 100%;
    justify-content: center;
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
