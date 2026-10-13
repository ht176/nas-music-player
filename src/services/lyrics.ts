import type { LyricLine } from '../api/types'

export interface OnlineLyricResult {
  id: number
  trackName: string
  artistName: string
  albumName?: string
  duration?: number
  syncedLyrics?: string
  plainLyrics?: string
}

const LYRIC_OVERRIDE_PREFIX = 'aura_lyric_override_'

export class LyricsService {
  /**
   * 解析标准 LRC 文本为时间戳数组
   */
  static parse(lrcText: string): LyricLine[] {
    if (!lrcText || !lrcText.trim()) return []

    const lines = lrcText.split('\n')
    const result: LyricLine[] = []
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g

    for (const line of lines) {
      const match = timeRegex.exec(line)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0
        const totalSeconds = minutes * 60 + seconds + milliseconds / 1000
        const text = line.replace(timeRegex, '').trim()

        if (text) {
          result.push({ time: totalSeconds, text })
        }
      }
      timeRegex.lastIndex = 0
    }

    return result.sort((a, b) => a.time - b.time)
  }

  /**
   * 二分查找当前播放进度对应的歌词行索引
   */
  static findActiveIndex(lyrics: LyricLine[], currentTime: number): number {
    if (!lyrics.length) return -1
    if (currentTime < lyrics[0].time) return 0

    let low = 0
    let high = lyrics.length - 1
    let best = 0

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (lyrics[mid].time <= currentTime) {
        best = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    return best
  }

  /**
   * 从开源 LRCLIB API 在线检索同步/纯文本歌词
   */
  static async searchOnlineLyrics(keyword: string): Promise<OnlineLyricResult[]> {
    if (!keyword || !keyword.trim()) return []
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(keyword.trim())}`
      const res = await fetch(url)
      if (!res.ok) return []
      const data = await res.json()
      if (!Array.isArray(data)) return []
      return data.map((item: any) => ({
        id: item.id,
        trackName: item.trackName || item.name || '',
        artistName: item.artistName || '',
        albumName: item.albumName || '',
        duration: item.duration,
        syncedLyrics: item.syncedLyrics || '',
        plainLyrics: item.plainLyrics || '',
      })).filter((item: OnlineLyricResult) => item.syncedLyrics || item.plainLyrics)
    } catch (e) {
      console.warn('检索在线歌词失败:', e)
      return []
    }
  }

  /**
   * 保存当前曲目被用户手动替换的自定义歌词
   */
  static saveLyricOverride(trackId: string, lyricLines: LyricLine[]) {
    try {
      localStorage.setItem(`${LYRIC_OVERRIDE_PREFIX}${trackId}`, JSON.stringify(lyricLines))
    } catch (e) {
      console.warn('缓存覆盖歌词失败', e)
    }
  }

  /**
   * 读取当前曲目是否存在用户手动替换的歌词
   */
  static getLyricOverride(trackId: string): LyricLine[] | null {
    try {
      const raw = localStorage.getItem(`${LYRIC_OVERRIDE_PREFIX}${trackId}`)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      // 容错
    }
    return null
  }

  /**
   * 清除用户对某首曲目的歌词替换，恢复服务端默认
   */
  static removeLyricOverride(trackId: string) {
    try {
      localStorage.removeItem(`${LYRIC_OVERRIDE_PREFIX}${trackId}`)
    } catch {}
  }
}
