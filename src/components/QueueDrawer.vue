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
        class="w-5/6 sm:w-96 max-w-sm h-full bg-[#13141d]/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col select-none"
        :style="{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }"
        @click.stop
      >
        <!-- 头部栏 -->
        <div class="p-4 border-b border-white/10 flex items-center justify-between">
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
              class="p-1.5 text-neutral-400 hover:text-rose-400 transition rounded-lg hover:bg-neutral-800 cursor-pointer active:scale-90"
              title="清空队列"
              @click="playerStore.clearQueue"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 text-neutral-400 hover:text-white transition rounded-lg hover:bg-neutral-800 cursor-pointer active:scale-90"
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
              class="opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:text-rose-400 text-neutral-400 hover:bg-white/10 rounded transition cursor-pointer"
              title="移出队列"
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
  </div>
  </Teleport>
</template>
