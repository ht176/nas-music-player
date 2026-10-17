<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import TrackRow from '../components/TrackRow.vue'
import type { Track } from '../api/types'
import {
  Music,
  Play,
  Shuffle,
  Search,
  ArrowUpDown,
  RotateCcw,
  Heart,
  Calendar,
  Star,
  Disc3,
  Loader2,
} from 'lucide-vue-next'

const serverStore = useServerStore()
const playerStore = usePlayerStore()

// 数据集与状态
const songs = ref<Track[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const PAGE_SIZE = 30
const scrollAnchor = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 搜索、筛选与排序状态
const searchKeyword = ref('')
const selectedStarred = ref<'all' | 'starred' | 'unstarred'>('all')
const selectedYearRange = ref<'all' | '2020s' | '2010s' | '2000s' | 'classic'>('all')
const selectedRating = ref<number | 'all'>('all')
const sortBy = ref<'default' | 'title' | 'artist' | 'album' | 'year' | 'duration' | 'rating'>('default')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 过滤与排序后的展示歌曲
const filteredSongs = computed(() => {
  let list = [...songs.value]

  // 1. 关键词过滤（名称、专辑、歌手）
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(kw)) ||
        (s.artist && s.artist.toLowerCase().includes(kw)) ||
        (s.album && s.album.toLowerCase().includes(kw))
    )
  }

  // 2. 收藏筛选
  if (selectedStarred.value === 'starred') {
    list = list.filter((s) => s.starred)
  } else if (selectedStarred.value === 'unstarred') {
    list = list.filter((s) => !s.starred)
  }

  // 3. 年代筛选
  if (selectedYearRange.value === '2020s') {
    list = list.filter((s) => (s.year || 0) >= 2020)
  } else if (selectedYearRange.value === '2010s') {
    list = list.filter((s) => (s.year || 0) >= 2010 && (s.year || 0) < 2020)
  } else if (selectedYearRange.value === '2000s') {
    list = list.filter((s) => (s.year || 0) >= 2000 && (s.year || 0) < 2010)
  } else if (selectedYearRange.value === 'classic') {
    list = list.filter((s) => (s.year || 0) > 0 && (s.year || 0) < 2000)
  }

  // 4. 评分筛选
  if (selectedRating.value !== 'all') {
    const minRating = Number(selectedRating.value)
    list = list.filter((s) => (s.userRating || 0) >= minRating)
  }

  // 5. 排序处理
  if (sortBy.value !== 'default') {
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy.value === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '', 'zh-Hans-CN')
      } else if (sortBy.value === 'artist') {
        cmp = (a.artist || '').localeCompare(b.artist || '', 'zh-Hans-CN')
      } else if (sortBy.value === 'album') {
        cmp = (a.album || '').localeCompare(b.album || '', 'zh-Hans-CN')
      } else if (sortBy.value === 'year') {
        cmp = (a.year || 0) - (b.year || 0)
      } else if (sortBy.value === 'duration') {
        cmp = (a.duration || 0) - (b.duration || 0)
      } else if (sortBy.value === 'rating') {
        cmp = (a.userRating || 0) - (b.userRating || 0)
      }
      return sortOrder.value === 'asc' ? cmp : -cmp
    })
  }

  return list
})

// 初始加载或重置加载
async function loadSongs(isReset = false) {
  if (!serverStore.client) return
  if (isReset) {
    loading.value = true
    offset.value = 0
    hasMore.value = true
  } else {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
  }

  try {
    const query = searchKeyword.value.trim()
    let newItems: Track[] = []

    if (query) {
      newItems = await serverStore.client.searchSongs(query, PAGE_SIZE, offset.value)
    } else {
      // 当无关键字时，默认按字母顺序或随机分批载入
      newItems = await serverStore.client.searchSongs('', PAGE_SIZE, offset.value)
      // 若标准 searchSongs 为空则使用 getRandomSongs 补充获取
      if (!newItems.length && offset.value === 0) {
        newItems = await serverStore.client.getRandomSongs(PAGE_SIZE)
      }
    }

    if (newItems.length < PAGE_SIZE) {
      hasMore.value = false
    }

    if (isReset) {
      songs.value = newItems
    } else {
      // 避免重复追加相同 ID
      const existingIds = new Set(songs.value.map((s) => s.id))
      const uniqueNew = newItems.filter((s) => !existingIds.has(s.id))
      songs.value.push(...uniqueNew)
    }

    offset.value += newItems.length
  } catch (err) {
    console.error('加载歌曲列表失败', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 关键词防抖搜索
let searchTimer: any = null
watch(searchKeyword, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadSongs(true)
  }, 400)
})

// 全部顺序播放
function playAllSequence() {
  if (filteredSongs.value.length) {
    playerStore.playMode = 'loop'
    playerStore.playTrack(filteredSongs.value[0], filteredSongs.value)
  }
}

// 全部随机播放
function playAllRandom() {
  if (filteredSongs.value.length) {
    playerStore.playMode = 'random'
    const shuffled = [...filteredSongs.value].sort(() => Math.random() - 0.5)
    playerStore.playTrack(shuffled[0], shuffled)
  }
}

// 重置所有筛选器
function resetFilters() {
  searchKeyword.value = ''
  selectedStarred.value = 'all'
  selectedYearRange.value = 'all'
  selectedRating.value = 'all'
  sortBy.value = 'default'
  sortOrder.value = 'asc'
  loadSongs(true)
}

// 切换升降序
function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// 触底上拉加载更多 Observer
function setupObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value && !loadingMore.value) {
        loadSongs(false)
      }
    },
    { threshold: 0.1 }
  )
  if (scrollAnchor.value) {
    observer.observe(scrollAnchor.value)
  }
}

onMounted(() => {
  loadSongs(true).then(() => {
    setupObserver()
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div class="space-y-6 pb-12 animate-fade-in">
    <!-- 顶部标题与播放全量操作 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)] flex items-center gap-2">
          <Music class="w-6 h-6 text-[var(--theme-accent)]" /> 全部歌曲
        </h1>
        <p class="text-xs text-[var(--theme-text-secondary)] mt-1">
          曲库已载入 {{ filteredSongs.length }} 首曲目 · 支持多维检索筛选与流体上拉分页
        </p>
      </div>

      <!-- 快捷操作按钮组 -->
      <div class="flex items-center gap-3">
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-neutral-950 font-semibold text-xs sm:text-sm transition shadow-lg cursor-pointer disabled:opacity-50"
          :disabled="!filteredSongs.length"
          @click="playAllSequence"
        >
          <Play class="w-4 h-4 fill-current" /> 顺序播放全部
        </button>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-neutral-800 hover:bg-black/10 dark:hover:bg-neutral-700 text-[var(--theme-text-primary)] font-semibold text-xs sm:text-sm transition border border-black/10 dark:border-neutral-700/80 cursor-pointer disabled:opacity-50"
          :disabled="!filteredSongs.length"
          @click="playAllRandom"
        >
          <Shuffle class="w-4 h-4" /> 随机播放
        </button>
      </div>
    </div>

    <!-- 综合筛选与搜索控制面板 -->
    <div class="p-4 rounded-2xl glass-card border border-[var(--theme-border)] space-y-3">
      <!-- 第一行：搜索框与重置 -->
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <div class="relative flex-1 w-full">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-text-muted)]" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索歌曲名 / 歌手 / 专辑..."
            class="w-full bg-black/5 dark:bg-neutral-800/60 border border-black/10 dark:border-neutral-700/70 rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition"
          />
        </div>
        <button
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-neutral-800/60 hover:bg-black/10 dark:hover:bg-neutral-800 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xs border border-black/10 dark:border-neutral-700/60 transition cursor-pointer shrink-0 self-end sm:self-auto"
          title="重置所有筛选"
          @click="resetFilters"
        >
          <RotateCcw class="w-3.5 h-3.5" /> 重置筛选
        </button>
      </div>

      <!-- 第二行：多维筛选器 (收藏、年代、评分、排序规则) -->
      <div class="flex flex-wrap items-center gap-3 pt-1 text-xs">
        <!-- 收藏状态 -->
        <div class="flex items-center gap-1.5 bg-black/5 dark:bg-neutral-800/40 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-neutral-700/50">
          <Heart class="w-3.5 h-3.5 text-rose-500" />
          <span class="text-[var(--theme-text-secondary)] text-[11px]">收藏:</span>
          <select v-model="selectedStarred" class="bg-transparent text-[var(--theme-text-primary)] focus:outline-none cursor-pointer">
            <option value="all">全部</option>
            <option value="starred">仅已收藏</option>
            <option value="unstarred">未收藏</option>
          </select>
        </div>

        <!-- 年代区间 -->
        <div class="flex items-center gap-1.5 bg-black/5 dark:bg-neutral-800/40 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-neutral-700/50">
          <Calendar class="w-3.5 h-3.5 text-[var(--theme-accent)]" />
          <span class="text-[var(--theme-text-secondary)] text-[11px]">年代:</span>
          <select v-model="selectedYearRange" class="bg-transparent text-[var(--theme-text-primary)] focus:outline-none cursor-pointer">
            <option value="all">全部年代</option>
            <option value="2020s">2020 年代</option>
            <option value="2010s">2010 年代</option>
            <option value="2000s">2000 年代</option>
            <option value="classic">经典老歌 (2000前)</option>
          </select>
        </div>

        <!-- 用户评分 -->
        <div class="flex items-center gap-1.5 bg-black/5 dark:bg-neutral-800/40 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-neutral-700/50">
          <Star class="w-3.5 h-3.5 text-amber-500" />
          <span class="text-[var(--theme-text-secondary)] text-[11px]">评分:</span>
          <select v-model="selectedRating" class="bg-transparent text-[var(--theme-text-primary)] focus:outline-none cursor-pointer">
            <option value="all">全部</option>
            <option :value="5">5 星推荐</option>
            <option :value="4">4 星及以上</option>
            <option :value="3">3 星及以上</option>
          </select>
        </div>

        <!-- 排序方式 -->
        <div class="flex items-center gap-1.5 bg-black/5 dark:bg-neutral-800/40 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-neutral-700/50">
          <ArrowUpDown class="w-3.5 h-3.5 text-[var(--theme-accent-secondary)]" />
          <span class="text-[var(--theme-text-secondary)] text-[11px]">排序:</span>
          <select v-model="sortBy" class="bg-transparent text-[var(--theme-text-primary)] focus:outline-none cursor-pointer">
            <option value="default">默认排序</option>
            <option value="title">歌曲名称</option>
            <option value="artist">歌手名字</option>
            <option value="album">所属专辑</option>
            <option value="year">发行年份</option>
            <option value="duration">歌曲时长</option>
            <option value="rating">个人评分</option>
          </select>
          <button
            class="ml-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition cursor-pointer text-[11px] font-mono px-1 rounded hover:bg-black/5 dark:hover:bg-neutral-700/50"
            :title="sortOrder === 'asc' ? '当前：升序，点击切换降序' : '当前：降序，点击切换升序'"
            @click="toggleSortOrder"
          >
            {{ sortOrder === 'asc' ? '↑升序' : '↓降序' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 歌曲列表主体 -->
    <div v-if="loading && !songs.length" class="text-center py-20 text-neutral-500 text-sm flex flex-col items-center gap-3">
      <Loader2 class="w-6 h-6 animate-spin text-emerald-400" />
      <span>正在极速同步 NAS 全部曲库...</span>
    </div>

    <div v-else-if="filteredSongs.length" class="space-y-1">
      <TrackRow
        v-for="(song, idx) in filteredSongs"
        :key="song.id"
        :track="song"
        :index="idx"
        :is-active="playerStore.currentTrack?.id === song.id"
        :is-playing="playerStore.isPlaying"
        @play="playerStore.playTrack(song, filteredSongs)"
      />

      <!-- 触底上拉加载触发哨兵 Anchor -->
      <div ref="scrollAnchor" class="py-6 flex items-center justify-center text-xs text-neutral-500">
        <span v-if="loadingMore" class="flex items-center gap-2 text-emerald-400 font-medium">
          <Loader2 class="w-4 h-4 animate-spin" /> 加载更多歌曲 (每批 30 首)...
        </span>
        <span v-else-if="!hasMore" class="text-neutral-600">
          已到达全部歌曲曲库末尾 (共 {{ songs.length }} 首)
        </span>
      </div>
    </div>

    <!-- 无结果状态 -->
    <div v-else class="text-center py-20 text-neutral-500 text-sm flex flex-col items-center gap-3">
      <Disc3 class="w-10 h-10 text-neutral-600 animate-pulse" />
      <span>未找到匹配的歌曲，您可以尝试调整筛选条件或重置搜索</span>
      <button
        class="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
        @click="resetFilters"
      >
        重置筛选并刷新
      </button>
    </div>
  </div>
</template>
