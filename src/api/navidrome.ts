import md5 from 'crypto-js/md5'

// Navidrome 配置
const API_VERSION = '1.16.1'
const CLIENT_NAME = 'NAS-Music-Player'
const STORAGE_KEY = 'navidrome-config'

// 从 localStorage 获取基础 URL
function getBaseUrl() {
  const config = getConfig()
  return config.url
}

// 从 localStorage 获取配置
function getConfig() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse config:', e)
    }
  }
  
  // 回退到环境变量
  return {
    url: import.meta.env.VITE_NAVIDROME_URL || 'https://music.xiaoyunjia.site:6',
    username: import.meta.env.VITE_NAVIDROME_USERNAME || 'hetong',
    password: import.meta.env.VITE_NAVIDROME_PASSWORD || '',
  }
}

// 生成 Subsonic API 认证参数
function getAuthParams() {
  const config = getConfig()
  const salt = Math.random().toString(36).substring(2, 10)
  const token = md5(`${config.password}${salt}`).toString()
  
  return {
    u: config.username,
    t: token,
    s: salt,
    v: API_VERSION,
    c: CLIENT_NAME,
    f: 'json', // 返回 JSON 格式
  }
}

// 构建 API URL
function buildUrl(endpoint: string, params: Record<string, any> = {}) {
  const config = getConfig()
  const authParams = getAuthParams()
  const queryParams = new URLSearchParams({ ...authParams, ...params })
  return `${config.url}/rest/${endpoint}?${queryParams.toString()}`
}

// 通用请求方法
async function request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  const url = buildUrl(endpoint, params)
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 检查 Subsonic API 错误
    if (data['subsonic-response'].status === 'failed') {
      const error = data['subsonic-response'].error
      throw new Error(`Navidrome error: ${error.message} (code: ${error.code})`)
    }
    
    return data['subsonic-response'] as T
  } catch (error) {
    console.error('Navidrome API request failed:', error)
    throw error
  }
}

// 音乐相关接口
export interface Song {
  id: string
  title: string
  album: string
  artist: string
  albumArtist: string
  duration: number
  track: number
  year: number
  genre: string
  coverArt: string
  path: string
  contentType: string
  suffix: string
  created: string
  albumId: string
  artistId: string
  type: string
  isVideo: boolean
  playCount: number
}

export interface Album {
  id: string
  name: string
  artist: string
  artistId: string
  coverArt: string
  songCount: number
  duration: number
  playCount: number
  created: string
  year: string
  genre: string
  songs?: Song[]
}

export interface Artist {
  id: string
  name: string
  albumCount: number
  coverArt: string
  artistImageUrl: string
}

export interface SearchResult3 {
  song: Song[]
  album: Album[]
  artist: Artist[]
}

// API 方法

/**
 * 测试连接
 */
export async function ping() {
  return request<{ version: string }>('ping')
}

/**
 * 获取歌曲详情
 */
export async function getSong(id: string): Promise<Song> {
  const data = await request<{ song: Song }>('getSong', { id })
  return data.song
}

/**
 * 获取歌曲流媒体 URL
 */
export function getStreamUrl(id: string): string {
  const authParams = getAuthParams()
  const queryParams = new URLSearchParams({ ...authParams })
  return `${getBaseUrl()}/rest/stream?id=${id}&${queryParams.toString()}`
}

/**
 * 获取专辑封面 URL
 */
export function getCoverArtUrl(id: string): string {
  const authParams = getAuthParams()
  const queryParams = new URLSearchParams({ ...authParams })
  return `${getBaseUrl()}/rest/getCoverArt?id=${id}&${queryParams.toString()}`
}

/**
 * 获取专辑列表
 */
export async function getAlbumList(
  type: string = 'random',
  size: number = 20,
  offset: number = 0
): Promise<Album[]> {
  const data = await request<any>('getAlbumList2', {
    type,
    size,
    offset,
  })
  // Navidrome 返回格式：{ albumList2: { album: [...] } } 或 { albumList2: [...] }
  return data.albumList2?.album || data.albumList2 || []
}

/**
 * 获取专辑详情
 */
export async function getAlbum(id: string): Promise<Album> {
  const data = await request<{ album: Album }>('getAlbum', { id })
  return data.album
}

/**
 * 获取艺术家列表
 */
export async function getArtists(): Promise<Artist[]> {
  const data = await request<any>('getArtists')
  // Navidrome 返回格式：{ artists: { index: [{ name: 'A', artist: [...] }], lastModified: ..., ignoredArticles: ... } }
  // 或者：{ index: [...], lastModified: ..., ignoredArticles: ... }
  const artistsData = data.artists || data
  const index = artistsData.index || []
  const allArtists: Artist[] = []
  for (const group of index) {
    if (group.artist) {
      allArtists.push(...group.artist)
    }
  }
  return allArtists
}

/**
 * 获取艺术家详情
 */
export async function getArtist(id: string): Promise<{ artist: Artist & { album: Album[] } }> {
  return request('getArtist', { id })
}

/**
 * 搜索（支持歌曲、专辑、艺术家）
 */
export async function search3(query: string, limits = 20): Promise<SearchResult3> {
  return request<SearchResult3>('search3', { query, songCount: limits, albumCount: limits, artistCount: limits })
}

/**
 * 获取歌词
 */
export async function getLyrics(id?: string) {
  const params = id ? { id } : {}
  const data = await request<{ lyrics: { value?: string } }>('getLyrics', params)
  return data.lyrics.value || ''
}

/**
 * 收藏歌曲
 */
export async function star(id: string) {
  return request('star', { id })
}

/**
 * 取消收藏歌曲
 */
export async function unstar(id: string) {
  return request('unstar', { id })
}

/**
 * 获取随机歌曲
 */
export async function getRandomSongs(size: number = 50): Promise<Song[]> {
  const data = await request<any>('getRandomSongs', { size })
  // Navidrome 返回格式：{ songs: { song: [...] } } 或 { songs: [...] }
  return data.songs?.song || data.songs || []
}

/**
 * 获取最近播放
 */
export async function getNowPlaying(): Promise<Song[]> {
  const data = await request<{ nowPlaying: { entry: Song[] } }>('getNowPlaying')
  return data.nowPlaying.entry
}

/**
 * 获取最常播放
 */
export async function getTopSongs(size: number = 50): Promise<Song[]> {
  // getTopSongs 需要 artist 参数，使用空字符串获取所有歌曲
  const data = await request<{ songs: { song: Song[] } }>('getTopSongs', { size, artist: '' })
  return data.songs?.song || []
}

// 导出默认对象
export default {
  ping,
  getSong,
  getStreamUrl,
  getCoverArtUrl,
  getAlbumList,
  getAlbum,
  getArtists,
  getArtist,
  search3,
  getLyrics,
  star,
  unstar,
  getRandomSongs,
  getNowPlaying,
  getTopSongs,
}
