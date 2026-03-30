import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAudio } from '../src/composables/useAudio'

// Mock Audio
class MockAudio {
  src = ''
  volume = 1
  currentTime = 0
  duration = 0
  paused = true
  events = new Map<string, Function[]>()

  constructor() {
    this.events = new Map()
  }

  load() {
    // Mock load
  }

  play() {
    this.paused = false
    this.events.get('play')?.forEach(fn => fn())
    return Promise.resolve()
  }

  pause() {
    this.paused = true
    this.events.get('pause')?.forEach(fn => fn())
  }

  addEventListener(event: string, fn: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(fn)
  }

  removeEventListener(event: string, fn: Function) {
    const handlers = this.events.get(event)
    if (handlers) {
      const index = handlers.indexOf(fn)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
}

vi.stubGlobal('Audio', MockAudio)

describe('useAudio', () => {
  let audioHook: ReturnType<typeof useAudio>

  beforeEach(() => {
    audioHook = useAudio()
  })

  describe('初始化', () => {
    it('应该创建正确的初始状态', () => {
      expect(audioHook.state.isPlaying).toBe(false)
      expect(audioHook.state.isLoading).toBe(false)
      expect(audioHook.state.isEnded).toBe(false)
      expect(audioHook.state.currentTime).toBe(0)
      expect(audioHook.state.duration).toBe(0)
      expect(audioHook.state.volume).toBe(1)
      expect(audioHook.state.isMuted).toBe(false)
      expect(audioHook.state.error).toBe(null)
    })

    it('应该接受自定义音量选项', () => {
      const customHook = useAudio({ volume: 0.5 })
      expect(customHook.state.volume).toBe(0.5)
    })
  })

  describe('load', () => {
    it('应该加载音频源', () => {
      const testUrl = 'http://example.com/song.mp3'
      audioHook.load(testUrl)
      
      expect(audioHook.currentSrc.value).toBe(testUrl)
      expect(audioHook.state.error).toBe(null)
      expect(audioHook.state.isEnded).toBe(false)
      expect(audioHook.state.currentTime).toBe(0)
    })
  })

  describe('play', () => {
    it('应该播放音频', async () => {
      audioHook.load('http://example.com/song.mp3')
      const result = await audioHook.play()
      
      expect(result).toBe(true)
      expect(audioHook.state.isPlaying).toBe(true)
      expect(audioHook.state.isEnded).toBe(false)
    })

    it('应该清除错误状态', async () => {
      audioHook.state.error = '之前的错误'
      await audioHook.play()
      expect(audioHook.state.error).toBe(null)
    })
  })

  describe('pause', () => {
    it('应该暂停音频', () => {
      audioHook.pause()
      expect(audioHook.state.isPlaying).toBe(false)
    })
  })

  describe('toggle', () => {
    it('应该在播放时暂停', () => {
      audioHook.state.isPlaying = true
      audioHook.toggle()
      expect(audioHook.state.isPlaying).toBe(false)
    })

    it('应该在暂停时播放', async () => {
      audioHook.state.isPlaying = false
      await audioHook.toggle()
      expect(audioHook.state.isPlaying).toBe(true)
    })
  })

  describe('seek', () => {
    it('应该跳转到指定时间', () => {
      audioHook.state.duration = 100
      audioHook.seek(50)
      expect(audioHook.audio.currentTime).toBe(50)
    })

    it('应该限制时间在有效范围内', () => {
      audioHook.state.duration = 100
      audioHook.seek(-10)
      expect(audioHook.audio.currentTime).toBe(0)
      
      audioHook.seek(150)
      expect(audioHook.audio.currentTime).toBe(100)
    })
  })

  describe('setVolume', () => {
    it('应该设置音量', () => {
      audioHook.setVolume(0.5)
      expect(audioHook.state.volume).toBe(0.5)
      expect(audioHook.audio.volume).toBe(0.5)
    })

    it('应该限制音量在 0-1 范围内', () => {
      audioHook.setVolume(1.5)
      expect(audioHook.state.volume).toBe(1)
      
      audioHook.setVolume(-0.5)
      expect(audioHook.state.volume).toBe(0)
    })

    it('应该更新静音状态', () => {
      audioHook.setVolume(0)
      expect(audioHook.state.isMuted).toBe(true)
      
      audioHook.setVolume(0.5)
      expect(audioHook.state.isMuted).toBe(false)
    })
  })

  describe('toggleMute', () => {
    it('应该切换静音状态', () => {
      audioHook.state.volume = 0.5
      audioHook.toggleMute()
      expect(audioHook.state.isMuted).toBe(true)
      expect(audioHook.audio.volume).toBe(0)
      
      audioHook.toggleMute()
      expect(audioHook.state.isMuted).toBe(false)
      expect(audioHook.state.volume).toBe(0.5)
    })
  })

  describe('reset', () => {
    it('应该重置所有状态', () => {
      audioHook.load('http://example.com/song.mp3')
      audioHook.state.isPlaying = true
      audioHook.state.duration = 100
      audioHook.state.error = '错误'
      
      audioHook.reset()
      
      expect(audioHook.currentSrc.value).toBe('')
      expect(audioHook.state.currentTime).toBe(0)
      expect(audioHook.state.duration).toBe(0)
      expect(audioHook.state.isEnded).toBe(false)
      expect(audioHook.state.error).toBe(null)
    })
  })

  describe('事件处理', () => {
    it('应该处理 timeupdate 事件', () => {
      audioHook.load('http://example.com/song.mp3')
      audioHook.audio.currentTime = 30
      audioHook.audio.events.get('timeupdate')?.[0]()
      
      expect(audioHook.state.currentTime).toBe(30)
    })

    it('应该处理 durationchange 事件', () => {
      audioHook.load('http://example.com/song.mp3')
      audioHook.audio.duration = 200
      audioHook.audio.events.get('durationchange')?.[0]()
      
      expect(audioHook.state.duration).toBe(200)
    })

    it('应该处理 play 事件', () => {
      audioHook.audio.events.get('play')?.[0]()
      expect(audioHook.state.isPlaying).toBe(true)
      expect(audioHook.state.isEnded).toBe(false)
    })

    it('应该处理 pause 事件', () => {
      audioHook.state.isPlaying = true
      audioHook.audio.events.get('pause')?.[0]()
      expect(audioHook.state.isPlaying).toBe(false)
    })

    it('应该处理 ended 事件', () => {
      audioHook.state.isPlaying = true
      audioHook.audio.events.get('ended')?.[0]()
      expect(audioHook.state.isPlaying).toBe(false)
      expect(audioHook.state.isEnded).toBe(true)
    })

    it('应该处理 waiting 事件', () => {
      audioHook.audio.events.get('waiting')?.[0]()
      expect(audioHook.state.isLoading).toBe(true)
    })

    it('应该处理 canplay 事件', () => {
      audioHook.state.isLoading = true
      audioHook.audio.events.get('canplay')?.[0]()
      expect(audioHook.state.isLoading).toBe(false)
    })

    it('应该处理 error 事件', () => {
      audioHook.audio.events.get('error')?.[0]()
      expect(audioHook.state.error).toBe('音频加载失败')
      expect(audioHook.state.isLoading).toBe(false)
      expect(audioHook.state.isPlaying).toBe(false)
    })
  })
})
