<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import gsap from 'gsap'

export interface LyricLine {
  text: string
  time?: number
}

const props = withDefaults(
  defineProps<{
    lyrics?: LyricLine[]
    activeIndex?: number
    displayLines?: number // 1 or 2
    fallbackText?: string
    size?: 'sm' | 'md' // 'sm' for mini player, 'md' for PlayerBar
  }>(),
  {
    lyrics: () => [],
    activeIndex: -1,
    displayLines: 1,
    fallbackText: '享受纯粹私有音乐',
    size: 'md',
  }
)

const containerRef = ref<HTMLElement | null>(null)
const line1Ref = ref<HTMLElement | null>(null)
const line2Ref = ref<HTMLElement | null>(null)
const line3Ref = ref<HTMLElement | null>(null)

// 文本数据槽位
const line1Text = ref('')
const line2Text = ref('')
const line3Text = ref('')

let activeTween: gsap.core.Timeline | null = null
let prevIndex = -1

// 尺寸规范
const line1H = computed(() => (props.size === 'sm' ? 18 : 24))
const line2H = computed(() => (props.size === 'sm' ? 15 : 20))

const viewportHeight = computed(() => {
  if (props.displayLines === 2) {
    return line1H.value + line2H.value
  }
  return line1H.value
})

function getLyricAt(idx: number): string {
  if (!props.lyrics || props.lyrics.length === 0 || idx < 0 || idx >= props.lyrics.length) {
    return ''
  }
  return props.lyrics[idx]?.text || ''
}

// 重置并立即定位到指定下标（无滚动位移动画）
function snapToIndex(idx: number) {
  if (activeTween) {
    activeTween.kill()
    activeTween = null
  }

  prevIndex = idx

  if (!props.lyrics || props.lyrics.length === 0 || idx < 0) {
    line1Text.value = props.fallbackText
    line2Text.value = ''
    line3Text.value = ''
  } else {
    line1Text.value = getLyricAt(idx) || props.fallbackText
    line2Text.value = props.displayLines === 2 ? getLyricAt(idx + 1) : ''
    line3Text.value = ''
  }

  const h1 = line1H.value
  const h2 = line2H.value

  // 立即将 DOM 属性归位 (纯 transform + opacity，最高性能)
  if (line1Ref.value) {
    gsap.set(line1Ref.value, {
      y: 0,
      opacity: 1,
    })
  }

  if (line2Ref.value) {
    gsap.set(line2Ref.value, {
      y: h1,
      opacity: props.displayLines === 2 ? 0.6 : 0,
    })
  }

  if (line3Ref.value) {
    gsap.set(line3Ref.value, {
      y: h1 + h2,
      opacity: 0,
    })
  }

  if (containerRef.value) {
    gsap.fromTo(containerRef.value, { opacity: 0.35 }, { opacity: 1, duration: 0.22, ease: 'power1.out' })
  }
}

// 执行自然的平滑向上滚动过渡
function rollToNextIndex(newIdx: number) {
  if (activeTween) {
    activeTween.kill()
    activeTween = null
  }

  prevIndex = newIdx

  const h1 = line1H.value
  const h2 = line2H.value

  if (props.displayLines === 1) {
    // ==================== 单行滚动模式 ====================
    // line1 (当前句): 原位向上滚出并柔和淡出
    // line2 (新入句): 从正下方平滑滚入居中并淡入
    line2Text.value = getLyricAt(newIdx)

    if (!line1Ref.value || !line2Ref.value) return

    gsap.set(line1Ref.value, { y: 0, opacity: 1 })
    gsap.set(line2Ref.value, { y: h1, opacity: 0 })

    const tl = gsap.timeline({
      onComplete: () => {
        line1Text.value = line2Text.value
        line2Text.value = ''
        nextTick(() => {
          if (!line1Ref.value || !line2Ref.value) return
          gsap.set(line1Ref.value, { y: 0, opacity: 1 })
          gsap.set(line2Ref.value, { y: h1, opacity: 0 })
          activeTween = null
        })
      },
    })

    // 向上滑动并渐隐/显 (0.48s 舒展优雅的减速滑行)
    tl.to(
      line1Ref.value,
      {
        y: -h1,
        opacity: 0,
        duration: 0.48,
        ease: 'power2.out',
      },
      0
    )

    tl.to(
      line2Ref.value,
      {
        y: 0,
        opacity: 1,
        duration: 0.48,
        ease: 'power2.out',
      },
      0
    )

    activeTween = tl
  } else {
    // ==================== 双行滚动模式 ====================
    // line1 (当前句): 向上滚出淡出
    // line2 (预告句): 向上滑入当前行位置，由 0.6 变亮至 1.0
    // line3 (新预告句): 从下方滑入第二行预告位置，显现至 0.6
    const incomingPreview = getLyricAt(newIdx + 1)
    line3Text.value = incomingPreview

    if (!line1Ref.value || !line2Ref.value || !line3Ref.value) return

    gsap.set(line1Ref.value, { y: 0, opacity: 1 })
    gsap.set(line2Ref.value, { y: h1, opacity: 0.6 })
    gsap.set(line3Ref.value, { y: h1 + h2, opacity: 0 })

    const tl = gsap.timeline({
      onComplete: () => {
        line1Text.value = line2Text.value
        line2Text.value = line3Text.value
        line3Text.value = ''
        nextTick(() => {
          if (!line1Ref.value || !line2Ref.value || !line3Ref.value) return
          gsap.set(line1Ref.value, { y: 0, opacity: 1 })
          gsap.set(line2Ref.value, { y: h1, opacity: 0.6 })
          gsap.set(line3Ref.value, { y: h1 + h2, opacity: 0 })
          activeTween = null
        })
      },
    })

    // line1: 向上滑出并柔和淡出
    tl.to(
      line1Ref.value,
      {
        y: -h1,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      },
      0
    )

    // line2: 向上滑到第一行位置，平滑提亮至 1.0 全不透明
    tl.to(
      line2Ref.value,
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
      },
      0
    )

    // line3: 向上滑入第二行预告位置
    tl.to(
      line3Ref.value,
      {
        y: h1,
        opacity: incomingPreview ? 0.6 : 0,
        duration: 0.5,
        ease: 'power2.out',
      },
      0
    )

    activeTween = tl
  }
}

// 监听当前歌词下标
watch(
  () => props.activeIndex,
  (newIdx) => {
    nextTick(() => {
      // 连续顺次播放（刚好下一句）：触发平滑滚动
      if (newIdx >= 0 && newIdx === prevIndex + 1 && props.lyrics.length > 0) {
        rollToNextIndex(newIdx)
      } else {
        // 跳转、切歌、快进后退：瞬间对齐
        snapToIndex(newIdx)
      }
    })
  }
)

// 监听歌词数组或单双行配置改变
watch(
  [() => props.lyrics, () => props.displayLines],
  () => {
    nextTick(() => {
      snapToIndex(props.activeIndex)
    })
  },
  { deep: false }
)

onMounted(() => {
  snapToIndex(props.activeIndex)
})

onUnmounted(() => {
  if (activeTween) {
    activeTween.kill()
    activeTween = null
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="lyric-ticker-viewport relative overflow-hidden select-none w-full"
    :style="{
      height: `${viewportHeight}px`,
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 3px, black calc(100% - 3px), transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3px, black calc(100% - 3px), transparent 100%)',
    }"
  >
    <!-- Slot 1 (当前句) -->
    <div
      ref="line1Ref"
      class="absolute left-0 right-0 truncate whitespace-nowrap will-change-transform"
      :class="[
        size === 'sm' ? 'text-[11px] leading-[18px] font-semibold' : 'text-sm sm:text-base leading-[24px] font-bold',
      ]"
      :style="{
        color: 'var(--theme-accent)',
      }"
    >
      {{ line1Text || fallbackText }}
    </div>

    <!-- Slot 2 (预告句 / 滚动换行过渡句) -->
    <div
      ref="line2Ref"
      class="absolute left-0 right-0 truncate whitespace-nowrap will-change-transform"
      :class="[
        size === 'sm' ? 'text-[10px] leading-[15px] font-medium' : 'text-xs sm:text-sm leading-[20px] font-medium',
      ]"
      :style="{
        color: 'var(--theme-accent)',
        opacity: displayLines === 2 ? 0.6 : 0,
      }"
    >
      {{ line2Text }}
    </div>

    <!-- Slot 3 (双行滚动时的第二句滑入缓冲句) -->
    <div
      v-if="displayLines === 2"
      ref="line3Ref"
      class="absolute left-0 right-0 truncate whitespace-nowrap will-change-transform opacity-0"
      :class="[
        size === 'sm' ? 'text-[10px] leading-[15px] font-medium' : 'text-xs sm:text-sm leading-[20px] font-medium',
      ]"
      :style="{
        color: 'var(--theme-accent)',
      }"
    >
      {{ line3Text }}
    </div>
  </div>
</template>

<style scoped>
.lyric-ticker-viewport {
  contain: layout paint;
}
</style>
