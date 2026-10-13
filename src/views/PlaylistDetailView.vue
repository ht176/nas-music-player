<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import TrackRow from '../components/TrackRow.vue'
import type { Playlist } from '../api/types'
import { ListMusic, Play, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const serverStore = useServerStore()
const playerStore = usePlayerStore()

const playlist = ref<Playlist | null>(null)
const loading = ref(true)

async function loadPlaylistDetail() {
  const id = route.params.id as string
  if (!id || !serverStore.client) return
  loading.value = true
  try {
    playlist.value = await serverStore.client.getPlaylist(id)
  } catch (e) {
    console.error('加载歌单详情失败', e)
  } finally {
    loading.value = false
  }
}

async function removeSong(index: number, songTitle?: string) {
  if (!playlist.value || !serverStore.client) return
  if (songTitle && !confirm(`确定要从歌单中移除《${songTitle}》吗？`)) return
  try {
    await serverStore.client.updatePlaylist(playlist.value.id, undefined, index)
    await loadPlaylistDetail()
  } catch (err) {
    console.error('移除曲目失败', err)
  }
}

function playAll() {
  if (playlist.value?.songs?.length) {
    playerStore.playTrack(playlist.value.songs[0], playlist.value.songs)
  }
}

onMounted(() => {
  loadPlaylistDetail()
})
</script>

<template>
  <div v-if="playlist" class="space-y-6 pb-12">
    <!-- 头部信息 -->
    <div class="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-neutral-800/40 to-transparent p-6 rounded-2xl">
      <div class="w-40 h-40 rounded-xl overflow-hidden shadow-xl bg-neutral-900 shrink-0 flex items-center justify-center">
        <img
          v-if="serverStore.client?.getCoverArtUrl(playlist.coverArtId, 300)"
          :src="serverStore.client?.getCoverArtUrl(playlist.coverArtId, 300)"
          class="w-full h-full object-cover"
        />
        <ListMusic v-else class="w-16 h-16 text-neutral-600" />
      </div>
      <div class="space-y-2 text-center sm:text-left">
        <div class="text-xs uppercase tracking-wider text-neutral-400 font-semibold">歌单</div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white">{{ playlist.name }}</h1>
        <div class="text-sm text-neutral-400">
          <span>共 {{ playlist.songCount }} 首曲目</span>
          <span v-if="playlist.comment"> · {{ playlist.comment }}</span>
        </div>
        <div class="pt-2">
          <button
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition shadow-lg cursor-pointer"
            @click="playAll"
          >
            <Play class="w-4 h-4 fill-current" /> 播放全部
          </button>
        </div>
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div v-if="playlist.songs?.length" class="space-y-1">
      <div
        v-for="(song, idx) in playlist.songs"
        :key="song.id"
        class="relative group/row flex items-center"
      >
        <TrackRow
          class="flex-1"
          :track="song"
          :index="idx"
          :is-active="playerStore.currentTrack?.id === song.id"
          :is-playing="playerStore.isPlaying"
          @play="playerStore.playTrack(song, playlist.songs)"
        />
        <button
          class="opacity-70 sm:opacity-0 sm:group-hover/row:opacity-100 p-2 text-neutral-400 hover:text-rose-400 hover:bg-white/10 active:scale-95 rounded-lg transition mr-1 sm:mr-2 cursor-pointer shrink-0"
          :title="`从歌单中移除《${song.title}》`"
          @click.stop="removeSong(idx, song.title)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
    <div v-else class="text-center py-16 text-neutral-500 text-sm">
      歌单内还没有任何曲目
    </div>
  </div>
</template>
