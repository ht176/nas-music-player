import { describe, it, expect } from 'vitest'
import { parseLRC, formatTimeToLRC, toLRC } from '../src/utils/lyrics-parser'

describe('LRC 歌词解析器', () => {
  describe('parseLRC', () => {
    it('应该解析简单的 LRC 歌词', () => {
      const lrc = `[00:00.00] 第一句
[00:05.50] 第二句
[00:10.00] 第三句`

      const result = parseLRC(lrc)

      expect(result).toHaveLength(3)
      expect(result[0].time).toBe(0)
      expect(result[0].text).toBe('第一句')
      expect(result[1].time).toBe(5.5)
      expect(result[1].text).toBe('第二句')
      expect(result[2].time).toBe(10)
      expect(result[2].text).toBe('第三句')
    })

    it('应该解析带毫秒的 LRC 歌词', () => {
      const lrc = `[00:00.12] 第一句
[00:05.345] 第二句`

      const result = parseLRC(lrc)

      expect(result).toHaveLength(2)
      expect(result[0].time).toBeCloseTo(0.12, 2)
      expect(result[1].time).toBeCloseTo(5.345, 2)
    })

    it('应该处理同一行多个时间戳', () => {
      const lrc = `[00:00.00][00:05.00] 重复句`

      const result = parseLRC(lrc)

      expect(result).toHaveLength(2)
      expect(result[0].time).toBe(0)
      expect(result[1].time).toBe(5)
      expect(result[0].text).toBe('重复句')
      expect(result[1].text).toBe('重复句')
    })

    it('应该解析元数据标签', () => {
      const lrc = `[ti:歌曲标题]
[ar:艺术家]
[al:专辑]
[00:00.00] 歌词`

      // 注意：当前实现不返回元数据，只解析歌词
      const result = parseLRC(lrc)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('歌词')
    })

    it('空输入应该返回空数组', () => {
      expect(parseLRC('')).toEqual([])
      expect(parseLRC(null as any)).toEqual([])
      expect(parseLRC(undefined as any)).toEqual([])
    })

    it('应该跳过空行', () => {
      const lrc = `[00:00.00] 第一句

[00:05.00] 第二句`

      const result = parseLRC(lrc)
      expect(result).toHaveLength(2)
    })

    it('应该按时间排序', () => {
      const lrc = `[00:10.00] 第三句
[00:00.00] 第一句
[00:05.00] 第二句`

      const result = parseLRC(lrc)

      expect(result[0].text).toBe('第一句')
      expect(result[1].text).toBe('第二句')
      expect(result[2].text).toBe('第三句')
    })
  })

  describe('formatTimeToLRC', () => {
    it('应该格式化时间为 LRC 格式', () => {
      expect(formatTimeToLRC(0)).toBe('[00:00.00]')
      expect(formatTimeToLRC(65.5)).toBe('[01:05.50]')
      expect(formatTimeToLRC(125.75)).toBe('[02:05.75]')
    })

    it('应该处理个位数分钟和秒', () => {
      expect(formatTimeToLRC(5.5)).toBe('[00:05.50]')
    })
  })

  describe('toLRC', () => {
    it('应该将歌词数组转换为 LRC 格式', () => {
      const lyrics = [
        { time: 0, text: '第一句' },
        { time: 5.5, text: '第二句' },
        { time: 10, text: '第三句' },
      ]

      const result = toLRC(lyrics)

      expect(result).toContain('[00:00.00]第一句')
      expect(result).toContain('[00:05.50]第二句')
      expect(result).toContain('[00:10.00]第三句')
    })

    it('应该添加元数据标签', () => {
      const lyrics = [
        { time: 0, text: '歌词' },
      ]

      const metaTags = {
        ti: '歌曲标题',
        ar: '艺术家',
      }

      const result = toLRC(lyrics, metaTags)

      expect(result).toContain('[ti:歌曲标题]')
      expect(result).toContain('[ar:艺术家]')
      expect(result).toContain('[00:00.00]歌词')
    })
  })
})
