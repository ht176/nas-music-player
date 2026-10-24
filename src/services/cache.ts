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
  // 内存哈希集合：将列表成百上千行的 isCached 检查优化为 O(1) 瞬时查表，避免重复触发成百上千次 IndexedDB 事务
  private cachedIdSet: Set<string> | null = null
  private cachedIdSetPromise: Promise<Set<string>> | null = null
  // 记录最近生成的 Blob URL，适时释放防止数十上百兆 FLAC/MP3 二进制流常驻内存泄露
  private lastBlobUrl: string | null = null

  constructor() {
    this.dbPromise = this.initDB()
    this.initCachedIdSet()
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

  private async initCachedIdSet(): Promise<Set<string>> {
    if (this.cachedIdSet) return this.cachedIdSet
    if (this.cachedIdSetPromise) return this.cachedIdSetPromise

    this.cachedIdSetPromise = (async () => {
      try {
        const db = await this.dbPromise
        return new Promise<Set<string>>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly')
          const store = tx.objectStore(STORE_NAME)
          const req = store.getAllKeys()
          req.onsuccess = () => {
            const set = new Set<string>((req.result || []).map(String))
            this.cachedIdSet = set
            resolve(set)
          }
          req.onerror = () => {
            const set = new Set<string>()
            this.cachedIdSet = set
            resolve(set)
          }
        })
      } catch {
        const set = new Set<string>()
        this.cachedIdSet = set
        return set
      }
    })()

    return this.cachedIdSetPromise
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

      putReq.onsuccess = () => {
        this.cachedIdSet?.add(track.id)
        resolve()
      }
      putReq.onerror = () => reject(putReq.error)
    })
  }

  /**
   * 检查单曲是否已经离线下载 (优先内存 O(1) 查询)
   */
  async isCached(id: string): Promise<boolean> {
    if (this.cachedIdSet) {
      return this.cachedIdSet.has(id)
    }
    const set = await this.initCachedIdSet()
    return set.has(id)
  }

  /**
   * 获取离线音频的本地 Blob URL (自动回收上一曲内存)
   */
  async getCachedTrackUrl(id: string): Promise<string | null> {
    if (this.lastBlobUrl) {
      try {
        URL.revokeObjectURL(this.lastBlobUrl)
      } catch {
        // ignore
      }
      this.lastBlobUrl = null
    }

    const db = await this.dbPromise
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(id)

      req.onsuccess = () => {
        const record = req.result as CachedTrackRecord | undefined
        if (record && record.blob) {
          const url = URL.createObjectURL(record.blob)
          this.lastBlobUrl = url
          resolve(url)
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

      req.onsuccess = () => {
        this.cachedIdSet?.delete(id)
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }

  /**
   * 清空所有离线缓存
   */
  async clearAll(): Promise<void> {
    if (this.lastBlobUrl) {
      try {
        URL.revokeObjectURL(this.lastBlobUrl)
      } catch {}
      this.lastBlobUrl = null
    }

    const db = await this.dbPromise
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.clear()

      req.onsuccess = () => {
        this.cachedIdSet?.clear()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }
}

export const cacheService = new CacheService()
