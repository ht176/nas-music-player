import { ref } from 'vue'

export interface ToastItem {
  id: string
  message: string
  type?: 'success' | 'info' | 'warning' | 'error'
  duration?: number
}

const toasts = ref<ToastItem[]>([])

export const toastService = {
  toasts,

  show(message: string, type: ToastItem['type'] = 'success', duration = 2200) {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5)
    toasts.value.push({ id, message, type, duration })

    setTimeout(() => {
      this.remove(id)
    }, duration)
  },

  success(message: string, duration = 2200) {
    this.show(message, 'success', duration)
  },

  info(message: string, duration = 2200) {
    this.show(message, 'info', duration)
  },

  warning(message: string, duration = 2500) {
    this.show(message, 'warning', duration)
  },

  error(message: string, duration = 3000) {
    this.show(message, 'error', duration)
  },

  remove(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx >= 0) {
      toasts.value.splice(idx, 1)
    }
  },
}
