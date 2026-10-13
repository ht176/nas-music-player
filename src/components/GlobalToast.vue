<script setup lang="ts">
import { toastService } from '../services/toast'
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-vue-next'

const toasts = toastService.toasts
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none select-none max-w-[90vw]">
      <TransitionGroup name="toast-fade">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.65)] border backdrop-blur-xl text-xs sm:text-sm font-semibold pointer-events-auto transition-all duration-300"
          :class="[
            t.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-300'
              : t.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-300'
                : t.type === 'info'
                  ? 'bg-neutral-900/90 border-neutral-700/60 text-neutral-200'
                  : 'bg-neutral-900/95 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
          ]"
        >
          <AlertCircle v-if="t.type === 'error'" class="w-4 h-4 shrink-0 text-rose-400" />
          <AlertTriangle v-else-if="t.type === 'warning'" class="w-4 h-4 shrink-0 text-amber-400" />
          <Info v-else-if="t.type === 'info'" class="w-4 h-4 shrink-0 text-sky-400" />
          <CheckCircle2 v-else class="w-4 h-4 shrink-0 text-emerald-400" />
          <span class="truncate max-w-sm">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-fade-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.92);
}
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
