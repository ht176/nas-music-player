<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import TrackRow from '../components/TrackRow.vue'
import type { Album, Track } from '../api/types'
import { Play } from 'lucide-vue-next'

const route = useRoute()
const serverStore = useServerStore()
const playerStore = usePlayerStore()

const album = ref<Album | null>(null)
const loading = ref(true)

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(album.value?.coverArtId, 400) || ''
})

async function fetchAlbumDetail() {
  const id = route.params.id as string
  if (!id || !serverStore.client) return

  loading.value = true
  try {
    album.value = await serverStore.client.getAlbum(id)
  } catch (e) {
    console.error('加载专辑详情失败', e)
  } finally {
    loading.value = false
  }
}

function playTrack(track: Track) {
  if (album.value?.songs) {
    playerStore.playTrack(track, album.value.songs)
  }
}

function playAll() {
  if (album.value?.songs && album.value.songs.length > 0) {
    playerStore.playTrack(album.value.songs[0], album.value.songs)
  }
}

onMounted(() => {
  fetchAlbumDetail()
})
</script>

<template>
  <div v-if="album" class="space-y-6 pb-12">
    <!-- 头部专辑信息 -->
    <div class="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-neutral-800/40 to-transparent p-6 rounded-2xl">
      <div class="w-44 h-44 rounded-xl overflow-hidden shadow-xl bg-neutral-900 shrink-0">
        <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover" />
      </div>
      <div class="space-y-2 text-center sm:text-left">
        <div class="text-xs uppercase tracking-wider text-neutral-400 font-semibold">专辑</div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white">{{ album.name }}</h1>
        <div class="text-sm text-neutral-300">
          <span class="font-medium text-white">{{ album.artist }}</span>
          <span v-if="album.year"> · {{ album.year }}</span>
          <span> · {{ album.songCount }} 首曲目</span>
        </div>
        <div class="pt-2">
          <button
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition shadow-lg cursor-pointer active:scale-95"
            @click="playAll"
          >
            <Play class="w-4 h-4 fill-current" /> 播放全部
          </button>
        </div>
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div class="space-y-1">
      <TrackRow
        v-for="(song, idx) in album.songs"
        :key="song.id"
        :track="song"
        :index="idx"
        :is-active="playerStore.currentTrack?.id === song.id"
        :is-playing="playerStore.isPlaying"
        @play="playTrack"
      />
    </div>
  </div>
</template>
