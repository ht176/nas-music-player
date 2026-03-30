/**
 * LRC 歌词解析器
 * 将 LRC 格式歌词解析为结构化数据
 */

export interface ParsedLyricsLine {
  time: number // 秒
  text: string
  translation?: string
}

/**
 * 解析 LRC 歌词
 * @param lrcText LRC 格式的歌词文本
 * @returns 解析后的歌词数组
 */
export function parseLRC(lrcText: string): ParsedLyricsLine[] {
  if (!lrcText || typeof lrcText !== 'string') {
    return []
  }

  const lines = lrcText.split(/\r?\n/)
  const lyrics: ParsedLyricsLine[] = []
  const metaTags: Record<string, string> = {}

  // 匹配时间标签的正则表达式 [mm:ss.xx]
  const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g

  for (const line of lines) {
    // 跳过空行
    if (!line.trim()) continue

    // 解析元数据标签 (如 [ti:标题])
    const metaMatch = line.match(/^\[(\w+):(.*)\]$/)
    if (metaMatch) {
      const [, key, value] = metaMatch
      metaTags[key.toLowerCase()] = value.trim()
      continue
    }

    // 解析带时间戳的歌词
    const matches = Array.from(line.matchAll(timeReg))
    if (matches.length === 0) continue

    // 提取歌词文本（移除所有时间标签）
    const text = line.replace(timeReg, '').trim()
    if (!text) continue

    // 为每个时间戳创建一行歌词（支持同一行多个时间戳）
    for (const match of matches) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0
      
      const time = minutes * 60 + seconds + milliseconds / 1000

      lyrics.push({
        time,
        text,
      })
    }
  }

  // 按时间排序
  lyrics.sort((a, b) => a.time - b.time)

  return lyrics
}

/**
 * 格式化时间为 LRC 格式
 * @param seconds 秒数
 * @returns LRC 格式的时间字符串 [mm:ss.xx]
 */
export function formatTimeToLRC(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  
  return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]`
}

/**
 * 将歌词数组转换为 LRC 格式
 * @param lyrics 解析后的歌词数组
 * @param metaTags 元数据标签
 * @returns LRC 格式的歌词文本
 */
export function toLRC(lyrics: ParsedLyricsLine[], metaTags: Record<string, string> = {}): string {
  const lines: string[] = []

  // 添加元数据
  for (const [key, value] of Object.entries(metaTags)) {
    lines.push(`[${key}:${value}]`)
  }

  // 添加歌词
  for (const line of lyrics) {
    const timeTag = formatTimeToLRC(line.time)
    lines.push(`${timeTag}${line.text}`)
  }

  return lines.join('\n')
}

export default {
  parseLRC,
  formatTimeToLRC,
  toLRC,
}
