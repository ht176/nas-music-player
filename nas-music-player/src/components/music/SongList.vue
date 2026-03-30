<template>
  <div class="song-list">
    <!-- 列表头 -->
    <div v-if="showHeader" class="song-list-header">
      <div class="header-index">#</div>
      <div class="header-title">标题</div>
      <div v-if="showAlbum" class="header-album">专辑</div>
      <div v-if="showPlayCount" class="header-play-count">
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
      <div class="header-duration">
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <div class="header-actions">
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div class="song-list-body">
      <SongItem
        v-for="(song, index) in songs"
        :key="song.id"
        :song="song"
        :index="index + 1"
        :playing="currentPlayingId === song.id"
        :show-cover="showCover"
        :show-play-count="showPlayCount"
        @click="handleClick(song)"
        @dblclick="handlePlay(song)"
        @favorite="handleFavorite(song)"
        @more="handleMore(song)"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="songs.length === 0" class="song-list-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18V5l12-2v13M9 9l12-2M6 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm12 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
      <div class="empty-text">暂无歌曲</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SongItem from './SongItem.vue'

interface Song {
  id: string
  name: string
  artist?: string
  album?: string
  cover?: string
  duration: number
  playCount?: number
  isFavorite?: boolean
}

interface Props {
  songs: Song[]
  currentPlayingId?: string
  showHeader?: boolean
  showAlbum?: boolean
  showCover?: boolean
  showPlayCount?: boolean
}

withDefaults(defineProps<Props>(), {
  songs: () => [],
  currentPlayingId: '',
  showHeader: true,
  showAlbum: true,
  showCover: false,
  showPlayCount: false,
})

const emit = defineEmits<{
  click: [song: Song]
  play: [song: Song]
  favorite: [song: Song]
  more: [song: Song]
}>()

const handleClick = (song: Song) => {
  emit('click', song)
}

const handlePlay = (song: Song) => {
  emit('play', song)
}

const handleFavorite = (song: Song) => {
  emit('favorite', song)
}

const handleMore = (song: Song) => {
  emit('more', song)
}
</script>

<style scoped>
.song-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 列表头 */
.song-list-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-subtle);
}

.header-index {
  width: 24px;
  text-align: center;
}

.header-title {
  flex: 1;
}

.header-album {
  flex: 1;
  min-width: 150px;
}

.header-play-count,
.header-duration,
.header-actions {
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.header-duration {
  width: 45px;
}

.header-actions {
  width: 32px;
}

.header-icon {
  width: 16px;
  height: 16px;
}

/* 列表体 */
.song-list-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 空状态 */
.song-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: var(--text-tertiary);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
}

/* 滚动条 */
.song-list-body:has(.song-item:hover)::-webkit-scrollbar {
  width: 8px;
}

.song-list-body::-webkit-scrollbar-track {
  background: transparent;
}

.song-list-body::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 4px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .song-list-header {
    display: none;
  }

  .header-album,
  .header-play-count {
    display: none;
  }
}
</style>
