import { isMobileDevice } from './desktop'

/**
 * 专业 10 段图形均衡器频点定义 (Hz)
 */
export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

export const EQ_PRESETS: Record<string, number[]> = {
  default: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  pop: [-1.5, -1, 0, 2, 4, 3, 1, 0, -1, -2],
  rock: [4, 3, 2, 0, -1, -1, 1, 3, 4, 4],
  jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  classical: [4, 3, 2, 2, -1, -1, 0, 2, 3, 4],
  bass: [6, 5, 4, 2, 1, 0, 0, 0, 0, 0],
  vocal: [-2, -2, -1, 1, 3, 4, 3, 1, 0, -1],
  treble: [-3, -2, -1, 0, 1, 2, 4, 5, 6, 7],
}

export class AudioPlayerService {
  private audio: HTMLAudioElement
  private preloadAudio: HTMLAudioElement // 后台预加载专有音频对象 (无缝切歌)
  private audioCtx?: AudioContext
  private sourceNode?: MediaElementAudioSourceNode
  private eqFilters: BiquadFilterNode[] = []
  private gainNode?: GainNode
  private analyserNode?: AnalyserNode
  private isConnectedToWebAudio = false

  private get isMobile(): boolean {
    return isMobileDevice() || (typeof window !== 'undefined' && Boolean((window as any).AndroidMediaBridge))
  }

  // 交叉淡入淡出定时器
  private fadeInterval?: any
  // 移动端/安卓端不显示软件音量滑块，直接拉满至 1.0 (100% 最大音量输出)，由物理按键/车载音响独立控制系统音量
  private currentVolume = (isMobileDevice() || (typeof window !== 'undefined' && Boolean((window as any).AndroidMediaBridge))) ? 1.0 : 0.8
  private crossfadeDuration = 1.5
  private isDucked = false
  private preDuckVolume = (isMobileDevice() || (typeof window !== 'undefined' && Boolean((window as any).AndroidMediaBridge))) ? 1.0 : 0.8

  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void
  private onEndedCallback?: () => void
  private onErrorCallback?: (err: any) => void
  private onStatusChangeCallback?: (isPlaying: boolean) => void

  constructor() {
    this.audio = new Audio()
    if (!this.isMobile) {
      this.audio.crossOrigin = 'anonymous'
    }
    this.audio.volume = this.currentVolume
    this.audio.preload = 'auto'

    this.preloadAudio = new Audio()
    if (!this.isMobile) {
      this.preloadAudio.crossOrigin = 'anonymous'
      this.preloadAudio.preload = 'auto'
      this.preloadAudio.volume = this.currentVolume
    }
    this.initListeners()
  }

  private async tryInitAudioContext() {
    // 移动端/车载模式直通底层播放，避免后台切歌因浏览器 WebAudio 策略被静音挂起
    if (this.isMobile || this.isConnectedToWebAudio) return

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      this.audioCtx = new AudioCtx()
      this.gainNode = this.audioCtx.createGain()
      this.analyserNode = this.audioCtx.createAnalyser()
      this.analyserNode.fftSize = 256
      this.analyserNode.smoothingTimeConstant = 0.82
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio)

      let prevNode: AudioNode = this.sourceNode
      this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter()
        if (index === 0) {
          filter.type = 'lowshelf'
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf'
        } else {
          filter.type = 'peaking'
          filter.Q.value = 1.4
        }
        filter.frequency.value = freq
        filter.gain.value = 0

        prevNode.connect(filter)
        prevNode = filter
        return filter
      })

      prevNode.connect(this.analyserNode)
      this.analyserNode.connect(this.gainNode)
      this.gainNode.connect(this.audioCtx.destination)
      this.isConnectedToWebAudio = true
    } catch (e) {
      console.warn('[AudioPlayer] Web Audio 节点连接失败，安全降级为原生播放:', e)
      this.isConnectedToWebAudio = false
    }
  }

  getByteFrequencyData(): Uint8Array | null {
    if (!this.analyserNode) return null
    const buffer = new Uint8Array(this.analyserNode.frequencyBinCount)
    this.analyserNode.getByteFrequencyData(buffer)
    return buffer
  }

  async setEQGains(gains: number[]) {
    await this.tryInitAudioContext()
    if (!this.isConnectedToWebAudio || !this.eqFilters.length) {
      return
    }

    gains.forEach((gain, idx) => {
      if (this.eqFilters[idx]) {
        this.eqFilters[idx].gain.value = Math.max(-12, Math.min(12, gain))
      }
    })
  }

  setCrossfadeDuration(sec: number) {
    this.crossfadeDuration = Math.max(0, Math.min(5, sec))
  }

  private clearFade() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
      this.fadeInterval = undefined
    }
  }

  fadeOut(durationMs = 800): Promise<void> {
    this.clearFade()
    // 移动端跳过淡出，防止后台切歌时音量置 0 无法恢复
    if (this.isMobile || durationMs <= 0 || this.audio.paused) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const startVolume = this.audio.volume
      const steps = 16
      const stepTime = durationMs / steps
      const volDelta = startVolume / steps

      this.fadeInterval = setInterval(() => {
        if (this.audio.volume - volDelta > 0.05) {
          this.audio.volume = Math.max(0, this.audio.volume - volDelta)
        } else {
          this.audio.volume = 0
          this.clearFade()
          resolve()
        }
      }, stepTime)
    })
  }

  fadeIn(targetVolume = this.currentVolume, durationMs = 800) {
    this.clearFade()
    // 移动端直通最大音量，避免锁屏/切后台时因浏览器 JS 定时器挂起导致音量卡死在 0
    if (this.isMobile || durationMs <= 0) {
      this.audio.volume = this.isMobile ? 1.0 : targetVolume
      return
    }

    this.audio.volume = 0
    const steps = 16
    const stepTime = durationMs / steps
    const volDelta = targetVolume / steps

    this.fadeInterval = setInterval(() => {
      if (this.audio.volume + volDelta < targetVolume - 0.02) {
        this.audio.volume = Math.min(targetVolume, this.audio.volume + volDelta)
      } else {
        this.audio.volume = targetVolume
        this.clearFade()
      }
    }, stepTime)
  }

  private initListeners() {
    this.audio.addEventListener('timeupdate', () => {
      const dur = isFinite(this.audio.duration) ? this.audio.duration : 0
      this.onTimeUpdateCallback?.(this.audio.currentTime, dur)
    })

    this.audio.addEventListener('durationchange', () => {
      const dur = isFinite(this.audio.duration) ? this.audio.duration : 0
      if (dur > 0) {
        this.onTimeUpdateCallback?.(this.audio.currentTime, dur)
      }
    })

    this.audio.addEventListener('ended', () => {
      this.onEndedCallback?.()
    })

    this.audio.addEventListener('play', () => {
      this.onStatusChangeCallback?.(true)
    })

    this.audio.addEventListener('pause', () => {
      this.onStatusChangeCallback?.(false)
    })

    this.audio.addEventListener('error', (e) => {
      const code = this.audio.error?.code
      const msg = this.audio.error?.message
      console.error(`[AudioPlayer] 播放失败: code=${code}, message=${msg}, src=${this.audio.src}`, e)

      // 遇到网络瞬断或解码卡顿，延迟 600ms 尝试自动恢复一次
      if (this.audio.src) {
        setTimeout(async () => {
          try {
            console.log('[AudioPlayer] 正在尝试自动恢复播放...')
            await this.audio.play()
          } catch {
            // ignore
          }
        }, 600)
      }

      this.onErrorCallback?.(e)
    })
  }

  setSource(url: string) {
    if (!this.isMobile) {
      this.audio.crossOrigin = 'anonymous'
    } else {
      this.audio.removeAttribute('crossorigin')
      this.audio.volume = 1.0
    }
    this.audio.src = url
  }

  /**
   * 无缝预加载下一首音轨流 (Gapless Preload)
   * 在当前歌曲播放快结束时提前在后台拉取下一首头部数据
   */
  preloadNextTrack(url: string) {
    // 移动端避免同时启动多个 Audio 解码器防止底层硬件资源争用
    if (this.isMobile || !url || this.preloadAudio.src === url) return
    console.log('[AudioPlayer] 正在后台预缓冲下一首音频流:', url)
    this.preloadAudio.src = url
    this.preloadAudio.load()
  }

  async play(withFadeIn = true) {
    if (!this.isMobile) {
      await this.tryInitAudioContext()
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        try {
          await this.audioCtx.resume()
        } catch (e) {
          console.warn('Resume audioCtx failed:', e)
        }
      }
    }

    try {
      if (this.isMobile) {
        this.audio.volume = 1.0
      } else if (withFadeIn && this.crossfadeDuration > 0) {
        this.audio.volume = 0
      } else {
        this.audio.volume = this.currentVolume
      }

      await this.audio.play()

      if (!this.isMobile && withFadeIn && this.crossfadeDuration > 0) {
        this.fadeIn(this.currentVolume, this.crossfadeDuration * 1000)
      }
    } catch (e: any) {
      console.error('[AudioPlayer] 播放异常:', e)
      // 容错降级重试：确保音量拉满并直通播放
      try {
        this.audio.volume = 1.0
        if (this.audio.crossOrigin) {
          this.audio.removeAttribute('crossorigin')
        }
        await this.audio.play()
      } catch (retryErr) {
        console.error('[AudioPlayer] 降级重试依然失败:', retryErr)
      }
    }
  }

  async pause(withFadeOut = true) {
    if (withFadeOut && this.crossfadeDuration > 0 && !this.audio.paused) {
      await this.fadeOut(600)
    }
    this.audio.pause()
  }

  seek(seconds: number) {
    if (Number.isFinite(seconds)) {
      this.audio.currentTime = seconds
    }
  }

  setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol))
    if (!this.isDucked) {
      this.audio.volume = this.currentVolume
    }
  }

  setDucked(ducked: boolean) {
    if (this.isDucked === ducked) return
    this.isDucked = ducked
    if (ducked) {
      this.preDuckVolume = this.currentVolume
      // 导航播报中，压低音乐音量至 20%
      const duckedVol = Math.max(0.05, this.preDuckVolume * 0.2)
      this.audio.volume = duckedVol
    } else {
      // 导航播报结束，恢复原有音乐音量
      this.audio.volume = this.currentVolume
    }
  }

  onTimeUpdate(cb: (currentTime: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb
  }

  onEnded(cb: () => void) {
    this.onEndedCallback = cb
  }

  onError(cb: (err: any) => void) {
    this.onErrorCallback = cb
  }

  onStatusChange(cb: (isPlaying: boolean) => void) {
    this.onStatusChangeCallback = cb
  }
}

export const audioService = new AudioPlayerService()
