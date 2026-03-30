import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as navidrome from '@/api/navidrome'
import type { Song, Album, Artist } from '@/api/navidrome'

export const useNavidromeStore = defineStore('navidrome', () => {
  // 状态
  const connected = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 数据
  const songs = ref<Song[]>([])
  const albums = ref<Album[]>([])
  const artists = ref<Artist[]>([])
  const searchResults = ref<navidrome.SearchResult3 | null>(null)
  const currentSong = ref<Song | null>(null)
  
  // 计算属性
  const isConnected = computed(() => connected.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  
  // 方法
  async function testConnection() {
    loading.value = true
    error.value = null
    
    try {
      await navidrome.ping()
      connected.value = true
      return true
    } catch (e: any) {
      connected.value = false
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }
  
  async function loadSongs(limit = 50) {
    loading.value = true
    error.value = null
    
    try {
      // 尝试获取随机歌曲
      let randomSongs = await navidrome.getRandomSongs(limit)
      
      // 如果 getRandomSongs 返回空，尝试 getNowPlaying（最近播放）
      if (!randomSongs || randomSongs.length === 0) {
        randomSongs = await navidrome.getNowPlaying()
      }
      
      songs.value = randomSongs || []
      return songs.value
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }
  
  async function loadAlbums(type = 'random', limit = 20) {
    loading.value = true
    error.value = null
    
    try {
      const albumList = await navidrome.getAlbumList(type, limit)
      albums.value = albumList
      return albumList
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }
  
  async function loadArtists() {
    loading.value = true
    error.value = null
    
    try {
      const artistList = await navidrome.getArtists()
      artists.value = artistList
      return artistList
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }
  
  async function search(query: string) {
    if (!query.trim()) {
      searchResults.value = null
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const results = await navidrome.search3(query)
      searchResults.value = results
      return results
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }
  
  async function getAlbumDetails(albumId: string) {
    loading.value = true
    error.value = null
    
    try {
      const album = await navidrome.getAlbum(albumId)
      return album
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }
  
  function setCurrentSong(song: Song | null) {
    currentSong.value = song
  }
  
  function getStreamUrl(songId: string) {
    return navidrome.getStreamUrl(songId)
  }
  
  function getCoverArtUrl(coverArtId: string) {
    return navidrome.getCoverArtUrl(coverArtId)
  }
  
  async function toggleFavorite(songId: string, isFavorite: boolean) {
    try {
      if (isFavorite) {
        await navidrome.unstar(songId)
      } else {
        await navidrome.star(songId)
      }
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    }
  }
  
  // 重置状态
  function reset() {
    connected.value = false
    loading.value = false
    error.value = null
    songs.value = []
    albums.value = []
    artists.value = []
    searchResults.value = null
    currentSong.value = null
  }
  
  return {
    // 状态
    connected,
    loading,
    error,
    songs,
    albums,
    artists,
    searchResults,
    currentSong,
    
    // 计算属性
    isConnected,
    isLoading,
    hasError,
    
    // 方法
    testConnection,
    loadSongs,
    loadAlbums,
    loadArtists,
    search,
    getAlbumDetails,
    setCurrentSong,
    getStreamUrl,
    getCoverArtUrl,
    toggleFavorite,
    reset,
  }
})
