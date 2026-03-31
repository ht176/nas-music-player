<template>
  <div class="lyrics-page">
    <!-- 顶部信息 -->
    <div class="lyrics-header" :style="{ backgroundImage: `url(${coverUrl})` }">
      <div class="lyrics-header-overlay"></div>
      <div class="lyrics-header-content">
        <img v-if="coverUrl" :src="coverUrl" :alt="currentSong?.album" class="album-cover" />
        <div v-else class="album-cover-placeholder">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        
        <div class="song-info">
          <h1 class="song-title">{{ currentSong?.title || '未播放' }}</h1>
          <p class="artist-name">{{ currentSong?.artist || '' }}</p>
          <p v-if="currentSong?.album" class="album-name">{{ currentSong.album }}</p>
        </div>
      </div>
    </div>
    
    <!-- 歌词内容 -->
    <div class="lyrics-container">
      <LyricsView
        v-if="lyrics.length > 0"
        :lyrics="lyrics"
        :current-time="player.currentTime"
        :auto-scroll="true"
        @seek="handleSeek"
      />
      
      <!-- 无歌词 -->
      <div v-else class="no-lyrics">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="no-lyrics-icon">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
        </svg>
        <p class="no-lyrics-text">暂无歌词</p>
        <p class="no-lyrics-hint">正在播放纯音乐</p>
      </div>
    </div>
    
    <!-- 底部控制 -->
    <div class="lyrics-controls">
      <Button @click="handleBack" variant="ghost" size="md">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 mr-2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        返回
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { getLyrics, getCoverArtUrl } from '@/api/navidrome'
import { parseLRC } from '@/utils/lyrics-parser'
import LyricsView from '@/components/music/LyricsView.vue'
import Button from '@/components/common/Button.vue'
import type { ParsedLyricsLine } from '@/utils/lyrics-parser'

const router = useRouter()
const route = useRoute()
const player = usePlayerStore()

const lyrics = ref<ParsedLyricsLine[]>([])
const coverUrl = ref<string>('')

const currentSong = computed(() => player.currentSong)

// 加载歌词
async function loadLyrics() {
  if (!player.currentSong) {
    lyrics.value = []
    return
  }

  try {
    // 获取专辑封面
    if (player.currentSong.coverArt) {
      coverUrl.value = getCoverArtUrl(player.currentSong.coverArt)
    }

    // 获取歌词
    const lrcText = await getLyrics(player.currentSong.id)
    
    if (lrcText) {
      lyrics.value = parseLRC(lrcText)
    } else {
      lyrics.value = []
    }
  } catch (error) {
    console.error('Failed to load lyrics:', error)
    lyrics.value = []
  }
}

// 监听歌曲切换
watch(() => player.currentSong, () => {
  loadLyrics()
})

// 跳转到指定时间
function handleSeek(time: number) {
  player.seek(time)
}

// 返回
function handleBack() {
  router.back()
}

onMounted(() => {
  loadLyrics()
})
</script>

<style scoped>
.lyrics-page {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.lyrics-header {
  position: relative;
  height: 40%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.lyrics-header-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.6) 100%
  );
}

.lyrics-header-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.album-cover {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  margin-bottom: 24px;
}

.album-cover-placeholder {
  width: 200px;
  height: 200px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.album-cover-placeholder svg {
  width: 80px;
  height: 80px;
  color: var(--text-tertiary);
}

.song-info {
  text-align: center;
  color: white;
}

.song-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.artist-name {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 4px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.album-name {
  font-size: 14px;
  opacity: 0.7;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* 歌词容器 */
.lyrics-container {
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
}

/* 无歌词 */
.no-lyrics {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
}

.no-lyrics-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-lyrics-text {
  font-size: 18px;
  margin-bottom: 8px;
}

.no-lyrics-hint {
  font-size: 14px;
  opacity: 0.7;
}

/* 底部控制 */
.lyrics-controls {
  position: absolute;
  bottom: 24px;
  right: 24px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .lyrics-header {
    height: 35%;
  }

  .album-cover,
  .album-cover-placeholder {
    width: 160px;
    height: 160px;
  }

  .song-title {
    font-size: 22px;
  }

  .artist-name {
    font-size: 14px;
  }

  .lyrics-controls {
    bottom: 16px;
    right: 16px;
  }
}
</style>
