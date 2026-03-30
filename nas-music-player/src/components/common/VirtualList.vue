<template>
  <div ref="containerRef" class="virtual-list" :style="{ height: `${containerHeight}px` }">
    <div class="virtual-list-spacer" :style="{ height: `${totalHeight}px` }">
      <div
        class="virtual-list-items"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.key"
          class="virtual-list-item"
          :data-index="item.index"
        >
          <slot :item="item.data" :index="item.index"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props<T> {
  items: T[]
  itemHeight: number
  containerHeight?: number
  overscan?: number
}

const props = withDefaults(defineProps<Props<any>>(), {
  itemHeight: 60,
  containerHeight: 600,
  overscan: 5,
})

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)

// 计算总高度
const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

// 计算可见区域
const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
  return Math.min(
    props.items.length,
    Math.ceil(scrollTop.value / props.itemHeight) + visibleCount + props.overscan
  )
})

// 计算偏移量
const offsetY = computed(() => {
  return startIndex.value * props.itemHeight
})

// 可见项
const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
    key: (item as any).id || `${startIndex.value + index}`,
    index: startIndex.value + index,
    data: item,
  }))
})

// 处理滚动
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll)
  }
})

// 暴露方法用于滚动到指定位置
function scrollTo(index: number) {
  if (containerRef.value) {
    containerRef.value.scrollTop = index * props.itemHeight
  }
}

defineExpose({
  scrollTo,
})
</script>

<style scoped>
.virtual-list {
  overflow-y: auto;
  contain: strict;
  will-change: transform;
}

.virtual-list-spacer {
  position: relative;
  width: 100%;
}

.virtual-list-items {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-list-item {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>
