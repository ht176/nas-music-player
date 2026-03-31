<template>
  <div class="lyrics-view" :class="{ 'lyrics-view-scrolling': isScrolling }">
    <!-- 空状态 -->
    <div v-if="!lyrics || lyrics.length === 0" class="lyrics-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
      <div class="empty-text">暂无歌词</div>
    </div>

    <!-- 歌词列表 -->
    <div 
      v-else 
      class="lyrics-content"
      ref="contentRef"
      @scroll="handleScroll"
    >
      <div 
        v-for="(line, index) in lyrics" 
        :key="index"
        class="lyrics-line"
        :class="{ 
          'lyrics-line-active': currentIndex === index,
          'lyrics-line-past': currentIndex > index,
        }"
        :style="{ transform: `translateY(${getLineOffset(index)}px)` }"
        @click="handleLineClick(index)"
      >
        <div class="lyrics-text">{{ line.text }}</div>
        <div v-if="line.translation" class="lyrics-translation">{{ line.translation }}</div>
      </div>
    </div>

    <!-- 滚动提示 -->
    <div v-if="showScrollHint && !isAutoScrolling" class="scroll-hint">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface LyricsLine {
  time: number
  text: string
  translation?: string
}

interface Props {
  lyrics?: LyricsLine[]
  currentTime?: number
  showScrollHint?: boolean
  autoScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  lyrics: () => [],
  currentTime: 0,
  showScrollHint: true,
  autoScroll: true,
})

const emit = defineEmits<{
  seek: [time: number]
}>()

const contentRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const isScrolling = ref(false)
const isAutoScrolling = ref(true)

// 计算当前应该高亮的歌词行
watch(() => props.currentTime, (time) => {
  if (!props.lyrics) return
  
  for (let i = props.lyrics.length - 1; i >= 0; i--) {
    if (time >= props.lyrics[i].time) {
      if (currentIndex.value !== i) {
        currentIndex.value = i
        if (props.autoScroll && isAutoScrolling.value) {
          scrollToLine(i)
        }
      }
      break
    }
  }
})

// 滚动到指定行
const scrollToLine = (index: number) => {
  if (!contentRef.value) return
  
  const container = contentRef.value
  const lineHeight = 80 // 每行高度约 80px
  const containerHeight = container.clientHeight
  const targetPosition = index * lineHeight - containerHeight / 2 + lineHeight / 2
  
  container.scrollTo({
    top: Math.max(0, targetPosition),
    behavior: 'smooth',
  })
}

// 计算行偏移 (用于 3D 效果)
const getLineOffset = (_index: number): number => {
  return 0 // 简化版本，可以添加视差效果
}

// 处理滚动
const handleScroll = () => {
  isScrolling.value = true
  isAutoScrolling.value = false
  
  clearTimeout((handleScroll as any).timeout)
  ;(handleScroll as any).timeout = setTimeout(() => {
    isScrolling.value = false
    isAutoScrolling.value = true
  }, 1000)
}

// 点击歌词行跳转
const handleLineClick = (index: number) => {
  if (!props.lyrics) return
  emit('seek', props.lyrics[index].time)
}
</script>

<style scoped>
.lyrics-view {
  position: relative;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 空状态 */
.lyrics-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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

/* 歌词内容 */
.lyrics-content {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 20% 24px;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
}

.lyrics-content::-webkit-scrollbar {
  width: 6px;
}

.lyrics-content::-webkit-scrollbar-track {
  background: transparent;
}

.lyrics-content::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}

/* 歌词行 */
.lyrics-line {
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
  opacity: 0.5;
  transform-origin: center;
}

.lyrics-line:hover {
  opacity: 0.8;
}

.lyrics-line-active {
  opacity: 1;
  transform: scale(1.05);
}

.lyrics-line-active .lyrics-text {
  color: var(--primary);
  font-weight: 600;
}

.lyrics-line-past {
  opacity: 0.3;
}

/* 歌词文字 */
.lyrics-text {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-primary);
  transition: all 0.3s;
}

/* 歌词翻译 */
.lyrics-translation {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* 滚动提示 */
.scroll-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  opacity: 0;
  animation: bounce 2s infinite;
  pointer-events: none;
}

.lyrics-view:not(.lyrics-view-scrolling) .scroll-hint {
  opacity: 1;
}

@keyframes bounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-8px);
  }
}

.scroll-hint svg {
  width: 20px;
  height: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .lyrics-content {
    padding: 15% 16px;
  }

  .lyrics-text {
    font-size: 16px;
  }

  .lyrics-translation {
    font-size: 13px;
  }

  .lyrics-line {
    min-height: 70px;
  }
}
</style>
