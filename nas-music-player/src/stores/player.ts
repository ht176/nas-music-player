import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as navidrome from '@/api/navidrome'
import type { Song } from '@/api/navidrome'

export const usePlayerStore = defineStore('player', () => {
  // 播放状态
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // 当前歌曲
  const currentSong = ref<Song | null>(null)
  const playlist = ref<Song[]>([])
  const currentIndex = ref(-1)
  
  // 播放进度
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.7)
  const isMuted = ref(false)
  
  // 播放模式
  const playMode = ref<'sequence' | 'loop' | 'shuffle'>('sequence')
  
  // Audio 实例
  let audio: HTMLAudioElement | null = null
  
  // 计算属性
  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })
  
  const isFavorite = computed(() => {
    // TODO: 等待 Navidrome API 支持 isFavorite
    return false
  })
  
  // 初始化 Audio
  function initAudio() {
    if (!audio) {
      audio = new Audio()
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)
      audio.volume = volume.value
    }
  }
  
  // 事件处理
  function handleTimeUpdate() {
    if (audio) {
      currentTime.value = audio.currentTime
    }
  }
  
  function handleLoadedMetadata() {
    if (audio) {
      duration.value = audio.duration
      isLoading.value = false
    }
  }
  
  function handleEnded() {
    // 根据播放模式处理
    if (playMode.value === 'loop') {
      play()
    } else {
      next()
    }
  }
  
  function handleError(e: Event) {
    console.error('Audio error:', e)
    error.value = '播放失败，请检查网络或音源'
    isLoading.value = false
    isPlaying.value = false
  }
  
  // 播放控制
  async function playSong(song: Song) {
    initAudio()
    
    if (!audio) return
    
    isLoading.value = true
    error.value = null
    currentSong.value = song
    
    try {
      // 获取流媒体 URL
      const streamUrl = navidrome.getStreamUrl(song.id)
      audio.src = streamUrl
      
      // 添加到播放列表
      const existingIndex = playlist.value.findIndex(s => s.id === song.id)
      if (existingIndex === -1) {
        playlist.value.push(song)
        currentIndex.value = playlist.value.length - 1
      } else {
        currentIndex.value = existingIndex
      }
      
      // 播放
      await audio.play()
      isPlaying.value = true
    } catch (e: any) {
      console.error('Failed to play song:', e)
      error.value = e.message || '播放失败'
      isLoading.value = false
      isPlaying.value = false
    }
  }
  
  function play() {
    if (audio) {
      audio.play()
      isPlaying.value = true
    }
  }
  
  function pause() {
    if (audio) {
      audio.pause()
      isPlaying.value = false
    }
  }
  
  function toggle() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }
  
  function next() {
    if (playlist.value.length === 0) return
    
    let nextIndex: number
    
    if (playMode.value === 'shuffle') {
      // 随机播放
      nextIndex = Math.floor(Math.random() * playlist.value.length)
    } else {
      // 顺序播放
      nextIndex = currentIndex.value + 1
      if (nextIndex >= playlist.value.length) {
        nextIndex = 0 // 循环到第一首
      }
    }
    
    if (playlist.value[nextIndex]) {
      playSong(playlist.value[nextIndex])
    }
  }
  
  function prev() {
    if (playlist.value.length === 0) return
    
    // 如果播放时间超过 3 秒，从头开始
    if (currentTime.value > 3) {
      if (audio) {
        audio.currentTime = 0
      }
      return
    }
    
    let prevIndex = currentIndex.value - 1
    if (prevIndex < 0) {
      prevIndex = playlist.value.length - 1
    }
    
    if (playlist.value[prevIndex]) {
      playSong(playlist.value[prevIndex])
    }
  }
  
  function seek(time: number) {
    if (audio) {
      audio.currentTime = time
      currentTime.value = time
    }
  }
  
  function setVolume(value: number) {
    volume.value = Math.max(0, Math.min(1, value))
    if (audio) {
      audio.volume = volume.value
    }
    isMuted.value = volume.value === 0
  }
  
  function toggleMute() {
    if (audio) {
      isMuted.value = !isMuted.value
      audio.muted = isMuted.value
    }
  }
  
  function setPlayMode(mode: 'sequence' | 'loop' | 'shuffle') {
    playMode.value = mode
  }
  
  function togglePlayMode() {
    const modes: ('sequence' | 'loop' | 'shuffle')[] = ['sequence', 'loop', 'shuffle']
    const currentIndex = modes.indexOf(playMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    playMode.value = modes[nextIndex]
  }
  
  // 收藏功能 - TODO: 等待 Navidrome API 支持
  async function toggleFavorite() {
    console.warn('toggleFavorite not implemented yet')
    // if (!currentSong.value) return
    
    // try {
    //   const success = await navidrome.toggleFavorite(
    //     currentSong.value.id,
    //     currentSong.value.isFavorite || false
    //   )
      
    //   if (success) {
    //     currentSong.value.isFavorite = !currentSong.value.isFavorite
        
    //     // 更新播放列表中的状态
    //     const index = playlist.value.findIndex(s => s.id === currentSong.value!.id)
    //     if (index !== -1) {
    //       playlist.value[index].isFavorite = currentSong.value.isFavorite
    //     }
    //   }
    // } catch (e: any) {
    //   console.error('Failed to toggle favorite:', e)
    //   error.value = e.message
    // }
  }
  
  // 清理
  function dispose() {
    if (audio) {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio = null
    }
  }
  
  return {
    // 状态
    isPlaying,
    isLoading,
    error,
    currentSong,
    playlist,
    currentIndex,
    currentTime,
    duration,
    volume,
    isMuted,
    playMode,
    
    // 计算属性
    progress,
    isFavorite,
    
    // 播放控制
    playSong,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    setPlayMode,
    togglePlayMode,
    toggleFavorite,
    dispose,
  }
})
