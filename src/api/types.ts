export interface ServerConfig {
  id: string
  name: string
  url: string
  username?: string
  token?: string
  salt?: string
  active: boolean
}

export interface Track {
  id: string
  title: string
  artist: string
  artistId?: string
  album: string
  albumId: string
  coverArtId?: string
  duration: number
  trackNumber?: number
  discNumber?: number
  year?: number
  bitRate?: number
  suffix?: string
  size?: number
  starred?: boolean
}

export interface Album {
  id: string
  name: string
  artist: string
  artistId?: string
  coverArtId?: string
  songCount: number
  duration: number
  year?: number
  genre?: string
  starred?: boolean
  songs?: Track[]
}

export interface Artist {
  id: string
  name: string
  albumCount: number
  coverArtId?: string
  starred?: boolean
  albums?: Album[]
}

export interface Playlist {
  id: string
  name: string
  comment?: string
  owner?: string
  songCount: number
  duration: number
  coverArtId?: string
  songs?: Track[]
}

export type PlayMode = 'sequence' | 'loop' | 'single' | 'random'

export interface LyricLine {
  time: number
  text: string
}
