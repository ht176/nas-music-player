<template>
  <div class="slider" :class="`slider-${size}`">
    <!-- 轨道 -->
    <div 
      class="slider-track" 
      ref="trackRef"
      @click="handleTrackClick"
    >
      <!-- 填充条 -->
      <div class="slider-fill" :style="{ width: `${percentage}%` }"></div>
      
      <!-- 拖拽手柄 -->
      <div 
        class="slider-handle" 
        :style="{ left: `${percentage}%` }"
        @mousedown="handleDragStart"
        @touchstart="handleDragStart"
      >
        <slot v-if="$slots.handle" name="handle"></slot>
      </div>
    </div>
    
    <!-- 最小值标签 -->
    <div v-if="showLabels" class="slider-label slider-label-min">
      {{ min }}
    </div>
    
    <!-- 最大值标签 -->
    <div v-if="showLabels" class="slider-label slider-label-max">
      {{ max }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  size: 'md',
  showLabels: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()

const trackRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// 计算百分比 (限制在 0-100 之间)
const percentage = computed(() => {
  const rawPercentage = ((props.modelValue - props.min) / (props.max - props.min)) * 100
  return Math.min(Math.max(rawPercentage, 0), 100)
})

// 处理轨道点击
const handleTrackClick = (event: MouseEvent) => {
  if (props.disabled || !trackRef.value) return
  
  const rect = trackRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const width = rect.width
  const percentage = x / width
  const value = props.min + percentage * (props.max - props.min)
  const steppedValue = Math.round(value / props.step) * props.step
  const clampedValue = Math.min(Math.max(steppedValue, props.min), props.max)
  
  emit('update:modelValue', clampedValue)
  emit('change', clampedValue)
}

// 处理拖拽开始
const handleDragStart = (_event: MouseEvent | TouchEvent) => {
  if (props.disabled) return
  
  isDragging.value = true
  
  const moveHandler = (e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    
    if (trackRef.value) {
      const rect = trackRef.value.getBoundingClientRect()
      const x = clientX - rect.left
      const width = rect.width
      const percentage = Math.max(0, Math.min(1, x / width))
      const value = props.min + percentage * (props.max - props.min)
      const steppedValue = Math.round(value / props.step) * props.step
      const clampedValue = Math.min(Math.max(steppedValue, props.min), props.max)
      
      emit('update:modelValue', clampedValue)
    }
  }
  
  const upHandler = () => {
    isDragging.value = false
    emit('change', props.modelValue)
    document.removeEventListener('mousemove', moveHandler)
    document.removeEventListener('mouseup', upHandler)
    document.removeEventListener('touchmove', moveHandler)
    document.removeEventListener('touchend', upHandler)
  }
  
  document.addEventListener('mousemove', moveHandler)
  document.addEventListener('mouseup', upHandler)
  document.addEventListener('touchmove', moveHandler)
  document.addEventListener('touchend', upHandler)
}
</script>

<style scoped>
.slider {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 4px;
  background: var(--border-strong);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.slider-track:hover {
  height: 6px;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.1s;
}

.slider-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: var(--text-primary);
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  opacity: 0;
}

.slider-track:hover .slider-handle {
  opacity: 1;
}

.slider-handle:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.2);
}

/* 尺寸 */
.slider-sm .slider-track {
  height: 3px;
}

.slider-sm .slider-handle {
  width: 12px;
  height: 12px;
}

.slider-md .slider-track {
  height: 4px;
}

.slider-md .slider-handle {
  width: 16px;
  height: 16px;
}

.slider-lg .slider-track {
  height: 6px;
}

.slider-lg .slider-handle {
  width: 20px;
  height: 20px;
}

/* 标签 */
.slider-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: 'SF Mono', monospace;
  min-width: 35px;
}

.slider-label-min {
  text-align: right;
}

.slider-label-max {
  text-align: left;
}

/* 禁用状态 */
.slider:has(.slider-track[disabled]) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
