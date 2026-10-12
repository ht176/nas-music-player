import type { Track } from '../api/types'

const DB_NAME = 'nas_music_offline_db'
const DB_VERSION = 1
const STORE_NAME = 'offline_tracks'

export interface CachedTrackRecord {
  id: string
  track: Track
  blob: Blob
  cachedAt: number
  size: number
}

class CacheService {
  private dbPromise: Promise<IDBDatabase>

  constructor() {
    this.dbPromise = this.initDB()
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 下载并缓存单曲音频二进制流
   */
  async cacheTrack(track: Track, streamUrl: string): Promise<void> {
    const res = await fetch(streamUrl)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

    const blob = await res.blob()
    const db = await this.dbPromise

    const record: CachedTrackRecord = {
      id: track.id,
      track,
      blob,
      cachedAt: Date.now(),
      size: blob.size,
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const putReq = store.put(record)

      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    })
  }

  /**
   * 检查单曲是否已经离线下载
   */
  async isCached(id: string): Promise<boolean> {
    const db = await this.dbPromise
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getKey(id)

      req.onsuccess = () => resolve(!!req.result)
      req.onerror = () => resolve(false)
    })
  }

  /**
   * 获取离线音频的本地 Blob URL
   */
  async getCachedTrackUrl(id: string): Promise<string | null> {
    const db = await this.dbPromise
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(id)

      req.onsuccess = () => {
        const record = req.result as CachedTrackRecord | undefined
        if (record && record.blob) {
          resolve(URL.createObjectURL(record.blob))
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    })
  }

  /**
   * 获取所有已离线下载的歌曲列表
   */
  async getAllCachedTracks(): Promise<CachedTrackRecord[]> {
    const db = await this.dbPromise
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()

      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => resolve([])
    })
  }

  /**
   * 移除指定单曲缓存
   */
  async removeCachedTrack(id: string): Promise<void> {
    const db = await this.dbPromise
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(id)

      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  /**
   * 清空所有离线缓存
   */
  async clearAll(): Promise<void> {
    const db = await this.dbPromise
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.clear()

      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }
}

export const cacheService = new CacheService()
