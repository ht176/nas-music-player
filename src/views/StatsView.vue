<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { statsService, type UserStats } from '../services/stats'
import { usePlayerStore } from '../stores/player'
import { toastService } from '../services/toast'
import TrackRow from '../components/TrackRow.vue'
import { BarChart3, Clock, Flame, User, Play, Trash2 } from 'lucide-vue-next'

const playerStore = usePlayerStore()
const stats = ref<UserStats>({
  totalPlayCount: 0,
  totalDurationSeconds: 0,
  history: [],
})
const topArtists = ref<{ name: string; count: number }[]>([])
const hourlyDistribution = ref<number[]>(new Array(24).fill(0))

function loadData() {
  stats.value = statsService.getStats()
  topArtists.value = statsService.getTopArtists(6)
  hourlyDistribution.value = statsService.getHourlyDistribution()
}

const formatHours = (seconds: number) => {
  const h = (seconds / 3600).toFixed(1)
  return `${h} 小时`
}

const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

function playAllHistory() {
  if (stats.value.history.length) {
    const tracks = stats.value.history.map((h) => h.track)
    playerStore.playTrack(tracks[0], tracks)
  }
}

function clearAll() {
  if (!confirm('确定清空所有听歌历史足迹吗？')) return
  statsService.clearHistory()
  loadData()
  toastService.info('听歌历史足迹已清空')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- 顶部概览看板卡片 -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)] flex items-center gap-2">
            <BarChart3 class="w-6 h-6 text-[var(--theme-accent)]" /> 听歌足迹与统计
          </h1>
          <p class="text-sm text-[var(--theme-text-secondary)] mt-1">记录您在私有曲库中的每一次音乐旅途</p>
        </div>
        <button
          v-if="stats.history.length"
          class="text-xs text-[var(--theme-text-secondary)] hover:text-rose-500 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-neutral-800/60 hover:bg-black/10 dark:hover:bg-neutral-800 border border-[var(--theme-border)] transition cursor-pointer"
          @click="clearAll"
        >
          <Trash2 class="w-3.5 h-3.5" /> 清空记录
        </button>
      </div>

      <!-- 统计指标网格 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
            <Flame class="w-6 h-6" />
          </div>
          <div>
            <div class="text-xs text-[var(--theme-text-secondary)]">累计播放曲目</div>
            <div class="text-2xl font-bold text-[var(--theme-text-primary)] mt-0.5 font-mono">{{ stats.totalPlayCount }} <span class="text-xs font-normal text-[var(--theme-text-muted)]">次</span></div>
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 dark:text-teal-400 shrink-0">
            <Clock class="w-6 h-6" />
          </div>
          <div>
            <div class="text-xs text-[var(--theme-text-secondary)]">累计专注聆听</div>
            <div class="text-2xl font-bold text-[var(--theme-text-primary)] mt-0.5 font-mono">{{ formatHours(stats.totalDurationSeconds) }}</div>
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
            <User class="w-6 h-6" />
          </div>
          <div class="truncate">
            <div class="text-xs text-[var(--theme-text-secondary)]">最常听的歌手</div>
            <div class="text-base font-bold text-[var(--theme-text-primary)] mt-0.5 truncate">
              {{ topArtists[0]?.name || '暂无数据' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 24小时听歌时段活跃度分布 -->
    <div class="glass-card p-5 rounded-2xl">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
          <Clock class="w-4 h-4 text-[var(--theme-accent)]" /> 24 小时聆听时段分布
        </h2>
        <span class="text-xs text-[var(--theme-text-muted)] font-mono">0:00 - 23:00 活跃热度</span>
      </div>
      <div class="h-20 flex items-end gap-1 sm:gap-1.5 pt-4">
        <div
          v-for="(val, h) in hourlyDistribution"
          :key="h"
          class="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
        >
          <div
            class="w-full rounded-t-sm transition-all duration-300"
            :class="val > 0 ? 'bg-gradient-to-t from-[var(--theme-accent)]/50 to-[var(--theme-accent-secondary)]' : 'bg-black/5 dark:bg-neutral-800/40'"
            :style="{ height: `${Math.max(8, (val / Math.max(1, ...hourlyDistribution)) * 100)}%` }"
          ></div>
          <span class="text-[9px] text-[var(--theme-text-muted)] font-mono scale-90">{{ h % 4 === 0 ? `${h}h` : '' }}</span>
          <!-- 悬停 Tooltip -->
          <div class="absolute -top-7 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-neutral-900 border border-neutral-700 text-[10px] text-white px-1.5 py-0.5 rounded font-mono z-10 whitespace-nowrap preserve-contrast" data-preserve-theme="dark">
            {{ h }}:00 - {{ val }}次
          </div>
        </div>
      </div>
    </div>

    <!-- 常听歌手榜 TOP -->
    <div v-if="topArtists.length">
      <h2 class="text-lg font-semibold text-[var(--theme-text-primary)] mb-3 flex items-center gap-2">
        <User class="w-4 h-4 text-[var(--theme-accent)]" /> 常听歌手 TOP 榜
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div
          v-for="(item, idx) in topArtists"
          :key="item.name"
          class="glass-card p-3.5 rounded-2xl text-center"
        >
          <div class="text-xs font-mono font-bold text-[var(--theme-accent)] mb-1">#{{ idx + 1 }}</div>
          <div class="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{{ item.name }}</div>
          <div class="text-xs text-[var(--theme-text-secondary)] mt-0.5 font-mono">{{ item.count }} 次聆听</div>
        </div>
      </div>
    </div>

    <!-- 最近播放时间轴历史 -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
          <Clock class="w-4 h-4 text-[var(--theme-accent)]" /> 最近播放历史 ({{ stats.history.length }})
        </h2>
        <button
          v-if="stats.history.length"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--theme-accent)] hover:opacity-90 text-neutral-950 font-semibold text-xs transition cursor-pointer"
          @click="playAllHistory"
        >
          <Play class="w-3.5 h-3.5 fill-current" /> 重新播放全部
        </button>
      </div>

      <div v-if="stats.history.length" class="space-y-1">
        <div
          v-for="(item, idx) in stats.history"
          :key="item.id + idx"
          class="relative group"
        >
          <TrackRow
            :track="item.track"
            :index="idx"
            :is-active="playerStore.currentTrack?.id === item.track.id"
            :is-playing="playerStore.isPlaying"
            @play="playerStore.playTrack(item.track, stats.history.map(h => h.track))"
          />
          <div class="absolute right-24 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-mono pointer-events-none hidden sm:block">
            {{ formatTimeAgo(item.playedAt) }}
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 text-neutral-500 text-sm">
        还没有播放记录，去媒体库挑一首喜欢的歌吧
      </div>
    </div>
  </div>
</template>
