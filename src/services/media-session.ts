import type { Track } from '../api/types'

export class MediaSessionService {
  private static currentDuration = 0
  private static currentPosition = 0

  /**
   * 更新当前播放曲目的多媒体元数据（用于车载蓝牙屏幕、手机锁屏、通知中心与桌面系统）
   */
  static updateMetadata(track: Track, coverUrl: string) {
    this.currentDuration = track.duration || 0

    const absoluteCoverUrl = coverUrl
      ? coverUrl.startsWith('http')
        ? coverUrl
        : window.location.origin + (coverUrl.startsWith('/') ? '' : '/') + coverUrl
      : ''

    // 1. 标准 Web MediaSession API (桌面端 / Chrome / PWA)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album,
          artwork: absoluteCoverUrl
            ? [
                { src: absoluteCoverUrl, sizes: '96x96', type: 'image/jpeg' },
                { src: absoluteCoverUrl, sizes: '128x128', type: 'image/jpeg' },
                { src: absoluteCoverUrl, sizes: '256x256', type: 'image/jpeg' },
                { src: absoluteCoverUrl, sizes: '512x512', type: 'image/jpeg' },
              ]
            : [],
        })
      } catch (e) {
        console.warn('[MediaSession] metadata update error:', e)
      }
    }

    // 2. 安卓原生 MediaSession 桥接 (专供车载蓝牙 AVRCP 协议传输歌名、歌手、专辑与封面)
    const bridge = (window as any).AndroidMediaBridge
    if (bridge && typeof bridge.updateMetadata === 'function') {
      try {
        bridge.updateMetadata(
          track.title || '',
          track.artist || '',
          track.album || '',
          track.duration || 0,
          absoluteCoverUrl,
          ''
        )
      } catch (e) {
        console.warn('[MediaSession] Android bridge updateMetadata error:', e)
      }
    }
  }

  /**
   * 更新播放状态 (playing / paused)
   */
  static setPlaybackState(isPlaying: boolean, positionSec = 0) {
    this.currentPosition = positionSec

    // 1. 标准 Web MediaSession
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
      } catch (e) {
        // ignore
      }
    }

    // 2. 安卓原生 MediaSession 桥接
    const bridge = (window as any).AndroidMediaBridge
    if (bridge && typeof bridge.setPlaybackState === 'function') {
      try {
        bridge.setPlaybackState(isPlaying, positionSec)
      } catch (e) {
        console.warn('[MediaSession] Android bridge setPlaybackState error:', e)
      }
    }
  }

  /**
   * 刷新时间轴进度状态
   */
  static setPositionState(durationSec: number, positionSec: number) {
    this.currentDuration = durationSec
    this.currentPosition = positionSec

    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        if (Number.isFinite(durationSec) && durationSec > 0 && Number.isFinite(positionSec)) {
          navigator.mediaSession.setPositionState({
            duration: durationSec,
            playbackRate: 1,
            position: Math.min(positionSec, durationSec),
          })
        }
      } catch (e) {
        // ignore invalid state range
      }
    }
  }

  /**
   * 实时推送当前歌词至车载大屏与系统锁屏
   */
  static updateLyric(lyric: string) {
    const bridge = (window as any).AndroidMediaBridge
    if (bridge && typeof bridge.updateLyric === 'function') {
      try {
        bridge.updateLyric(lyric)
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * 初始化车载方向盘硬件按键、蓝牙耳机按键、系统通知中心控制与音频焦点管理
   */
  static initGlobalBridge(handlers: {
    play: () => void
    pause: () => void
    toggle: () => void
    next: () => void
    prev: () => void
    seek: (seconds: number) => void
    duck: (isDucked: boolean) => void
  }) {
    // 注入供安卓原生代码调用的全局事件分发函数
    ;(window as any).__AURA_ON_MEDIA_ACTION__ = (action: string) => {
      console.log('[MediaSession] Received native media action:', action)
      switch (action) {
        case 'play':
          handlers.play()
          break
        case 'pause':
          handlers.pause()
          break
        case 'toggle':
          handlers.toggle()
          break
        case 'next':
          handlers.next()
          break
        case 'prev':
          handlers.prev()
          break
      }
    }

    ;(window as any).__AURA_ON_SEEK_TO__ = (positionMs: number) => {
      if (typeof positionMs === 'number' && positionMs >= 0) {
        handlers.seek(positionMs / 1000)
      }
    }

    ;(window as any).__AURA_ON_DUCK__ = (isDucked: boolean) => {
      console.log('[MediaSession] Received audio ducking command:', isDucked)
      handlers.duck(Boolean(isDucked))
    }

    // 绑定标准 Web MediaSession action handlers (车载方向盘按键、桌面多媒体键盘按键、蓝牙耳机按键)
    if ('mediaSession' in navigator) {
      const actions: [MediaSessionAction, () => void][] = [
        ['play', handlers.play],
        ['pause', handlers.pause],
        ['previoustrack', handlers.prev],
        ['nexttrack', handlers.next],
        ['stop', handlers.pause],
      ]

      for (const [action, handler] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, handler)
        } catch (e) {
          // ignore unsupported actions
        }
      }

      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            handlers.seek(details.seekTime)
          }
        })
      } catch (e) {
        // ignore
      }

      try {
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const offset = details.seekOffset || 10
          handlers.seek(Math.min(this.currentDuration, this.currentPosition + offset))
        })
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const offset = details.seekOffset || 10
          handlers.seek(Math.max(0, this.currentPosition - offset))
        })
      } catch (e) {
        // ignore
      }
    }
  }
}
