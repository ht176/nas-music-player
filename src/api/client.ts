import CryptoJS from 'crypto-js'
import type { Album, Artist, Playlist, ServerConfig, Track } from './types'

export class SubsonicClient {
  private config: ServerConfig

  constructor(config: ServerConfig) {
    this.config = config
  }

  static generateCredentials(password: string): { salt: string; token: string } {
    const salt = Math.random().toString(36).substring(2, 10)
    const token = CryptoJS.MD5(password + salt).toString()
    return { salt, token }
  }

  private getAuthParams(): URLSearchParams {
    const params = new URLSearchParams({
      v: '1.16.1',
      c: 'NasMusicPlayer',
      f: 'json',
    })
    if (this.config.username) {
      params.append('u', this.config.username)
    }
    if (this.config.token) {
      params.append('t', this.config.token)
    }
    if (this.config.salt) {
      params.append('s', this.config.salt)
    }
    return params
  }

  private async request<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const searchParams = this.getAuthParams()
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, String(value))
    }

    const cleanBaseUrl = this.config.url.replace(/\/+$/, '')
    const url = `${cleanBaseUrl}/rest/${endpoint}?${searchParams.toString()}`

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    const data = await res.json()
    const subsonic = data['subsonic-response']
    if (!subsonic || subsonic.status !== 'ok') {
      const err = subsonic?.error?.message || 'Unknown Subsonic Error'
      throw new Error(err)
    }
    return subsonic as T
  }

  mapSong(s: any): Track {
    return {
      id: s.id,
      title: s.title,
      artist: s.artist,
      artistId: s.artistId,
      album: s.album,
      albumId: s.albumId,
      coverArtId: s.coverArt,
      duration: s.duration || 0,
      trackNumber: s.track,
      discNumber: s.discNumber,
      year: s.year,
      bitRate: s.bitRate,
      suffix: s.suffix,
      size: s.size,
      starred: !!s.starred,
      userRating: s.userRating,
      genre: s.genre,
      path: s.path,
      contentType: s.contentType,
      samplingRate: s.samplingRate,
      bitDepth: s.bitDepth,
      channelCount: s.channelCount,
      created: s.created,
    }
  }

  async getSong(id: string): Promise<Track> {
    const res = await this.request<{ song: any }>('getSong.view', { id })
    return this.mapSong(res.song)
  }

  async ping(): Promise<boolean> {
    const res = await this.request<{ status: string }>('ping.view')
    return res.status === 'ok'
  }

  async getAlbumList2(type: 'newest' | 'recent' | 'frequent' | 'alphabeticalByName' | 'starred' = 'newest', size = 50, offset = 0): Promise<Album[]> {
    const res = await this.request<{ albumList2?: { album?: any[] } }>('getAlbumList2.view', { type, size, offset })
    const list = res.albumList2?.album || []
    return list.map(a => ({
      id: a.id,
      name: a.name || a.title,
      artist: a.artist,
      artistId: a.artistId,
      coverArtId: a.coverArt,
      songCount: a.songCount || 0,
      duration: a.duration || 0,
      year: a.year,
      genre: a.genre,
      starred: !!a.starred,
    }))
  }

  async getAlbum(id: string): Promise<Album> {
    const res = await this.request<{ album: any }>('getAlbum.view', { id })
    const a = res.album
    const songs: Track[] = (a.song || []).map((s: any) => ({
      ...this.mapSong(s),
      albumId: s.albumId || a.id,
    }))
    return {
      id: a.id,
      name: a.name || a.title,
      artist: a.artist,
      artistId: a.artistId,
      coverArtId: a.coverArt,
      songCount: a.songCount || songs.length,
      duration: a.duration || 0,
      year: a.year,
      genre: a.genre,
      starred: !!a.starred,
      songs,
    }
  }

  async getArtists(): Promise<Artist[]> {
    const res = await this.request<{ artists?: { index?: any[] } }>('getArtists.view')
    const artists: Artist[] = []
    const indexList = res.artists?.index || []
    for (const group of indexList) {
      if (group.artist) {
        for (const a of group.artist) {
          artists.push({
            id: a.id,
            name: a.name,
            albumCount: a.albumCount || 0,
            coverArtId: a.coverArt,
            starred: !!a.starred,
          })
        }
      }
    }
    return artists
  }

  async getArtist(id: string): Promise<Artist> {
    const res = await this.request<{ artist: any }>('getArtist.view', { id })
    const a = res.artist
    const albums: Album[] = (a.album || []).map((alb: any) => ({
      id: alb.id,
      name: alb.name || alb.title,
      artist: alb.artist,
      artistId: alb.artistId || a.id,
      coverArtId: alb.coverArt,
      songCount: alb.songCount || 0,
      duration: alb.duration || 0,
      year: alb.year,
      genre: alb.genre,
    }))
    return {
      id: a.id,
      name: a.name,
      albumCount: a.albumCount || albums.length,
      coverArtId: a.coverArt,
      starred: !!a.starred,
      albums,
    }
  }

  async getStarred(): Promise<{ songs: Track[]; albums: Album[]; artists: Artist[] }> {
    const res = await this.request<{ starred?: any }>('getStarred.view')
    const st = res.starred || {}
    const songs: Track[] = (st.song || []).map((s: any) => ({
      ...this.mapSong(s),
      starred: true,
    }))
    const albums: Album[] = (st.album || []).map((a: any) => ({
      id: a.id,
      name: a.name || a.title,
      artist: a.artist,
      artistId: a.artistId,
      coverArtId: a.coverArt,
      songCount: a.songCount || 0,
      duration: a.duration || 0,
      starred: true,
    }))
    const artists: Artist[] = (st.artist || []).map((ar: any) => ({
      id: ar.id,
      name: ar.name,
      albumCount: ar.albumCount || 0,
      coverArtId: ar.coverArt,
      starred: true,
    }))
    return { songs, albums, artists }
  }

  async star(id: string, albumId?: string, artistId?: string): Promise<boolean> {
    const params: Record<string, string> = {}
    if (id) params.id = id
    if (albumId) params.albumId = albumId
    if (artistId) params.artistId = artistId
    await this.request('star.view', params)
    return true
  }

  async unstar(id: string, albumId?: string, artistId?: string): Promise<boolean> {
    const params: Record<string, string> = {}
    if (id) params.id = id
    if (albumId) params.albumId = albumId
    if (artistId) params.artistId = artistId
    await this.request('unstar.view', params)
    return true
  }

  async getPlaylists(): Promise<Playlist[]> {
    const res = await this.request<{ playlists?: { playlist?: any[] } }>('getPlaylists.view')
    const list = res.playlists?.playlist || []
    return list.map(p => ({
      id: p.id,
      name: p.name,
      comment: p.comment,
      owner: p.owner,
      songCount: p.songCount || 0,
      duration: p.duration || 0,
      coverArtId: p.coverArt,
    }))
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const res = await this.request<{ playlist: any }>('getPlaylist.view', { id })
    const p = res.playlist
    const songs: Track[] = (p.entry || []).map((s: any) => this.mapSong(s))
    return {
      id: p.id,
      name: p.name,
      comment: p.comment,
      owner: p.owner,
      songCount: p.songCount || songs.length,
      duration: p.duration || 0,
      coverArtId: p.coverArt,
      songs,
    }
  }

  async createPlaylist(name: string, songIds: string[] = []): Promise<Playlist> {
    const params: Record<string, string> = { name }
    if (songIds.length) {
      params.songId = songIds[0] // 支持初始曲目
    }
    const res = await this.request<{ playlist: any }>('createPlaylist.view', params)
    return res.playlist
  }

  async updatePlaylist(playlistId: string, songIdToAdd?: string, songIndexToRemove?: number): Promise<void> {
    const params: Record<string, string | number> = { playlistId }
    if (songIdToAdd) params.songIdToAdd = songIdToAdd
    if (songIndexToRemove !== undefined) params.songIndexToRemove = songIndexToRemove
    await this.request('updatePlaylist.view', params)
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.request('deletePlaylist.view', { id })
  }

  async scrobble(id: string, submission = true): Promise<void> {
    try {
      await this.request('scrobble.view', { id, submission: submission ? 'true' : 'false' })
    } catch {
      // 容错处理
    }
  }

  async search(query: string): Promise<{ songs: Track[]; albums: Album[]; artists: Artist[] }> {
    const res = await this.request<{ searchResult3?: any }>('search3.view', { query })
    const sr = res.searchResult3 || {}
    const songs: Track[] = (sr.song || []).map((s: any) => this.mapSong(s))
    const albums: Album[] = (sr.album || []).map((a: any) => ({
      id: a.id,
      name: a.name || a.title,
      artist: a.artist,
      artistId: a.artistId,
      coverArtId: a.coverArt,
      songCount: a.songCount || 0,
      duration: a.duration || 0,
      starred: !!a.starred,
    }))
    const artists: Artist[] = (sr.artist || []).map((ar: any) => ({
      id: ar.id,
      name: ar.name,
      albumCount: ar.albumCount || 0,
      coverArtId: ar.coverArt,
      starred: !!ar.starred,
    }))
    return { songs, albums, artists }
  }

  /**
   * 按关键词搜索歌曲 (Subsonic search3.view)
   */
  async searchSongs(query: string, count = 30, offset = 0): Promise<Track[]> {
    const res = await this.request<{ searchResult3?: { song?: any[] } }>('search3.view', {
      query: query || '',
      songCount: count,
      songOffset: offset,
    })
    const list = res.searchResult3?.song || []
    return list.map((s: any) => this.mapSong(s))
  }

  /**
   * 随机获取一批歌曲 (Subsonic getRandomSongs.view)
   */
  async getRandomSongs(size = 30): Promise<Track[]> {
    const res = await this.request<{ randomSongs?: { song?: any[] } }>('getRandomSongs.view', { size })
    const list = res.randomSongs?.song || []
    return list.map((s: any) => this.mapSong(s))
  }

  getStreamUrl(songId: string, suffix?: string): string {
    const cleanBaseUrl = this.config.url.replace(/\/+$/, '')
    const params = this.getAuthParams()
    params.append('id', songId)

    // 浏览器原生支持的常见音频格式: mp3, flac, aac, m4a, ogg, wav
    // 如果是 wma, ape, dsf 等浏览器原生不支持的格式，让 Navidrome 自动转码为 mp3 流
    const s = (suffix || '').toLowerCase()
    const browserNative = ['mp3', 'flac', 'aac', 'm4a', 'ogg', 'wav', 'webm']
    if (s && !browserNative.includes(s)) {
      params.append('format', 'mp3')
    }

    return `${cleanBaseUrl}/rest/stream?${params.toString()}`
  }

  getCoverArtUrl(coverArtId?: string, size = 300): string {
    if (!coverArtId) return ''
    const cleanBaseUrl = this.config.url.replace(/\/+$/, '')
    const params = this.getAuthParams()
    params.append('id', coverArtId)
    params.append('size', String(size))
    return `${cleanBaseUrl}/rest/getCoverArt.view?${params.toString()}`
  }

  async getLyrics(songId: string, artist?: string, title?: string): Promise<{ synced: boolean; lines: { time: number; text: string }[] }> {
    // 1. 优先调用 Navidrome / OpenSubsonic 专属精准同步歌词接口 getLyricsBySongId.view
    try {
      const res = await this.request<{ lyricsList?: { structuredLyrics?: any[] } }>('getLyricsBySongId.view', { id: songId })
      const structured = res.lyricsList?.structuredLyrics?.[0]
      if (structured && Array.isArray(structured.line) && structured.line.length > 0) {
        const lines = structured.line
          .filter((l: any) => l.value && l.value.trim())
          .map((l: any) => ({
            time: (l.start || 0) / 1000,
            text: String(l.value || '').trim(),
          }))
        if (lines.length > 0) {
          return { synced: !!structured.synced, lines }
        }
      }
    } catch {
      // 若服务端不支持 getLyricsBySongId 则平滑降级
    }

    // 2. 降级尝试标准 Subsonic getLyrics.view (支持传 id 或 artist+title)
    try {
      const params: Record<string, string> = { id: songId }
      if (artist) params.artist = artist
      if (title) params.title = title
      const res = await this.request<{ lyrics?: { value?: string } }>('getLyrics.view', params)
      const rawLrc = res.lyrics?.value || ''
      if (rawLrc) {
        // 如果是纯文本非 LRC 时间戳，每行均分或以简单文本呈现
        return { synced: false, lines: this.parseRawOrLrc(rawLrc) }
      }
    } catch {
      // 容错忽略
    }

    return { synced: false, lines: [] }
  }

  private parseRawOrLrc(text: string): { time: number; text: string }[] {
    if (!text || !text.trim()) return []
    const lines = text.split('\n')
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g
    const hasTimestamp = lines.some(l => /\[\d{2}:\d{2}/.test(l))

    if (!hasTimestamp) {
      // 纯文本歌词，无时间戳，以 5 秒步进或作为可读文本呈现
      return lines
        .map(l => l.trim())
        .filter(Boolean)
        .map((l, idx) => ({ time: idx * 5, text: l }))
    }

    const result: { time: number; text: string }[] = []
    for (const line of lines) {
      const match = timeRegex.exec(line)
      if (match) {
        const m = parseInt(match[1], 10)
        const s = parseInt(match[2], 10)
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0
        const time = m * 60 + s + ms / 1000
        const content = line.replace(timeRegex, '').trim()
        if (content) {
          result.push({ time, text: content })
        }
      }
      timeRegex.lastIndex = 0
    }
    return result.sort((a, b) => a.time - b.time)
  }
}
