<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import type { Album, Artist, Track } from '../api/types'
import { Search, X, Disc, User, Music } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const router = useRouter()
const serverStore = useServerStore()
const playerStore = usePlayerStore()

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const loading = ref(false)
const results = ref<{ songs: Track[]; albums: Album[]; artists: Artist[] }>({
  songs: [],
  albums: [],
  artists: [],
})

let timer: any = null

  function onGlobalKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && props.modelValue) {
      close()
    }
  }

  watch(
    () => props.modelValue,
    (open) => {
      if (open) {
        window.addEventListener('keydown', onGlobalKeydown)
        nextTick(() => {
          setTimeout(() => {
            inputRef.value?.focus()
            inputRef.value?.select()
          }, 50)
        })
      } else {
        window.removeEventListener('keydown', onGlobalKeydown)
      }
    }
  )

  onUnmounted(() => {
    window.removeEventListener('keydown', onGlobalKeydown)
  })

watch(query, (val) => {
  clearTimeout(timer)
  if (!val.trim()) {
    results.value = { songs: [], albums: [], artists: [] }
    return
  }
  timer = setTimeout(async () => {
    if (!serverStore.client) return
    loading.value = true
    try {
      results.value = await serverStore.client.search(val.trim())
    } catch (e) {
      console.error('搜索异常', e)
    } finally {
      loading.value = false
    }
  }, 300)
})

function close() {
  emit('update:modelValue', false)
  query.value = ''
  results.value = { songs: [], albums: [], artists: [] }
}

function handleSelectSong(song: Track) {
  playerStore.playTrack(song, results.value.songs)
  close()
}

function handleSelectAlbum(album: Album) {
  router.push(`/album/${album.id}`)
  close()
}

function handleSelectArtist(artist: Artist) {
  router.push(`/artist/${artist.id}`)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.modelValue"
      class="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-fade-in"
      @click.self="close"
    >
      <div class="w-full max-w-2xl bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        <!-- 搜索框 -->
        <div class="p-4 border-b border-[var(--theme-border)] flex items-center gap-3">
          <Search class="w-5 h-5 text-[var(--theme-text-muted)] shrink-0" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="搜索单曲、专辑、艺术家..."
            class="flex-1 bg-transparent text-[var(--theme-text-primary)] text-base focus:outline-none placeholder-[var(--theme-text-muted)]"
            @keydown.esc="close"
          />
        <button
          v-if="query"
          class="p-1 rounded-md text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] cursor-pointer"
          @click="query = ''"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- 搜索结果区 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <div v-if="loading" class="text-center py-8 text-[var(--theme-text-muted)] text-sm">
          正在搜索 NAS 音乐库...
        </div>

        <template v-else-if="results.songs.length || results.albums.length || results.artists.length">
          <!-- 单曲 -->
          <div v-if="results.songs.length">
            <div class="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-2 flex items-center gap-1.5">
              <Music class="w-3.5 h-3.5 text-[var(--theme-accent)]" /> 单曲 ({{ results.songs.length }})
            </div>
            <div class="space-y-1">
              <div
                v-for="song in results.songs.slice(0, 8)"
                :key="song.id"
                class="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-sm"
                @click="handleSelectSong(song)"
              >
                <div class="truncate">
                  <div class="text-[var(--theme-text-primary)] font-medium truncate">{{ song.title }}</div>
                  <div class="text-xs text-[var(--theme-text-secondary)] truncate">{{ song.artist }} · {{ song.album }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 专辑 -->
          <div v-if="results.albums.length">
            <div class="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-2 flex items-center gap-1.5">
              <Disc class="w-3.5 h-3.5 text-[var(--theme-accent)]" /> 专辑 ({{ results.albums.length }})
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div
                v-for="album in results.albums.slice(0, 6)"
                :key="album.id"
                class="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-2.5 truncate"
                @click="handleSelectAlbum(album)"
              >
                <div class="w-10 h-10 rounded bg-black/5 dark:bg-neutral-800 overflow-hidden shrink-0">
                  <img
                    v-if="serverStore.client?.getCoverArtUrl(album.coverArtId, 100)"
                    :src="serverStore.client?.getCoverArtUrl(album.coverArtId, 100)"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="truncate text-xs">
                  <div class="text-[var(--theme-text-primary)] font-medium truncate">{{ album.name }}</div>
                  <div class="text-[var(--theme-text-muted)] truncate">{{ album.artist }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 艺术家 -->
          <div v-if="results.artists.length">
            <div class="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-2 flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-[var(--theme-accent)]" /> 艺术家 ({{ results.artists.length }})
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="artist in results.artists.slice(0, 6)"
                :key="artist.id"
                class="px-3 py-1.5 rounded-full bg-black/5 dark:bg-neutral-800 hover:bg-black/10 dark:hover:bg-neutral-700 cursor-pointer text-xs text-[var(--theme-text-primary)] transition"
                @click="handleSelectArtist(artist)"
              >
                {{ artist.name }}
              </div>
            </div>
          </div>
        </template>

        <div v-else-if="query" class="text-center py-12 text-[var(--theme-text-muted)] text-sm">
          未找到匹配的内容
        </div>

        <div v-else class="text-center py-12 text-[var(--theme-text-muted)] text-sm">
          输入关键字即时检索您的私有曲库 (支持快捷键 Esc 关闭)
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>
