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

  // 交叉淡入淡出定时器
  private fadeInterval?: any
  private currentVolume = 0.8
  private crossfadeDuration = 1.5

  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void
  private onEndedCallback?: () => void
  private onErrorCallback?: (err: any) => void
  private onStatusChangeCallback?: (isPlaying: boolean) => void

  constructor() {
    this.audio = new Audio()
    this.preloadAudio = new Audio()
    this.preloadAudio.preload = 'auto'
    this.initListeners()
  }

  private corsChecked = false
  private isCorsSupported = false

  /**
   * 异步检测当前正在播放的音频流是否具备合法 CORS 跨域响应头
   */
  private async checkCorsSupport(): Promise<boolean> {
    if (!this.audio.src) return false
    try {
      const res = await fetch(this.audio.src, { method: 'HEAD', mode: 'cors' })
      return res.ok && !!res.headers.get('access-control-allow-origin')
    } catch {
      return false
    }
  }

  private async tryInitAudioContext() {
    if (this.isConnectedToWebAudio) return

    // 如果尚未完成 CORS 跨域检测，先进行快速探测
    if (!this.corsChecked) {
      this.isCorsSupported = await this.checkCorsSupport()
      this.corsChecked = true
    }

    if (!this.isCorsSupported) {
      console.info('[AudioPlayer] NAS 服务端音频流未下发 CORS 跨域头，为保障播放无静音，使用浏览器原生高保真引擎直推播放')
      this.isConnectedToWebAudio = false
      return
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      this.audio.crossOrigin = 'anonymous'
      this.audioCtx = new AudioCtx()
      this.gainNode = this.audioCtx.createGain()
      this.analyserNode = this.audioCtx.createAnalyser()
      this.analyserNode.fftSize = 64
      this.analyserNode.smoothingTimeConstant = 0.8
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
    if (durationMs <= 0 || this.audio.paused) {
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
    if (durationMs <= 0) {
      this.audio.volume = targetVolume
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
      this.onTimeUpdateCallback?.(this.audio.currentTime, this.audio.duration || 0)
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
      this.onErrorCallback?.(e)
    })
  }

  setSource(url: string) {
    this.corsChecked = false
    this.audio.src = url
    this.audio.load()
  }

  /**
   * 无缝预加载下一首音轨流 (Gapless Preload)
   * 在当前歌曲播放快结束时提前在后台拉取下一首头部数据
   */
  preloadNextTrack(url: string) {
    if (!url || this.preloadAudio.src === url) return
    console.log('[AudioPlayer] 正在后台预缓冲下一首音频流:', url)
    this.preloadAudio.src = url
    this.preloadAudio.load()
  }

  async play(withFadeIn = true) {
    await this.tryInitAudioContext()
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume()
      } catch (e) {
        console.warn('Resume audioCtx failed:', e)
      }
    }

    try {
      if (withFadeIn && this.crossfadeDuration > 0) {
        this.audio.volume = 0
      } else {
        this.audio.volume = this.currentVolume
      }

      await this.audio.play()

      if (withFadeIn && this.crossfadeDuration > 0) {
        this.fadeIn(this.currentVolume, this.crossfadeDuration * 1000)
      }
    } catch (e: any) {
      console.error('[AudioPlayer] 播放异常:', e)
      if (this.audio.crossOrigin) {
        console.warn('[AudioPlayer] 检测到可能的 CORS 跨域拦截，正在尝试降级直通播放...')
        this.audio.removeAttribute('crossorigin')
        this.audio.load()
        await this.audio.play()
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
    this.audio.volume = this.currentVolume
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
