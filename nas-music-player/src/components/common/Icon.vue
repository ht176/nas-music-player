<template>
  <svg 
    class="icon" 
    :class="[`icon-${name}`, `icon-${size}`, `icon-${color}`]"
    :style="{ width: size, height: size }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- 常用图标路径 -->
    <path v-if="name === 'play'" d="M8 5v14l11-7z"/>
    <path v-else-if="name === 'pause'" d="M6 4h4v16H6zm8 0h4v16h-4z"/>
    <path v-else-if="name === 'heart'" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    <path v-else-if="name === 'search'" d="M11 11a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 10l-4.35-4.35"/>
    <path v-else-if="name === 'home'" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <path v-else-if="name === 'settings'" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-15a1.65 1.65 0 0 0-1.82-.33H15a1.65 1.65 0 0 0-1-1.51V3a2 2 0 0 0-4 0v.09a1.65 1.65 0 0 0-1 1.51H5.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 0 0 2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1.51 1V9a1.65 1.65 0 0 0 1.51 1h.09a1.65 1.65 0 0 0 1.51-1V5.4a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 0 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 0 0-2.83l-.06-.06z"/>
    <path v-else-if="name === 'close'" d="M18 6L6 18M6 6l12 12"/>
    <path v-else-if="name === 'plus'" d="M12 5v14M5 12h14"/>
    <path v-else-if="name === 'more'" d="M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-14 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
    <path v-else-if="name === 'volume'" d="M11 5L6 9H2v6h4l5 4V5z"/>
    <path v-else-if="name === 'music'" d="M9 18V5l12-2v13M9 9l12-2M6 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm12 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
    <path v-else-if="name === 'shuffle'" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
    <path v-else-if="name === 'repeat'" d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>
    
    <!-- 自定义内容 -->
    <slot v-else></slot>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  name: string
  size?: string
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning'
}

withDefaults(defineProps<Props>(), {
  size: '24px',
  color: 'default',
})
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  transition: all 0.2s;
}

/* 颜色 */
.icon-default {
  color: currentColor;
}

.icon-primary {
  color: var(--primary);
}

.icon-secondary {
  color: var(--text-secondary);
}

.icon-success {
  color: var(--success);
}

.icon-error {
  color: var(--error);
}

.icon-warning {
  color: var(--warning);
}

/* 尺寸 */
.icon-xs {
  width: 12px;
  height: 12px;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.icon-md {
  width: 20px;
  height: 20px;
}

.icon-lg {
  width: 24px;
  height: 24px;
}

.icon-xl {
  width: 32px;
  height: 32px;
}

.icon-2xl {
  width: 48px;
  height: 48px;
}
</style>
