<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePlayerStore } from '../stores/player'
import { LyricsService, type OnlineLyricResult } from '../services/lyrics'
import { toastService } from '../services/toast'
import type { LyricLine } from '../api/types'
import { Search, FileText, Check, RotateCcw, X, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const playerStore = usePlayerStore()
const searchKeyword = ref('')
const searchResults = ref<OnlineLyricResult[]>([])
const searching = ref(false)
const selectedResult = ref<OnlineLyricResult | null>(null)
const previewLines = ref<LyricLine[]>([])
const hasCustomLyrics = ref(false)

// 打开弹窗时初始化搜索词
watch(
  () => props.modelValue,
  (open) => {
    if (open && playerStore.currentTrack) {
      searchKeyword.value = `${playerStore.currentTrack.artist} ${playerStore.currentTrack.title}`.trim()
      selectedResult.value = null
      previewLines.value = []
      hasCustomLyrics.value = !!LyricsService.getLyricOverride(playerStore.currentTrack.id)
      handleSearch()
    }
  }
)

async function handleSearch() {
  if (!searchKeyword.value.trim()) return
  searching.value = true
  try {
    searchResults.value = await LyricsService.searchOnlineLyrics(searchKeyword.value.trim())
    if (searchResults.value.length > 0) {
      selectResult(searchResults.value[0])
    } else {
      selectedResult.value = null
      previewLines.value = []
    }
  } catch (err) {
    console.error('搜索歌词失败', err)
  } finally {
    searching.value = false
  }
}

function selectResult(item: OnlineLyricResult) {
  selectedResult.value = item
  if (item.syncedLyrics) {
    previewLines.value = LyricsService.parse(item.syncedLyrics)
  } else if (item.plainLyrics) {
    const rawLines = item.plainLyrics.split('\n').filter(Boolean)
    previewLines.value = rawLines.map((text, idx) => ({ time: idx * 5, text: text.trim() }))
  }
}

function applyLyrics() {
  if (!previewLines.value.length || !playerStore.currentTrack) return
  playerStore.applyCustomLyrics(previewLines.value)
  hasCustomLyrics.value = true
  toastService.success(`已为《${playerStore.currentTrack.title}》应用精准匹配歌词`)
  emit('update:modelValue', false)
}

function resetToDefault() {
  if (!playerStore.currentTrack) return
  playerStore.resetTrackLyrics()
  hasCustomLyrics.value = false
  toastService.info(`已恢复《${playerStore.currentTrack.title}》原始内嵌歌词`)
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="props.modelValue && playerStore.currentTrack" class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
    <div class="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-700/80 p-5 shadow-2xl flex flex-col max-h-[85vh] space-y-4">
      <!-- 头部 -->
      <div class="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div class="flex items-center gap-2">
          <FileText class="w-5 h-5 text-emerald-400" />
          <h3 class="font-bold text-white text-base">搜索并替换歌词</h3>
          <span v-if="hasCustomLyrics" class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            已应用自定义歌词
          </span>
        </div>
        <button class="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer" @click="emit('update:modelValue', false)">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 搜索栏 -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="输入歌手名、歌曲名进行歌词云端检索..."
            class="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
            @keyup.enter="handleSearch"
          />
        </div>
        <button
          class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          :disabled="searching || !searchKeyword.trim()"
          @click="handleSearch"
        >
          <Loader2 v-if="searching" class="w-3.5 h-3.5 animate-spin" />
          <Search v-else class="w-3.5 h-3.5" />
          搜索
        </button>
      </div>

      <!-- 左右分栏：左侧结果列表，右侧预览 -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden min-h-[320px]">
        <!-- 左侧搜索候选项列表 -->
        <div class="flex flex-col border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/40">
          <div class="px-3 py-2 text-[11px] font-semibold text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
            <span>候选匹配结果 ({{ searchResults.length }})</span>
            <span class="text-[10px] text-neutral-500">源自 LRCLIB 同步库</span>
          </div>

          <div class="flex-1 overflow-y-auto p-2 space-y-1.5">
            <div v-if="searching" class="py-12 text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin text-emerald-400" />
              <span>正在云端精准匹配 LRC 时间轴歌词...</span>
            </div>

            <template v-else-if="searchResults.length > 0">
              <button
                v-for="item in searchResults"
                :key="item.id"
                class="w-full p-2.5 rounded-lg text-left transition cursor-pointer border flex flex-col gap-0.5 group"
                :class="[
                  selectedResult?.id === item.id
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-900/60 hover:bg-neutral-800 border-transparent text-neutral-300'
                ]"
                @click="selectResult(item)"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold truncate group-hover:text-white">{{ item.trackName }}</span>
                  <span
                    v-if="item.syncedLyrics"
                    class="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0"
                  >
                    逐行同步
                  </span>
                  <span
                    v-else
                    class="text-[9px] px-1.5 py-0.2 rounded font-mono bg-neutral-800 text-neutral-400 shrink-0"
                  >
                    纯文本
                  </span>
                </div>
                <div class="text-[11px] text-neutral-400 truncate">
                  {{ item.artistName }} <span v-if="item.albumName">· {{ item.albumName }}</span>
                </div>
              </button>
            </template>

            <div v-else class="py-12 text-center text-xs text-neutral-500">
              未找到匹配的在线歌词，请尝试更改搜索词
            </div>
          </div>
        </div>

        <!-- 右侧歌词预览区 -->
        <div class="flex flex-col border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/40">
          <div class="px-3 py-2 text-[11px] font-semibold text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
            <span>歌词时间轴预览 ({{ previewLines.length }} 行)</span>
            <span v-if="selectedResult?.syncedLyrics" class="text-emerald-400 font-mono text-[10px]">包含 LRC 时间戳</span>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-2 text-xs font-mono">
            <template v-if="previewLines.length > 0">
              <div
                v-for="(line, idx) in previewLines"
                :key="idx"
                class="flex items-start gap-2 text-neutral-400 hover:text-neutral-200 transition"
              >
                <span class="text-neutral-600 shrink-0 w-12 text-[10px]">{{ Math.floor(line.time / 60) }}:{{ (Math.floor(line.time % 60)).toString().padStart(2, '0') }}</span>
                <span class="text-neutral-300 font-sans break-all">{{ line.text }}</span>
              </div>
            </template>
            <div v-else class="h-full flex items-center justify-center text-xs text-neutral-500">
              选择左侧候选查看歌词预览
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="flex items-center justify-between pt-2 border-t border-neutral-800">
        <button
          v-if="hasCustomLyrics"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 text-xs transition cursor-pointer"
          title="恢复当前歌曲 NAS 原生歌词"
          @click="resetToDefault"
        >
          <RotateCcw class="w-3.5 h-3.5" /> 恢复服务端默认歌词
        </button>
        <div v-else></div>

        <div class="flex items-center gap-2.5">
          <button
            class="px-3.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white transition hover:bg-neutral-800 cursor-pointer"
            @click="emit('update:modelValue', false)"
          >
            取消
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-lg"
            :disabled="!previewLines.length"
            @click="applyLyrics"
          >
            <Check class="w-4 h-4 stroke-[2.5]" /> 应用并替换此歌词
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
