<script setup lang="ts">
import { computed } from 'vue'
import { useServerStore } from '../stores/server'
import type { Album } from '../api/types'
import { Disc3, Play } from 'lucide-vue-next'

const props = defineProps<{
  album: Album
}>()

const emit = defineEmits<{
  (e: 'click', album: Album): void
}>()

const serverStore = useServerStore()
const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(props.album.coverArtId, 300) || ''
})
</script>

<template>
  <div
    class="glass-card group cursor-pointer rounded-2xl p-2.5 sm:p-3.5 relative overflow-hidden transition-all duration-300 active:scale-95"
    @click="emit('click', props.album)"
  >
    <!-- 封面容器带黑胶露出视觉动效 -->
    <div class="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 shadow-xl">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="props.album.name"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
        loading="lazy"
        decoding="async"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-neutral-600 bg-neutral-900/80">
        <Disc3 class="w-12 h-12 stroke-[1.2]" />
      </div>

      <!-- 悬浮微光蒙层与播放徽章 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 justify-end">
        <div
          class="w-10 h-10 rounded-full text-neutral-950 flex items-center justify-center shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 font-bold"
          :style="{
            background: 'var(--theme-accent)',
            boxShadow: '0 0 20px var(--theme-glow)'
          }"
        >
          <Play class="w-5 h-5 fill-current ml-0.5" />
        </div>
      </div>
    </div>

    <!-- 文本信息 -->
    <div class="mt-3">
      <div class="truncate text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)] transition-colors">
        {{ props.album.name }}
      </div>
      <div class="truncate text-xs text-[var(--theme-text-secondary)] mt-0.5 flex items-center justify-between">
        <span class="truncate">{{ props.album.artist }}</span>
        <span v-if="props.album.year" class="text-[10px] text-[var(--theme-text-muted)] font-mono shrink-0 ml-1">{{ props.album.year }}</span>
      </div>
    </div>
  </div>
</template>
