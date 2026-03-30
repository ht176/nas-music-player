<template>
  <footer class="player-bar">
    <!-- 歌曲信息 -->
    <div class="song-info">
      <div class="album-cover">
        <div v-if="player.currentSong?.coverArt" class="album-cover-image">
          <img :src="getCoverUrl(player.currentSong.coverArt)" :alt="player.currentSong.album" />
        </div>
        <div v-else class="album-cover-placeholder">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
      </div>
      <div class="song-details">
        <div class="song-name">{{ player.currentSong?.title || '未播放' }}</div>
        <div class="artist-name">{{ player.currentSong?.artist || '选择一首歌曲开始播放' }}</div>
      </div>
      <button 
        class="favorite-btn" 
        :class="{ 'is-favorite': player.isFavorite }"
        title="收藏"
        @click="handleFavorite"
      >
        <svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <button 
        class="lyrics-btn" 
        title="歌词"
        @click="handleLyrics"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
        </svg>
      </button>
    </div>

    <!-- 播放控制 -->
    <div class="player-controls">
      <div class="control-buttons">
        <button 
          class="control-btn" 
          :class="{ 'is-active': player.playMode === 'shuffle' }"
          title="随机播放"
          @click="player.togglePlayMode"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
          </svg>
        </button>
        <button class="control-btn" title="上一首" @click="player.prev">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
        <button 
          class="play-btn" 
          title="播放/暂停"
          :disabled="player.isLoading"
          @click="player.toggle"
        >
          <svg v-if="player.isLoading" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="60" stroke-dashoffset="10"/>
          </svg>
          <svg v-else-if="player.isPlaying" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button class="control-btn" title="下一首" @click="player.next">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
        <button 
          class="control-btn" 
          :class="{ 'is-active': player.playMode === 'loop' }"
          title="循环播放"
          @click="player.togglePlayMode"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 1l4 4-4 4"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <path d="M7 23l-4-4 4-4"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        </button>
      </div>

      <div class="progress-container">
        <span class="time-current">{{ formatTime(player.currentTime) }}</span>
        <div class="progress-bar" @click="handleProgressClick">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${player.progress}%` }"></div>
          </div>
          <div class="progress-handle" :style="{ left: `${player.progress}%` }"></div>
        </div>
        <span class="time-duration">{{ formatTime(player.duration) }}</span>
      </div>
    </div>

    <!-- 音量控制 -->
    <div class="volume-controls">
      <button class="volume-btn" :title="player.isMuted ? '取消静音' : '静音'" @click="player.toggleMute">
        <svg v-if="player.isMuted || player.volume === 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </button>
      <div class="volume-slider" @click="handleVolumeClick">
        <div class="volume-track">
          <div class="volume-fill" :style="{ width: `${(player.isMuted ? 0 : player.volume) * 100}%` }"></div>
        </div>
        <div class="volume-handle" :style="{ left: `${(player.isMuted ? 0 : player.volume) * 100}%` }"></div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import * as navidrome from '@/api/navidrome'

const router = useRouter()
const player = usePlayerStore()

// 获取专辑封面 URL
function getCoverUrl(coverArtId: string) {
  return navidrome.getCoverArtUrl(coverArtId)
}

// 格式化时间
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 处理进度条点击
function handleProgressClick(event: MouseEvent) {
  const bar = (event.target as HTMLElement).closest('.progress-bar')
  if (!bar) return
  
  const rect = bar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const newTime = percent * player.duration
  player.seek(newTime)
}

// 处理音量条点击
function handleVolumeClick(event: MouseEvent) {
  const bar = (event.target as HTMLElement).closest('.volume-slider')
  if (!bar) return
  
  const rect = bar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  player.setVolume(percent)
}

// 处理收藏
function handleFavorite() {
  player.toggleFavorite()
}

// 打开歌词页面
function handleLyrics() {
  router.push('/lyrics')
}
</script>

<style scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 96px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
}

/* 歌曲信息 */
.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 30%;
  min-width: 200px;
}

.album-cover {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.album-cover-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-cover-placeholder svg {
  width: 32px;
  height: 32px;
  color: var(--text-tertiary);
}

.song-details {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.artist-name {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-btn {
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
  flex-shrink: 0;
}

.favorite-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.heart-icon {
  width: 18px;
  height: 18px;
}

.lyrics-btn {
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
  flex-shrink: 0;
}

.lyrics-btn:hover {
  border-color: var(--text-strong);
  color: var(--text-primary);
  transform: scale(1.05);
}

.lyrics-btn svg {
  width: 16px;
  height: 16px;
}

/* 播放控制 */
.player-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 600px;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
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

.control-btn:hover {
  border-color: var(--text-strong);
  color: var(--text-primary);
  transform: scale(1.05);
}

.control-btn svg {
  width: 16px;
  height: 16px;
}

.play-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  border: none;
  color: var(--text-inverse);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
}

.play-btn:hover {
  background: var(--primary-hover);
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

.play-btn:active {
  transform: scale(0.95);
}

.play-btn svg {
  width: 20px;
  height: 20px;
  margin-left: 2px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.time-current,
.time-duration {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: 'SF Mono', monospace;
  min-width: 40px;
}

.time-duration {
  text-align: right;
}

.progress-bar {
  flex: 1;
  height: 4px;
  position: relative;
  cursor: pointer;
}

.progress-track {
  width: 100%;
  height: 100%;
  background: var(--border-strong);
  border-radius: 2px;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.1s;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--text-primary);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-bar:hover .progress-handle {
  opacity: 1;
}

/* 音量控制 */
.volume-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 30%;
  justify-content: flex-end;
  min-width: 150px;
}

.volume-btn {
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

.volume-btn:hover {
  border-color: var(--text-strong);
  color: var(--text-primary);
}

.volume-btn svg {
  width: 18px;
  height: 18px;
}

.volume-slider {
  width: 100px;
  height: 4px;
  position: relative;
  cursor: pointer;
}

.volume-track {
  width: 100%;
  height: 100%;
  background: var(--border-strong);
  border-radius: 2px;
  position: relative;
}

.volume-fill {
  height: 100%;
  background: var(--text-secondary);
  border-radius: 2px;
  transition: width 0.1s;
}

.volume-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--text-primary);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.volume-slider:hover .volume-handle {
  opacity: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .player-bar {
    height: 64px;
    padding: 0 16px;
  }

  .song-info {
    min-width: 150px;
  }

  .album-cover {
    width: 40px;
    height: 40px;
  }

  .song-name {
    font-size: 13px;
  }

  .artist-name {
    font-size: 11px;
  }

  .favorite-btn {
    display: none;
  }

  .player-controls {
    gap: 4px;
  }

  .control-btn {
    width: 28px;
    height: 28px;
  }

  .control-btn svg {
    width: 14px;
    height: 14px;
  }

  .play-btn {
    width: 36px;
    height: 36px;
  }

  .play-btn svg {
    width: 18px;
    height: 18px;
  }

  .progress-container {
    display: none;
  }

  .volume-controls {
    display: none;
  }
}
</style>
