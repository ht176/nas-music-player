<script setup lang="ts">
import { usePlayerStore } from '../stores/player'
import { X, Trash2, Music } from 'lucide-vue-next'

const playerStore = usePlayerStore()

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="playerStore.showQueueDrawer"
      class="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in"
      @click="playerStore.showQueueDrawer = false"
    >
      <div
        class="w-5/6 sm:w-96 max-w-sm h-full bg-[var(--theme-surface-solid)] border-l border-[var(--theme-border)] backdrop-blur-2xl shadow-2xl flex flex-col select-none"
        :style="{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }"
        @click.stop
      >
        <!-- 头部栏 -->
        <div class="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Music class="w-5 h-5 text-[var(--theme-accent)]" />
            <h3 class="font-bold text-[var(--theme-text-primary)] text-base">当前播放队列</h3>
            <span class="text-xs text-[var(--theme-text-secondary)] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full font-mono">
              {{ playerStore.queue.length }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <button
              v-if="playerStore.queue.length > 0"
              class="p-1.5 text-[var(--theme-text-secondary)] hover:text-rose-500 transition rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer active:scale-90"
              title="清空队列"
              @click="playerStore.clearQueue"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer active:scale-90"
              @click="playerStore.showQueueDrawer = false"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

    <!-- 队列内容列表 -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <template v-if="playerStore.queue.length > 0">
        <div
          v-for="(track, idx) in playerStore.queue"
          :key="track.id + idx"
          class="group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition text-xs"
          :class="[
            idx === playerStore.currentIndex
              ? 'bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] font-semibold shadow-sm'
              : 'text-[var(--theme-text-primary)] hover:bg-black/5 dark:hover:bg-white/5',
          ]"
          @click="playerStore.playTrack(track)"
        >
          <div class="flex items-center gap-2.5 overflow-hidden">
            <span class="w-4 text-center font-mono text-[var(--theme-text-muted)]">
              <template v-if="idx === playerStore.currentIndex && playerStore.isPlaying">▶</template>
              <template v-else>{{ idx + 1 }}</template>
            </span>
            <div class="truncate">
              <div class="font-medium truncate" :class="{ 'text-[var(--theme-accent)] font-semibold': idx === playerStore.currentIndex }">
                {{ track.title }}
              </div>
              <div class="text-[11px] text-[var(--theme-text-secondary)] truncate">{{ track.artist }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="font-mono text-[var(--theme-text-secondary)]">{{ formatTime(track.duration) }}</span>
            <button
              class="opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:text-rose-500 text-[var(--theme-text-secondary)] hover:bg-black/10 dark:hover:bg-white/10 rounded transition cursor-pointer"
              title="移出队列"
              @click.stop="playerStore.removeFromQueue(idx)"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </template>
      <div v-else class="h-full flex flex-col items-center justify-center text-[var(--theme-text-muted)] text-sm">
        队列空空如也
      </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>
