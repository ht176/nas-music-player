<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useServerStore } from '../stores/server'
import type { Playlist, Track } from '../api/types'
import { X, Check, Plus, Music2 } from 'lucide-vue-next'

const props = defineProps<{
  track: Track | null
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'added'): void
}>()

const serverStore = useServerStore()
const playlists = ref<Playlist[]>([])
const loading = ref(false)
const addingId = ref<string | null>(null)
const successId = ref<string | null>(null)
const newName = ref('')
const isCreating = ref(false)

async function loadPlaylists() {
  if (!serverStore.client) return
  loading.value = true
  try {
    playlists.value = await serverStore.client.getPlaylists()
  } catch (err) {
    console.error('加载歌单失败', err)
  } finally {
    loading.value = false
  }
}

async function addToPlaylist(playlist: Playlist) {
  if (!serverStore.client || !props.track || addingId.value) return
  addingId.value = playlist.id
  try {
    await serverStore.client.updatePlaylist(playlist.id, props.track.id)
    successId.value = playlist.id
    emit('added')
    setTimeout(() => {
      emit('update:modelValue', false)
      successId.value = null
    }, 600)
  } catch (err) {
    console.error('添加到歌单失败', err)
  } finally {
    addingId.value = null
  }
}

async function handleCreateAndAdd() {
  if (!newName.value.trim() || !serverStore.client || !props.track) return
  isCreating.value = true
  try {
    const pl = await serverStore.client.createPlaylist(newName.value.trim(), [props.track.id])
    successId.value = pl.id
    newName.value = ''
    emit('added')
    setTimeout(() => {
      emit('update:modelValue', false)
      successId.value = null
    }, 600)
  } catch (err) {
    console.error('新建并添加失败', err)
  } finally {
    isCreating.value = false
  }
}

onMounted(() => {
  loadPlaylists()
})
</script>

<template>
  <div v-if="props.modelValue && props.track" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
    <div class="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/10 p-5 shadow-2xl space-y-4">
      <div class="flex items-center justify-between pb-1 border-b border-white/5">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Music2 class="w-4 h-4 text-emerald-400" /> 添加到歌单
        </h3>
        <button class="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10" @click="emit('update:modelValue', false)">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="text-xs text-neutral-400 truncate">
        将 <span class="text-emerald-400 font-semibold">{{ props.track.title }}</span> 添加到指定歌单：
      </div>

      <!-- 快速新建歌单并收录 -->
      <div class="flex items-center gap-2">
        <input
          v-model="newName"
          type="text"
          placeholder="新建歌单并收入..."
          class="flex-1 bg-neutral-800/80 border border-neutral-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
          @keyup.enter="handleCreateAndAdd"
        />
        <button
          class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition disabled:opacity-50 shrink-0"
          :disabled="!newName.trim() || isCreating"
          @click="handleCreateAndAdd"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- 歌单列表 -->
      <div class="max-h-56 overflow-y-auto space-y-1 pr-1">
        <div v-if="loading" class="text-xs text-neutral-500 text-center py-4">加载中...</div>
        <div v-else-if="playlists.length === 0" class="text-xs text-neutral-500 text-center py-4">暂无可用歌单，可直接上方输入新建</div>
        <button
          v-for="pl in playlists"
          :key="pl.id"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-neutral-800/80 transition group border border-transparent hover:border-white/5 cursor-pointer"
          :disabled="addingId === pl.id"
          @click="addToPlaylist(pl)"
        >
          <div class="truncate">
            <div class="text-sm font-medium text-neutral-200 group-hover:text-white truncate">{{ pl.name }}</div>
            <div class="text-[11px] text-neutral-500">{{ pl.songCount }} 首歌曲</div>
          </div>
          <span v-if="successId === pl.id" class="text-emerald-400 animate-scale-in">
            <Check class="w-4 h-4 stroke-[2.5]" />
          </span>
          <span v-else class="text-xs text-neutral-500 group-hover:text-emerald-400 transition">
            +
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
