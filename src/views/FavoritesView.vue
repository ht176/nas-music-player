<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import TrackRow from '../components/TrackRow.vue'
import AlbumCard from '../components/AlbumCard.vue'
import type { Album, Track } from '../api/types'
import { Heart, Play } from 'lucide-vue-next'

const router = useRouter()
const serverStore = useServerStore()
const playerStore = usePlayerStore()

const activeTab = ref<'songs' | 'albums'>('songs')
const starredSongs = ref<Track[]>([])
const starredAlbums = ref<Album[]>([])
const loading = ref(true)

async function loadStarred() {
  if (!serverStore.client) return
  loading.value = true
  try {
    const res = await serverStore.client.getStarred()
    starredSongs.value = res.songs
    starredAlbums.value = res.albums
  } catch (e) {
    console.error('获取收藏数据失败', e)
  } finally {
    loading.value = false
  }
}

function playAll() {
  if (starredSongs.value.length > 0) {
    playerStore.playTrack(starredSongs.value[0], starredSongs.value)
  }
}

function goToAlbum(album: Album) {
  router.push(`/album/${album.id}`)
}

onMounted(() => {
  loadStarred()
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- 头部横幅 -->
    <div class="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-rose-500/10 via-[var(--theme-surface)]/60 to-transparent p-6 rounded-2xl border border-rose-500/20 glass-card">
      <div class="w-36 h-36 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-xl shrink-0">
        <Heart class="w-16 h-16 fill-current animate-pulse preserve-contrast" />
      </div>
      <div class="space-y-2 text-center sm:text-left">
        <div class="text-xs uppercase tracking-wider text-rose-500 dark:text-rose-400 font-semibold">收藏夹</div>
        <h1 class="text-3xl font-bold text-[var(--theme-text-primary)]">我喜欢的音乐</h1>
        <p class="text-xs text-[var(--theme-text-secondary)]">已收藏 {{ starredSongs.length }} 首歌曲 · {{ starredAlbums.length }} 张专辑</p>
        <div class="pt-2">
          <button
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-neutral-950 font-bold text-sm transition shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            :style="{
              background: 'var(--theme-accent)',
              boxShadow: '0 0 20px var(--theme-glow)'
            }"
            @click="playAll"
          >
            <Play class="w-4 h-4 fill-current" /> 播放全部
          </button>
        </div>
      </div>
    </div>

    <!-- 切换 Tab -->
    <div class="flex items-center gap-2 border-b border-[var(--theme-border)] pb-2">
      <button
        class="px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer"
        :class="activeTab === 'songs' ? 'bg-black/5 dark:bg-white/10 text-[var(--theme-accent)] font-bold shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'"
        @click="activeTab = 'songs'"
      >
        歌曲 ({{ starredSongs.length }})
      </button>
      <button
        class="px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer"
        :class="activeTab === 'albums' ? 'bg-black/5 dark:bg-white/10 text-[var(--theme-accent)] font-bold shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'"
        @click="activeTab = 'albums'"
      >
        专辑 ({{ starredAlbums.length }})
      </button>
    </div>

    <!-- 内容展示 -->
    <div v-if="loading" class="text-center py-12 text-[var(--theme-text-muted)] text-sm">
      正在加载收藏内容...
    </div>

    <div v-else-if="activeTab === 'songs'">
      <div v-if="starredSongs.length" class="space-y-1">
        <TrackRow
          v-for="(song, idx) in starredSongs"
          :key="song.id"
          :track="song"
          :index="idx"
          :is-active="playerStore.currentTrack?.id === song.id"
          :is-playing="playerStore.isPlaying"
          @play="playerStore.playTrack(song, starredSongs)"
        />
      </div>
      <div v-else class="text-center py-16 text-neutral-500 text-sm">
        还没有收藏任何歌曲，点击歌曲右侧红心即可收藏
      </div>
    </div>

    <div v-else-if="activeTab === 'albums'">
      <div v-if="starredAlbums.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AlbumCard
          v-for="album in starredAlbums"
          :key="album.id"
          :album="album"
          @click="goToAlbum"
        />
      </div>
      <div v-else class="text-center py-16 text-neutral-500 text-sm">
        还没有收藏任何专辑
      </div>
    </div>
  </div>
</template>
