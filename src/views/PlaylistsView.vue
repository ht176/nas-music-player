<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import { toastService } from '../services/toast'
import type { Playlist } from '../api/types'
import { ListMusic, Plus, Trash2 } from 'lucide-vue-next'

const router = useRouter()
const serverStore = useServerStore()
const playlists = ref<Playlist[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const newPlaylistName = ref('')

async function loadPlaylists() {
  if (!serverStore.client) return
  loading.value = true
  try {
    playlists.value = await serverStore.client.getPlaylists()
  } catch (e) {
    console.error('获取歌单失败', e)
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  const name = newPlaylistName.value.trim()
  if (!name || !serverStore.client) return
  try {
    await serverStore.client.createPlaylist(name)
    toastService.success(`已成功创建歌单【${name}】`)
    newPlaylistName.value = ''
    showCreateModal.value = false
    loadPlaylists()
  } catch (e) {
    toastService.error(`创建歌单【${name}】失败`)
    console.error('创建歌单失败', e)
  }
}

async function handleDelete(id: string, e: MouseEvent) {
  e.stopPropagation()
  const target = playlists.value.find((p) => p.id === id)
  const name = target?.name || '该歌单'
  if (!confirm(`确定要删除歌单【${name}】吗？`) || !serverStore.client) return
  try {
    await serverStore.client.deletePlaylist(id)
    toastService.info(`已删除歌单【${name}】`)
    loadPlaylists()
  } catch (err) {
    toastService.error(`删除歌单【${name}】失败`)
    console.error('删除歌单失败', err)
  }
}

function goToPlaylist(playlist: Playlist) {
  router.push(`/playlist/${playlist.id}`)
}

onMounted(() => {
  loadPlaylists()
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)] flex items-center gap-2">
          <ListMusic class="w-6 h-6 text-[var(--theme-accent)]" /> 播放列表 / 歌单
        </h1>
        <p class="text-sm text-[var(--theme-text-secondary)] mt-1">管理您的个人专属歌单</p>
      </div>

      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-neutral-950 font-semibold text-xs sm:text-sm transition shadow-lg cursor-pointer"
        @click="showCreateModal = true"
      >
        <Plus class="w-4 h-4" /> 新建歌单
      </button>
    </div>

    <!-- 歌单网格 -->
    <div v-if="loading" class="text-center py-12 text-[var(--theme-text-muted)] text-sm">
      正在加载歌单...
    </div>

    <div v-else-if="playlists.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div
        v-for="pl in playlists"
        :key="pl.id"
        class="glass-card group relative flex flex-col p-3 rounded-2xl cursor-pointer transition border border-[var(--theme-border)]"
        @click="goToPlaylist(pl)"
      >
        <div class="aspect-square w-full rounded-xl bg-neutral-200 dark:bg-neutral-800 overflow-hidden shadow mb-3 flex items-center justify-center">
          <img
            v-if="serverStore.client?.getCoverArtUrl(pl.coverArtId, 300)"
            :src="serverStore.client?.getCoverArtUrl(pl.coverArtId, 300)"
            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <ListMusic v-else class="w-12 h-12 text-[var(--theme-text-muted)]" />
        </div>
        <div class="font-semibold text-sm text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)] truncate">
          {{ pl.name }}
        </div>
        <div class="text-xs text-[var(--theme-text-secondary)] mt-0.5">
          {{ pl.songCount }} 首曲目
        </div>

        <button
          class="absolute top-4 right-4 p-1.5 rounded-lg bg-black/10 dark:bg-neutral-900/80 text-[var(--theme-text-secondary)] hover:text-rose-500 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer active:scale-95"
          title="删除歌单"
          @click="handleDelete(pl.id, $event)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-else class="text-center py-16 text-[var(--theme-text-muted)] text-sm">
      暂无任何歌单，点击右上角新建一个吧
    </div>

    <!-- 新建歌单弹窗 -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      @click.self="showCreateModal = false"
    >
      <div class="w-full max-w-sm bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-2xl space-y-4 text-[var(--theme-text-primary)]">
        <h3 class="font-bold text-[var(--theme-text-primary)] text-lg">新建专属歌单</h3>
        <input
          v-model="newPlaylistName"
          type="text"
          placeholder="请输入歌单名称"
          class="w-full bg-black/5 dark:bg-neutral-950 border border-black/10 dark:border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
          @keydown.enter="handleCreate"
        />
        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            class="px-4 py-2 rounded-lg text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer"
            @click="showCreateModal = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 text-neutral-950 font-semibold text-xs transition cursor-pointer"
            @click="handleCreate"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
