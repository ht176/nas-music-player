<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import { toastService } from '../services/toast'
import TrackRow from '../components/TrackRow.vue'
import type { Playlist } from '../api/types'
import { ListMusic, Play, Trash2, Edit2, Check, X } from 'lucide-vue-next'

const route = useRoute()
const serverStore = useServerStore()
const playerStore = usePlayerStore()

const playlist = ref<Playlist | null>(null)
const loading = ref(true)
const isEditingName = ref(false)
const editingName = ref('')

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

function startRename() {
  if (!playlist.value) return
  editingName.value = playlist.value.name
  isEditingName.value = true
}

async function saveRename() {
  const trimmed = editingName.value.trim()
  if (!trimmed || !playlist.value || !serverStore.client) return
  try {
    await serverStore.client.updatePlaylist(playlist.value.id, undefined, undefined, trimmed)
    playlist.value.name = trimmed
    isEditingName.value = false
    toastService.success(`歌单已重命名为【${trimmed}】`)
  } catch (err) {
    toastService.error('重命名歌单失败')
  }
}

async function removeSong(index: number, songTitle?: string) {
  if (!playlist.value || !serverStore.client) return
  if (songTitle && !confirm(`确定要从歌单中移除《${songTitle}》吗？`)) return
  try {
    await serverStore.client.updatePlaylist(playlist.value.id, undefined, index)
    toastService.info(songTitle ? `已从歌单移除《${songTitle}》` : '已从歌单移除歌曲')
    await loadPlaylistDetail()
  } catch (err) {
    toastService.error('移除歌曲失败')
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
        <div class="flex items-center gap-2 justify-center sm:justify-start">
          <div v-if="!isEditingName" class="flex items-center gap-2">
            <h1 class="text-2xl sm:text-3xl font-bold text-white">{{ playlist.name }}</h1>
            <button
              class="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              title="重命名歌单"
              @click="startRename"
            >
              <Edit2 class="w-4 h-4" />
            </button>
          </div>
          <div v-else class="flex items-center gap-2">
            <input
              v-model="editingName"
              type="text"
              class="bg-neutral-800 border border-neutral-700 text-white text-lg font-bold px-3 py-1 rounded-lg focus:outline-none focus:border-emerald-500"
              placeholder="输入新歌单名称"
              autofocus
              @keyup.enter="saveRename"
              @keyup.esc="isEditingName = false"
            />
            <button
              class="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg transition cursor-pointer"
              title="保存"
              @click="saveRename"
            >
              <Check class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition cursor-pointer"
              title="取消"
              @click="isEditingName = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
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
