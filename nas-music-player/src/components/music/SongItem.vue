<template>
  <div 
    class="song-item" 
    :class="{ 
      'song-item-playing': playing,
      'song-item-hover': hoverable,
    }"
    @click="handleClick"
    @dblclick="handleDoubleClick"
  >
    <!-- 序号/播放图标 -->
    <div class="song-index">
      <span v-if="!playing" class="index-number">{{ index }}</span>
      <svg v-else class="playing-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    </div>

    <!-- 歌曲信息 -->
    <div class="song-info">
      <div class="song-name" :class="{ 'text-primary': playing }">
        {{ song.title || song.name }}
      </div>
      <div class="song-artist">
        <span v-if="song.artist">{{ song.artist }}</span>
        <span v-if="song.album" class="album-separator"> · </span>
        <span v-if="song.album">{{ song.album }}</span>
      </div>
    </div>

    <!-- 专辑封面 (桌面端) -->
    <div v-if="(song.cover || coverUrl) && showCover" class="song-cover">
      <img :src="coverUrl || song.cover" :alt="song.title || song.name" class="cover-image" />
    </div>

    <!-- 播放次数 -->
    <div v-if="showPlayCount" class="song-play-count">
      {{ formatPlayCount(song.playCount || 0) }}
    </div>

    <!-- 时长 -->
    <div class="song-duration">
      {{ formatDuration(song.duration) }}
    </div>

    <!-- 操作按钮 -->
    <div class="song-actions">
      <button class="action-btn play-btn" @click.stop="handlePlayClick" title="播放">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
      <button class="action-btn favorite-btn" :class="{ 'is-favorite': song.isFavorite }" @click.stop="handleFavorite">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <button class="action-btn more-btn" @click.stop="handleMore">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="19" r="2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Song {
  id: string
  title?: string
  name?: string
  artist?: string
  album?: string
  coverArt?: string
  cover?: string
  duration: number
  playCount?: number
  isFavorite?: boolean
}

interface Props {
  song: Song
  index?: number
  playing?: boolean
  showCover?: boolean
  showPlayCount?: boolean
  hoverable?: boolean
  coverUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  index: 1,
  playing: false,
  showCover: false,
  showPlayCount: false,
  hoverable: true,
  coverUrl: '',
})

const emit = defineEmits<{
  click: [song: Song]
  play: [song: Song]
  favorite: [song: Song]
  more: [song: Song]
}>()

// 格式化时长
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 格式化播放次数
const formatPlayCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

const handleClick = () => {
  emit('click', props.song)
}

const handlePlayClick = () => {
  emit('play', props.song)
}

const handleDoubleClick = () => {
  emit('play', props.song)
}

const handleFavorite = () => {
  emit('favorite', props.song)
}

const handleMore = () => {
  emit('more', props.song)
}
</script>

<style scoped>
.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.song-item:hover {
  background: var(--bg-tertiary);
}

.song-item-playing {
  background: var(--primary-soft);
}

.song-item-hover:hover .song-actions {
  opacity: 1;
}

/* 序号 */
.song-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.index-number {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.playing-icon {
  width: 20px;
  height: 20px;
  color: var(--primary);
}

/* 歌曲信息 */
.song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-name.text-primary {
  color: var(--primary);
}

.song-artist {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-separator {
  color: var(--text-tertiary);
}

/* 专辑封面 */
.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 播放次数 */
.song-play-count {
  font-size: 12px;
  color: var(--text-tertiary);
  min-width: 50px;
  text-align: right;
}

/* 时长 */
.song-duration {
  font-size: 13px;
  color: var(--text-tertiary);
  font-family: 'SF Mono', monospace;
  min-width: 45px;
  text-align: right;
}

/* 操作按钮 */
.song-actions {
  display: flex;
  align-items: center;
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
  background: var(--bg-elevated);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.play-btn {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
}

.play-btn:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  color: var(--text-inverse);
}

.favorite-btn.is-favorite {
  color: var(--error);
  border-color: var(--error);
}

.favorite-btn.is-favorite:hover {
  background: rgba(239, 68, 68, 0.1);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .song-item {
    padding: 8px;
    gap: 8px;
  }

  .song-cover {
    display: none;
  }

  .song-play-count {
    display: none;
  }

  .song-actions {
    opacity: 1;
  }

  .action-btn {
    width: 28px;
    height: 28px;
  }

  .action-btn svg {
    width: 14px;
    height: 14px;
  }
}
</style>
