<template>
  <div class="album-cover" :class="[`album-cover-${size}`, { 'album-cover-playing': playing, 'album-cover-animating': animate }]">
    <!-- 专辑封面 -->
    <div class="cover-wrapper">
      <img 
        v-if="src" 
        :src="src" 
        :alt="alt || 'Album Cover'"
        class="cover-image"
        :class="{ 'cover-image-loading': loading }"
        @load="handleLoad"
        @error="handleError"
      />
      
      <!-- 加载状态 -->
      <div v-if="loading" class="cover-loading">
        <svg class="loading-spinner" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="60" stroke-dashoffset="10"/>
        </svg>
      </div>
      
      <!-- 错误状态 -->
      <div v-if="error" class="cover-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/>
        </svg>
      </div>
      
      <!-- 播放遮罩 -->
      <div v-if="showOverlay && playing" class="cover-overlay">
        <svg class="overlay-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
    </div>
    
    <!-- 专辑信息 -->
    <div v-if="showInfo" class="cover-info">
      <div class="info-title">{{ title }}</div>
      <div class="info-subtitle">{{ subtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  src?: string
  alt?: string
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  playing?: boolean
  showOverlay?: boolean
  showInfo?: boolean
  animate?: boolean
}

withDefaults(defineProps<Props>(), {
  src: '',
  alt: 'Album Cover',
  title: '',
  subtitle: '',
  size: 'md',
  playing: false,
  showOverlay: true,
  showInfo: false,
  animate: false,
})

const loading = ref(true)
const error = ref(false)

const handleLoad = () => {
  loading.value = false
  error.value = false
}

const handleError = () => {
  loading.value = false
  error.value = true
}
</script>

<style scoped>
.album-cover {
  display: inline-block;
  position: relative;
}

/* 尺寸 */
.album-cover-sm .cover-wrapper {
  width: 48px;
  height: 48px;
}

.album-cover-md .cover-wrapper {
  width: 120px;
  height: 120px;
}

.album-cover-lg .cover-wrapper {
  width: 200px;
  height: 200px;
}

.album-cover-xl .cover-wrapper {
  width: 300px;
  height: 300px;
}

/* 封面容器 */
.cover-wrapper {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-lg);
}

/* 封面图片 */
.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
}

.cover-image-loading {
  opacity: 0;
}

/* 加载状态 */
.cover-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  color: var(--text-tertiary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 错误状态 */
.cover-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.cover-error svg {
  width: 32px;
  height: 32px;
}

/* 播放遮罩 */
.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.album-cover-playing .cover-overlay {
  opacity: 1;
}

.overlay-icon {
  width: 48px;
  height: 48px;
  color: white;
}

/* 播放动画 */
.album-cover-playing .cover-image {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 旋转动画 (可选) */
.album-cover-animating .cover-wrapper {
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

/* 专辑信息 */
.cover-info {
  margin-top: 12px;
  text-align: center;
}

.info-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式 */
@media (max-width: 768px) {
  .album-cover-lg .cover-wrapper {
    width: 160px;
    height: 160px;
  }
  
  .album-cover-xl .cover-wrapper {
    width: 240px;
    height: 240px;
  }
}
</style>
