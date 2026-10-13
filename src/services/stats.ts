import type { Track } from '../api/types'

const STATS_KEY = 'nas_music_history_stats'

export interface PlayHistoryItem {
  id: string
  track: Track
  playedAt: number
  playCount: number
}

export interface UserStats {
  totalPlayCount: number
  totalDurationSeconds: number
  history: PlayHistoryItem[]
}

class StatsService {
  private stats: UserStats

  constructor() {
    this.stats = this.loadStats()
  }

  private loadStats(): UserStats {
    try {
      const raw = localStorage.getItem(STATS_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.warn('读取听歌历史统计失败', e)
    }
    return {
      totalPlayCount: 0,
      totalDurationSeconds: 0,
      history: [],
    }
  }

  private saveStats() {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(this.stats))
    } catch (e) {
      console.warn('保存听歌历史统计失败', e)
    }
  }

  /**
   * 记录一首歌曲播放
   */
  recordPlay(track: Track) {
    this.stats.totalPlayCount++
    this.stats.totalDurationSeconds += track.duration || 180

    const existingIdx = this.stats.history.findIndex((h) => h.track.id === track.id)
    if (existingIdx >= 0) {
      const existing = this.stats.history[existingIdx]
      existing.playedAt = Date.now()
      existing.playCount++
      // 提到最前
      this.stats.history.splice(existingIdx, 1)
      this.stats.history.unshift(existing)
    } else {
      this.stats.history.unshift({
        id: track.id,
        track,
        playedAt: Date.now(),
        playCount: 1,
      })
    }

    // 最多保留 100 首历史记录
    if (this.stats.history.length > 100) {
      this.stats.history.pop()
    }

    this.saveStats()
  }

  getStats(): UserStats {
    return this.stats
  }

  getTopArtists(limit = 5): { name: string; count: number }[] {
    const artistMap: Record<string, number> = {}
    for (const item of this.stats.history) {
      const artist = item.track.artist || '未知'
      artistMap[artist] = (artistMap[artist] || 0) + item.playCount
    }
    return Object.entries(artistMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * 24 小时活跃时间段分布 (0-23点)
   */
  getHourlyDistribution(): number[] {
    const hours = new Array(24).fill(0)
    for (const item of this.stats.history) {
      const h = new Date(item.playedAt).getHours()
      hours[h] += item.playCount
    }
    return hours
  }

  clearHistory() {
    this.stats = {
      totalPlayCount: 0,
      totalDurationSeconds: 0,
      history: [],
    }
    this.saveStats()
  }
}

export const statsService = new StatsService()
