<template>
  <div class="input-wrapper" :class="`input-wrapper-${size}`">
    <!-- 前置图标/文字 -->
    <div v-if="$slots.prefix" class="input-prefix">
      <slot name="prefix"></slot>
    </div>
    
    <!-- 输入框 -->
    <input
      class="input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :class="{
        'input-error': error,
        'input-focus': isFocused,
      }"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    
    <!-- 后置图标/按钮 -->
    <div v-if="$slots.suffix || clearable" class="input-suffix">
      <slot name="suffix">
        <!-- 清空按钮 -->
        <button
          v-if="clearable && modelValue && !disabled"
          class="input-clear-btn"
          type="button"
          @click="handleClear"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </slot>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="input-error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  maxlength?: number
  size?: 'sm' | 'md' | 'lg'
  error?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  size: 'md',
  error: '',
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
}>()

const isFocused = ref(false)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:hover:not(:disabled):not(.input-error) {
  border-color: var(--border-default);
}

.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-error {
  border-color: var(--error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 尺寸 */
.input-wrapper-sm .input {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.input-wrapper-md .input {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
}

.input-wrapper-lg .input {
  height: 48px;
  padding: 0 20px;
  font-size: 16px;
}

/* 前置/后置内容 */
.input-wrapper {
  position: relative;
}

.input-prefix,
.input-suffix {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: var(--text-tertiary);
  pointer-events: none;
}

.input-prefix {
  left: 12px;
}

.input-suffix {
  right: 12px;
  pointer-events: auto;
}

/* 有前置内容时的输入框 */
.input-wrapper:has(.input-prefix) .input {
  padding-left: 40px;
}

/* 有后置内容时的输入框 */
.input-wrapper:has(.input-suffix) .input {
  padding-right: 40px;
}

/* 清空按钮 */
.input-clear-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.input-clear-btn:hover {
  background: var(--border-strong);
  color: var(--text-primary);
}

.input-clear-btn svg {
  width: 12px;
  height: 12px;
}

/* 错误提示 */
.input-error-message {
  font-size: 12px;
  color: var(--error);
  margin-top: 4px;
}
</style>
