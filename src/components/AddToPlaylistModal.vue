<script setup lang="ts">
import { ref, watch } from 'vue'
import { useServerStore } from '../stores/server'
import { toastService } from '../services/toast'
import type { Playlist, Track } from '../api/types'
import { X, Check, Plus, Music2, CheckCircle2 } from 'lucide-vue-next'

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
const operatingId = ref<string | null>(null)
const successId = ref<string | null>(null)
const newName = ref('')
const isCreating = ref(false)
const feedbackMsg = ref<{ type: 'warn' | 'success'; text: string } | null>(null)

// 存储已包含当前歌曲的歌单 ID 集合 (防重复添加)
const containingPlaylistIds = ref<Set<string>>(new Set())

// 当弹窗打开且有选中音轨时，自动加载歌单并检查已有归属
async function loadPlaylists() {
  if (!serverStore.client || !props.track) return
  loading.value = true
  feedbackMsg.value = null
  try {
    const list = await serverStore.client.getPlaylists()
    playlists.value = list

    // 并行检查每个歌单是否已包含此歌曲
    const containsSet = new Set<string>()
    await Promise.all(
      list.map(async (pl) => {
        try {
          const detail = await serverStore.client!.getPlaylist(pl.id)
          if (detail.songs?.some((s) => s.id === props.track?.id)) {
            containsSet.add(pl.id)
          }
        } catch {
          // 容错忽略单个歌单详情加载失败
        }
      })
    )
    containingPlaylistIds.value = containsSet
  } catch (err) {
    console.error('加载歌单失败', err)
  } finally {
    loading.value = false
  }
}

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  (val) => {
    if (val && props.track) {
      loadPlaylists()
    } else {
      feedbackMsg.value = null
      successId.value = null
    }
  }
)

async function addToPlaylist(playlist: Playlist) {
  if (!serverStore.client || !props.track || operatingId.value) return

  // 1. 重复加入拦截判断
  if (containingPlaylistIds.value.has(playlist.id)) {
    const msg = `《${props.track.title}》已在歌单【${playlist.name}】中`
    feedbackMsg.value = {
      type: 'warn',
      text: msg,
    }
    toastService.warning(msg)
    return
  }

  operatingId.value = playlist.id
  feedbackMsg.value = null
  try {
    await serverStore.client.updatePlaylist(playlist.id, props.track.id)
    successId.value = playlist.id
    containingPlaylistIds.value.add(playlist.id)
    playlist.songCount = (playlist.songCount || 0) + 1
    const succMsg = `已将《${props.track.title}》加入歌单【${playlist.name}】`
    feedbackMsg.value = {
      type: 'success',
      text: succMsg,
    }
    toastService.success(succMsg)
    emit('added')
    setTimeout(() => {
      emit('update:modelValue', false)
      successId.value = null
    }, 500)
  } catch (err) {
    toastService.error(`加入歌单【${playlist.name}】失败`)
    console.error('添加到歌单失败', err)
  } finally {
    operatingId.value = null
  }
}

async function handleCreateAndAdd() {
  const trimmed = newName.value.trim()
  if (!trimmed || !serverStore.client || !props.track || isCreating.value) return
  isCreating.value = true
  feedbackMsg.value = null
  try {
    const pl = await serverStore.client.createPlaylist(trimmed, [props.track.id])
    successId.value = pl.id
    newName.value = ''
    const succMsg = `已新建歌单【${trimmed}】并添加歌曲`
    feedbackMsg.value = {
      type: 'success',
      text: succMsg,
    }
    toastService.success(succMsg)
    emit('added')
    setTimeout(() => {
      emit('update:modelValue', false)
      successId.value = null
    }, 500)
  } catch (err) {
    toastService.error('新建歌单并添加失败')
    console.error('新建并添加失败', err)
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div
    v-if="props.modelValue && props.track"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    @click.self="emit('update:modelValue', false)"
  >
    <div class="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/10 p-5 shadow-2xl space-y-4">
      <div class="flex items-center justify-between pb-1 border-b border-white/5">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Music2 class="w-4 h-4 text-emerald-400" /> 添加到歌单
        </h3>
        <button
          class="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          @click="emit('update:modelValue', false)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="text-xs text-neutral-400 truncate">
        将 <span class="text-emerald-400 font-semibold">{{ props.track.title }}</span> 收入到歌单：
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
          class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition disabled:opacity-50 shrink-0 cursor-pointer"
          :disabled="!newName.trim() || isCreating"
          @click="handleCreateAndAdd"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- 状态/提示信息反馈 -->
      <div
        v-if="feedbackMsg"
        class="text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 animate-fade-in"
        :class="
          feedbackMsg.type === 'warn'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        "
      >
        <span class="truncate">{{ feedbackMsg.text }}</span>
      </div>

      <!-- 歌单列表 -->
      <div class="max-h-56 overflow-y-auto space-y-1 pr-1">
        <div v-if="loading" class="text-xs text-neutral-500 text-center py-4">正在查询歌单状态...</div>
        <div v-else-if="playlists.length === 0" class="text-xs text-neutral-500 text-center py-4">
          暂无可用歌单，可直接上方输入新建
        </div>
        <button
          v-for="pl in playlists"
          :key="pl.id"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition group border cursor-pointer"
          :class="[
            containingPlaylistIds.has(pl.id)
              ? 'bg-emerald-500/5 border-emerald-500/20 text-neutral-400 hover:bg-emerald-500/10'
              : 'hover:bg-neutral-800/80 border-transparent hover:border-white/5'
          ]"
          :disabled="operatingId === pl.id"
          @click="addToPlaylist(pl)"
        >
          <div class="truncate pr-2">
            <div
              class="text-sm font-medium truncate"
              :class="containingPlaylistIds.has(pl.id) ? 'text-emerald-300' : 'text-neutral-200 group-hover:text-white'"
            >
              {{ pl.name }}
            </div>
            <div class="text-[11px] text-neutral-500">
              {{ pl.songCount }} 首歌曲
              <span v-if="containingPlaylistIds.has(pl.id)" class="text-emerald-400/80 ml-1">· 已收录</span>
            </div>
          </div>

          <!-- 状态图标 -->
          <span v-if="successId === pl.id" class="text-emerald-400 animate-scale-in">
            <Check class="w-4 h-4 stroke-[2.5]" />
          </span>
          <span v-else-if="containingPlaylistIds.has(pl.id)" class="text-emerald-400 text-xs flex items-center gap-1 font-mono">
            <CheckCircle2 class="w-3.5 h-3.5" />
          </span>
          <span v-else class="text-xs text-neutral-500 group-hover:text-emerald-400 transition font-mono">
            +
          </span>
        </button>
      </div>

      <!-- 底部歌单操作与移除指引 -->
      <div class="pt-2 border-t border-white/5 text-[11px] text-neutral-500 text-center flex items-center justify-between">
        <span>如需移除歌曲：</span>
        <router-link
          to="/playlists"
          class="text-emerald-400/90 hover:text-emerald-300 transition hover:underline"
          @click="emit('update:modelValue', false)"
        >
          前往歌单详情管理 &rarr;
        </router-link>
      </div>
    </div>
  </div>
</template>
