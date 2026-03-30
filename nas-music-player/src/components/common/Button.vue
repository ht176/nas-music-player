<template>
  <button 
    class="btn" 
    :class="[
      `btn-${variant}`,
      `btn-${size}`,
      {
        'btn-loading': loading,
        'btn-disabled': disabled,
        'btn-icon': iconOnly,
      }
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <!-- 加载图标 -->
    <svg v-if="loading" class="btn-loading-icon" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="60" stroke-dashoffset="10"/>
    </svg>
    
    <!-- 图标 -->
    <slot v-else-if="iconOnly" name="icon"></slot>
    
    <!-- 文字 -->
    <span v-if="!iconOnly" class="btn-text">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  iconOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  iconOnly: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  position: relative;
}

.btn:focus-visible {
  box-shadow: 0 0 0 3px var(--primary-soft);
}

/* 变体 */
.btn-primary {
  background: var(--primary);
  color: var(--text-inverse);
}

.btn-primary:hover:not(.btn-disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-primary:active:not(.btn-disabled) {
  transform: translateY(0);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.btn-secondary:hover:not(.btn-disabled) {
  background: var(--bg-elevated);
  border-color: var(--border-strong);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover:not(.btn-disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-danger {
  background: var(--error);
  color: white;
}

.btn-danger:hover:not(.btn-disabled) {
  background: #dc2626;
}

/* 尺寸 */
.btn-sm {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.btn-md {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
}

.btn-lg {
  height: 48px;
  padding: 0 24px;
  font-size: 16px;
}

/* 图标按钮 */
.btn-icon {
  padding: 0;
  border-radius: 50%;
}

.btn-icon.btn-sm {
  width: 32px;
  height: 32px;
}

.btn-icon.btn-md {
  width: 40px;
  height: 40px;
}

.btn-icon.btn-lg {
  width: 48px;
  height: 48px;
}

/* 加载状态 */
.btn-loading {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-loading-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 禁用状态 */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-text {
  line-height: 1;
}
</style>
