import { ref, reactive, onUnmounted } from 'vue'

export interface UseAudioOptions {
  volume?: number
  autoplay?: boolean
}

export interface AudioState {
  isPlaying: boolean
  isLoading: boolean
  isEnded: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  error: string | null
}

/**
 * 音频播放 composable
 * 提供基础的 HTML5 Audio 播放控制
 */
export function useAudio(options: UseAudioOptions = {}) {
  const { volume = 1, autoplay = false } = options

  // 创建 Audio 实例
  const audio = new Audio()
  audio.volume = volume

  // 状态
  const state = reactive<AudioState>({
    isPlaying: false,
    isLoading: false,
    isEnded: false,
    currentTime: 0,
    duration: 0,
    volume,
    isMuted: false,
    error: null,
  })

  // 当前播放 URL
  const currentSrc = ref<string>('')

  // 事件处理
  function onTimeUpdate() {
    state.currentTime = audio.currentTime
  }

  function onDurationChange() {
    state.duration = audio.duration
  }

  function onPlay() {
    state.isPlaying = true
    state.isEnded = false
  }

  function onPause() {
    state.isPlaying = false
  }

  function onEnded() {
    state.isPlaying = false
    state.isEnded = true
  }

  function onWaiting() {
    state.isLoading = true
  }

  function onCanPlay() {
    state.isLoading = false
  }

  function onError() {
    state.error = '音频加载失败'
    state.isLoading = false
    state.isPlaying = false
  }

  // 注册事件监听
  audio.addEventListener('timeupdate', onTimeUpdate)
  audio.addEventListener('durationchange', onDurationChange)
  audio.addEventListener('play', onPlay)
  audio.addEventListener('pause', onPause)
  audio.addEventListener('ended', onEnded)
  audio.addEventListener('waiting', onWaiting)
  audio.addEventListener('canplay', onCanPlay)
  audio.addEventListener('error', onError)

  // 加载音频
  function load(src: string) {
    state.error = null
    state.isEnded = false
    state.currentTime = 0
    currentSrc.value = src
    audio.src = src
    audio.load()

    if (autoplay) {
      play()
    }
  }

  // 播放
  async function play() {
    try {
      state.error = null
      await audio.play()
      return true
    } catch (e: any) {
      state.error = e.message || '播放失败'
      return false
    }
  }

  // 暂停
  function pause() {
    audio.pause()
  }

  // 切换播放/暂停
  function toggle() {
    if (state.isPlaying) {
      pause()
    } else {
      play()
    }
  }

  // 跳转到指定时间
  function seek(time: number) {
    audio.currentTime = Math.max(0, Math.min(time, state.duration))
  }

  // 设置音量
  function setVolume(value: number) {
    const normalized = Math.max(0, Math.min(1, value))
    audio.volume = normalized
    state.volume = normalized
    state.isMuted = normalized === 0
  }

  // 切换静音
  function toggleMute() {
    if (state.isMuted) {
      setVolume(state.volume || 1)
    } else {
      audio.volume = 0
      state.isMuted = true
    }
  }

  // 重置
  function reset() {
    pause()
    audio.src = ''
    currentSrc.value = ''
    state.currentTime = 0
    state.duration = 0
    state.isEnded = false
    state.error = null
  }

  // 清理
  onUnmounted(() => {
    audio.removeEventListener('timeupdate', onTimeUpdate)
    audio.removeEventListener('durationchange', onDurationChange)
    audio.removeEventListener('play', onPlay)
    audio.removeEventListener('pause', onPause)
    audio.removeEventListener('ended', onEnded)
    audio.removeEventListener('waiting', onWaiting)
    audio.removeEventListener('canplay', onCanPlay)
    audio.removeEventListener('error', onError)
    reset()
  })

  return {
    // 状态
    state,
    currentSrc,

    // 方法
    load,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    toggleMute,
    reset,

    // 直接访问 Audio 对象（高级用法）
    audio,
  }
}

export default useAudio
