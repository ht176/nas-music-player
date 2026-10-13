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
  <div
    v-if="playerStore.showQueueDrawer"
    class="fixed inset-y-0 right-0 w-80 sm:w-96 bg-neutral-900/95 border-l border-neutral-800 backdrop-blur-xl shadow-2xl z-60 flex flex-col animate-fade-in"
  >
    <!-- 头部栏 -->
    <div class="p-4 border-b border-neutral-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Music class="w-5 h-5 text-emerald-400" />
        <h3 class="font-bold text-white text-base">当前播放队列</h3>
        <span class="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full font-mono">
          {{ playerStore.queue.length }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="playerStore.queue.length > 0"
          class="p-1.5 text-neutral-400 hover:text-rose-400 transition rounded-lg hover:bg-neutral-800 cursor-pointer"
          title="清空队列"
          @click="playerStore.clearQueue"
        >
          <Trash2 class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 text-neutral-400 hover:text-white transition rounded-lg hover:bg-neutral-800 cursor-pointer"
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
              ? 'bg-neutral-800 text-emerald-400'
              : 'text-neutral-300 hover:bg-neutral-800/50',
          ]"
          @click="playerStore.playTrack(track)"
        >
          <div class="flex items-center gap-2.5 overflow-hidden">
            <span class="w-4 text-center font-mono text-neutral-500">
              <template v-if="idx === playerStore.currentIndex && playerStore.isPlaying">▶</template>
              <template v-else>{{ idx + 1 }}</template>
            </span>
            <div class="truncate">
              <div class="font-medium truncate" :class="{ 'text-emerald-400': idx === playerStore.currentIndex }">
                {{ track.title }}
              </div>
              <div class="text-[11px] text-neutral-500 truncate">{{ track.artist }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="font-mono text-neutral-500">{{ formatTime(track.duration) }}</span>
            <button
              class="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-neutral-500 transition cursor-pointer"
              title="移除"
              @click.stop="playerStore.removeFromQueue(idx)"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </template>
      <div v-else class="h-full flex flex-col items-center justify-center text-neutral-500 text-sm">
        队列空空如也
      </div>
    </div>
  </div>
</template>
