import type { LyricLine } from '../api/types'

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
}
