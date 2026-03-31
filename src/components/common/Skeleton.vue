<template>
  <div class="skeleton" :class="[`skeleton--${type}`, { 'skeleton--animated': animated }]">
    <template v-if="type === 'text'">
      <div class="skeleton-text" :style="{ width: width || '100%', height: height || '1em' }"></div>
    </template>
    
    <template v-else-if="type === 'circle'">
      <div class="skeleton-circle" :style="{ width: size, height: size }"></div>
    </template>
    
    <template v-else-if="type === 'rect'">
      <div class="skeleton-rect" :style="{ width: width, height: height }"></div>
    </template>
    
    <template v-else-if="type === 'song-item'">
      <div class="skeleton-song-item">
        <div class="skeleton-song-index skeleton-circle" style="width: 24px; height: 24px;"></div>
        <div class="skeleton-song-cover skeleton-rect" style="width: 48px; height: 48px;"></div>
        <div class="skeleton-song-info">
          <div class="skeleton-song-title skeleton-text" style="width: 200px; height: 16px;"></div>
          <div class="skeleton-song-artist skeleton-text" style="width: 150px; height: 14px;"></div>
        </div>
        <div class="skeleton-song-duration skeleton-text" style="width: 40px; height: 14px;"></div>
      </div>
    </template>
    
    <template v-else-if="type === 'album-card'">
      <div class="skeleton-album-card">
        <div class="skeleton-album-cover skeleton-rect" style="width: 100%; height: 180px;"></div>
        <div class="skeleton-album-title skeleton-text" style="width: 90%; height: 16px;"></div>
        <div class="skeleton-album-artist skeleton-text" style="width: 70%; height: 14px;"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'text' | 'circle' | 'rect' | 'song-item' | 'album-card'
  width?: string
  height?: string
  size?: string
  animated?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  animated: true,
})
</script>

<style scoped>
.skeleton {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.skeleton--animated {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-elevated) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 文本骨架 */
.skeleton-text {
  display: inline-block;
  vertical-align: middle;
}

/* 圆形骨架 */
.skeleton-circle {
  border-radius: 50%;
  display: inline-block;
  vertical-align: middle;
}

/* 矩形骨架 */
.skeleton-rect {
  display: block;
}

/* 歌曲项骨架 */
.skeleton-song-item {
  display: grid;
  grid-template-columns: 24px 48px 1fr 40px;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
}

.skeleton-song-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-song-title {
  margin-bottom: 4px;
}

/* 专辑卡片骨架 */
.skeleton-album-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.skeleton-album-cover {
  border-radius: 8px;
  margin-bottom: 12px;
}

.skeleton-album-title {
  margin-bottom: 4px;
}

.skeleton-album-artist {
  opacity: 0.7;
}
</style>
