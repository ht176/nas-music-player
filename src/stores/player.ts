import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { LyricLine, PlayMode, Track } from '../api/types'
import { audioService, EQ_PRESETS } from '../services/audio'
import { cacheService } from '../services/cache'
import { statsService } from '../services/stats'
import { LyricsService } from '../services/lyrics'
import { MediaSessionService } from '../services/media-session'
import { useServerStore } from './server'
import { toastService } from '../services/toast'
import confetti from 'canvas-confetti'

const STORAGE_PLAYER_STATE_KEY = 'aura_music_player_state'

export const usePlayerStore = defineStore('player', () => {
  const serverStore = useServerStore()

  // 读取持久化播放记录
  let savedState: any = null
  try {
    const raw = localStorage.getItem(STORAGE_PLAYER_STATE_KEY)
    if (raw) savedState = JSON.parse(raw)
  } catch (e) {
    // 忽略异常
  }

  const queue = ref<Track[]>(savedState?.queue || [])
  const currentIndex = ref<number>(savedState?.currentIndex ?? -1)
  const isPlaying = ref<boolean>(false)
  const currentTime = ref<number>(savedState?.currentTime || 0)
  const duration = ref<number>(savedState?.duration || 0)
  const volume = ref<number>(savedState?.volume ?? 0.8)
  const playMode = ref<PlayMode>(savedState?.playMode || 'loop')
  const lyrics = ref<LyricLine[]>([])
  const currentLyricIndex = ref<number>(-1)
  const showFullscreen = ref<boolean>(false)
  const showQueueDrawer = ref<boolean>(false)
  const showEQModal = ref<boolean>(false)
  const showMiniPlayer = ref<boolean>(false) // 桌面极简悬浮小窗模式

  // 持久化保存播放状态
  function savePlayerState() {
    try {
      localStorage.setItem(STORAGE_PLAYER_STATE_KEY, JSON.stringify({
        queue: queue.value,
        currentIndex: currentIndex.value,
        currentTime: Math.floor(currentTime.value),
        duration: duration.value,
        volume: volume.value,
        playMode: playMode.value,
      }))
    } catch {
      // 容错
    }
  }

  // 10 段均衡器配置
  const eqPreset = ref<string>(savedState?.eqPreset || 'default')
  const eqGains = ref<number[]>([...(EQ_PRESETS[savedState?.eqPreset || 'default'] || EQ_PRESETS.default)])

  // 睡眠定时器
  const sleepTimerMinutes = ref<number>(0)
  const sleepTimerSecondsLeft = ref<number>(0)
  let sleepInterval: any = null

  const currentTrack = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < queue.value.length) {
      return queue.value[currentIndex.value]
    }
    return null
  })

  // 恢复持久化播放状态
  function initRestoredState() {
    if (currentTrack.value && serverStore.client) {
      const tr = currentTrack.value
      const streamUrl = serverStore.client.getStreamUrl(tr.id, tr.suffix)
      audioService.setSource(streamUrl)
      if (savedState?.currentTime) {
        audioService.seek(savedState.currentTime)
      }
      serverStore.client.getLyrics(tr.id, tr.artist, tr.title).then((res) => {
        lyrics.value = res.lines || []
        if (lyrics.value.length > 0) {
          currentLyricIndex.value = LyricsService.findActiveIndex(lyrics.value, currentTime.value)
        }
      }).catch(() => {})
    }
  }

  // 监听音频生命周期
  audioService.onTimeUpdate((time, dur) => {
    currentTime.value = time
    if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
      duration.value = dur
    } else if ((!duration.value || !isFinite(duration.value) || duration.value <= 0) && currentTrack.value?.duration) {
      duration.value = currentTrack.value.duration
    }
    if (lyrics.value.length) {
      currentLyricIndex.value = LyricsService.findActiveIndex(lyrics.value, time)
    }

    // 每 5 秒轻量持久化一次当前播放进度
    if (Math.floor(time) % 5 === 0) {
      savePlayerState()
    }

    // 接近结束前 15 秒自动在后台预加载缓冲下一首 (Gapless Playback)
    if (dur > 20 && dur - time < 15 && queue.value.length > 1) {
      const nextIdx = (currentIndex.value + 1) % queue.value.length
      const nextTrack = queue.value[nextIdx]
      if (nextTrack && serverStore.client) {
        const nextUrl = serverStore.client.getStreamUrl(nextTrack.id, nextTrack.suffix)
        audioService.preloadNextTrack(nextUrl)
      }
    }

    if (currentTrack.value && time > 240) {
      serverStore.client?.scrobble(currentTrack.value.id, true)
    }
  })

  audioService.onStatusChange((status) => {
    isPlaying.value = status
  })

  audioService.onEnded(() => {
    handleTrackEnded()
  })

  MediaSessionService.setActionHandlers({
    play: () => play(),
    pause: () => pause(),
    previoustrack: () => prev(),
    nexttrack: () => next(),
    seekto: (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime)
      }
    },
  })

  async function loadTrack(track: Track) {
    if (!serverStore.client) {
      console.warn('[PlayerStore] 无法播放，因为 serverStore.client 为空，请先配置连接！')
      return
    }

    // 若当前正在出声，执行快速平滑淡出
    if (isPlaying.value) {
      await audioService.fadeOut(400)
    }

    // 优先读取本地 IndexedDB 离线缓存
    const cachedUrl = await cacheService.getCachedTrackUrl(track.id)
    const streamUrl = cachedUrl || serverStore.client.getStreamUrl(track.id, track.suffix)
    console.log('[PlayerStore] 正在加载音频流:', cachedUrl ? '(离线缓存)' : streamUrl, track.title, `(${track.suffix})`)

    audioService.setSource(streamUrl)
    duration.value = track.duration || 0
    currentTime.value = 0

    const coverUrl = serverStore.client.getCoverArtUrl(track.coverArtId, 300)
    MediaSessionService.updateMetadata(track, coverUrl)
    serverStore.client.scrobble(track.id, false)
    statsService.recordPlay(track) // 记录播放统计与历史

    // 如果当前 track 缺少 path（可能来自旧列表缓存或简化接口），异步补全完整文件属性
    if (!track.path && serverStore.client.getSong) {
      serverStore.client.getSong(track.id).then((fullTrack) => {
        if (currentIndex.value >= 0 && queue.value[currentIndex.value]?.id === track.id) {
          queue.value[currentIndex.value] = { ...queue.value[currentIndex.value], ...fullTrack }
          savePlayerState()
        }
      }).catch(() => {})
    }

    lyrics.value = []
    currentLyricIndex.value = -1

    // 优先读取用户手动覆盖的本地精准歌词
    const overridden = LyricsService.getLyricOverride(track.id)
    if (overridden && overridden.length > 0) {
      lyrics.value = overridden
      currentLyricIndex.value = LyricsService.findActiveIndex(lyrics.value, currentTime.value)
    } else {
      serverStore.client.getLyrics(track.id, track.artist, track.title).then((res) => {
        // 如果在异步返回前用户没有手动换歌词
        if (!LyricsService.getLyricOverride(track.id)) {
          lyrics.value = res.lines || []
          if (lyrics.value.length > 0) {
            currentLyricIndex.value = LyricsService.findActiveIndex(lyrics.value, currentTime.value)
          }
        }
      }).catch((err) => {
        console.warn('[PlayerStore] 获取歌词失败:', err)
      })
    }

    try {
      await play()
    } catch (err) {
      console.error('[PlayerStore] 触发播放失败:', err)
    }
  }

  async function downloadTrack(track: Track) {
    if (!serverStore.client) return
    try {
      const streamUrl = serverStore.client.getStreamUrl(track.id, track.suffix)
      await cacheService.cacheTrack(track, streamUrl)
      toastService.success(`「${track.title}」已成功缓存至离线库`)
    } catch (err) {
      toastService.error(`缓存「${track.title}」失败`)
      throw err
    }
  }

  function playTrack(track: Track, newQueue?: Track[]) {
    if (newQueue) {
      queue.value = [...newQueue]
    } else if (!queue.value.find((t) => t.id === track.id)) {
      queue.value.push(track)
    }

    currentIndex.value = queue.value.findIndex((t) => t.id === track.id)
    savePlayerState()
    loadTrack(track)
  }

  function addToQueue(track: Track) {
    if (!queue.value.find((t) => t.id === track.id)) {
      queue.value.push(track)
      toastService.success(`已添加「${track.title}」至播放队列`)
    } else {
      toastService.info(`「${track.title}」已在播放队列中`)
    }
  }

  function removeFromQueue(index: number) {
    const item = queue.value[index]
    if (index === currentIndex.value) {
      if (queue.value.length <= 1) {
        clearQueue()
        return
      }
      next()
    }
    queue.value.splice(index, 1)
    if (index < currentIndex.value) {
      currentIndex.value--
    }
    if (item) {
      toastService.info(`已从队列移除「${item.title}」`)
    }
  }

  function clearQueue() {
    audioService.pause()
    queue.value = []
    currentIndex.value = -1
    currentTime.value = 0
    duration.value = 0
    isPlaying.value = false
    lyrics.value = []
    currentLyricIndex.value = -1
    toastService.info('已清空当前播放队列')
  }

  async function toggleStar(track: Track) {
    if (!serverStore.client) return
    const newStatus = !track.starred
    track.starred = newStatus
    try {
      if (newStatus) {
        // 收藏成功时触发炫彩爱心粒子爆炸动效
        try {
          confetti({
            particleCount: 42,
            spread: 60,
            origin: { y: 0.88 },
            colors: ['#f43f5e', '#ec4899', '#10b981', '#38bdf8', '#fbbf24'],
            ticks: 180,
            gravity: 1.1,
            scalar: 0.9,
          })
        } catch {
          // 容错降级
        }
        await serverStore.client.star(track.id)
        toastService.success(`已收藏「${track.title}」`)
      } else {
        await serverStore.client.unstar(track.id)
        toastService.info(`已取消收藏「${track.title}」`)
      }
    } catch (e) {
      track.starred = !newStatus
      console.error('Failed to toggle star', e)
      toastService.error('网络同步收藏状态失败')
    }
  }

  // 均衡器设置
  function setEQPreset(presetName: string) {
    if (EQ_PRESETS[presetName]) {
      eqPreset.value = presetName
      eqGains.value = [...EQ_PRESETS[presetName]]
      audioService.setEQGains(eqGains.value)
    }
  }

  function setEQGain(index: number, val: number) {
    eqPreset.value = 'custom'
    eqGains.value[index] = val
    audioService.setEQGains(eqGains.value)
  }

  // 睡眠定时器
  function setSleepTimer(minutes: number) {
    clearInterval(sleepInterval)
    sleepTimerMinutes.value = minutes
    if (minutes <= 0) {
      sleepTimerSecondsLeft.value = 0
      return
    }

    sleepTimerSecondsLeft.value = minutes * 60
    sleepInterval = setInterval(() => {
      sleepTimerSecondsLeft.value--
      if (sleepTimerSecondsLeft.value <= 0) {
        clearInterval(sleepInterval)
        pause()
        sleepTimerMinutes.value = 0
        sleepTimerSecondsLeft.value = 0
      }
    }, 1000)
  }

  async function play() {
    if (!currentTrack.value && queue.value.length > 0) {
      currentIndex.value = 0
      await loadTrack(queue.value[0])
    } else {
      await audioService.play()
    }
  }

  function pause() {
    audioService.pause()
  }

  function togglePlay() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  function next() {
    if (queue.value.length === 0) return

    if (playMode.value === 'random') {
      const nextIdx = Math.floor(Math.random() * queue.value.length)
      currentIndex.value = nextIdx
    } else {
      currentIndex.value = (currentIndex.value + 1) % queue.value.length
    }
    loadTrack(queue.value[currentIndex.value])
  }

  function prev() {
    if (queue.value.length === 0) return

    if (playMode.value === 'random') {
      currentIndex.value = Math.floor(Math.random() * queue.value.length)
    } else {
      currentIndex.value = (currentIndex.value - 1 + queue.value.length) % queue.value.length
    }
    loadTrack(queue.value[currentIndex.value])
  }

  function handleTrackEnded() {
    if (playMode.value === 'single') {
      seek(0)
      play()
    } else {
      next()
    }
  }

  function seek(seconds: number) {
    currentTime.value = seconds
    audioService.seek(seconds)
  }

  function setVolume(val: number) {
    volume.value = val
    audioService.setVolume(val)
  }

  function togglePlayMode() {
    const modes: PlayMode[] = ['loop', 'single', 'random']
    const idx = modes.indexOf(playMode.value)
    playMode.value = modes[(idx + 1) % modes.length]
    savePlayerState()

    const labelMap: Record<PlayMode, string> = {
      loop: '列表循环 🔁',
      single: '单曲循环 🔂',
      random: '随机播放 🔀',
      sequence: '顺序播放 ⏩',
    }
    toastService.info(`已切换播放模式: ${labelMap[playMode.value] || playMode.value}`)
  }

  return {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playMode,
    lyrics,
    currentLyricIndex,
    showFullscreen,
    showQueueDrawer,
    showEQModal,
    showMiniPlayer,
    eqPreset,
    eqGains,
    sleepTimerMinutes,
    sleepTimerSecondsLeft,
    setEQPreset,
    setEQGain,
    setSleepTimer,
    downloadTrack,
    playTrack,
    addToQueue,
    removeFromQueue,
    clearQueue,
    toggleStar,
    play,
    pause,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    togglePlayMode,
    initRestoredState,
    applyCustomLyrics(lines: LyricLine[]) {
      if (!currentTrack.value) return
      LyricsService.saveLyricOverride(currentTrack.value.id, lines)
      lyrics.value = lines
      if (lines.length > 0) {
        currentLyricIndex.value = LyricsService.findActiveIndex(lines, currentTime.value)
      }
    },
    resetTrackLyrics() {
      if (!currentTrack.value || !serverStore.client) return
      LyricsService.removeLyricOverride(currentTrack.value.id)
      serverStore.client.getLyrics(currentTrack.value.id, currentTrack.value.artist, currentTrack.value.title).then((res) => {
        lyrics.value = res.lines || []
        if (lyrics.value.length > 0) {
          currentLyricIndex.value = LyricsService.findActiveIndex(lyrics.value, currentTime.value)
        }
      })
    },
  }
})
