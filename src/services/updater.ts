import { isTauriApp, isMobileDevice, isDesktopApp } from './desktop'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version?: string
  date?: string
  body?: string
  error?: string
  downloadUrl?: string
  isMobile?: boolean
}

let updaterInstance: any = null

function isVersionNewer(remote: string, current: string): boolean {
  const cleanRemote = remote.replace(/^[vV]/, '').trim()
  const cleanCurrent = current.replace(/^[vV]/, '').trim()
  const rParts = cleanRemote.split('.').map((n) => parseInt(n, 10) || 0)
  const cParts = cleanCurrent.split('.').map((n) => parseInt(n, 10) || 0)
  const maxLen = Math.max(rParts.length, cParts.length)

  for (let i = 0; i < maxLen; i++) {
    const r = rParts[i] || 0
    const c = cParts[i] || 0
    if (r > c) return true
    if (r < c) return false
  }
  return false
}

export async function checkAppUpdate(): Promise<UpdateInfo> {
  const currentVersion = '1.0.14'

  // 纯网页端 (Web/Docker 部署) 由服务端发布与浏览器刷新维护，不参与客户端版本检测与弹窗
  if (!isTauriApp()) {
    return { available: false, currentVersion }
  }

  const isMobile = isMobileDevice() || !isDesktopApp()

  // 移动端 (Android / iOS): Tauri 官方 plugin-updater 为桌面专有插件，因此在移动端通过拉取 release latest.json 进行版本比对
  if (isMobile) {
    try {
      const res = await fetch('https://github.com/ht176/nas-music-player/releases/latest/download/latest.json', {
        cache: 'no-cache',
      })
      if (!res.ok) {
        return { available: false, currentVersion, isMobile: true }
      }
      const data = await res.json()
      const remoteVersion = data.version || ''
      const hasUpdate = Boolean(remoteVersion && isVersionNewer(remoteVersion, currentVersion))

      return {
        available: hasUpdate,
        currentVersion,
        version: remoteVersion,
        date: data.pub_date,
        body: data.notes || '全平台发布产物已更新，包含最新 Android APK。',
        downloadUrl: 'https://github.com/ht176/nas-music-player/releases/latest',
        isMobile: true,
      }
    } catch (err: any) {
      console.warn('Mobile update check warning:', err)
      return { available: false, currentVersion, isMobile: true }
    }
  }

  // 桌面端 (Windows / macOS / Linux): 使用 Tauri 官方自动热更新与静默升级服务
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (update) {
      updaterInstance = update
      return {
        available: true,
        currentVersion: update.currentVersion || currentVersion,
        version: update.version,
        date: update.date,
        body: update.body,
        isMobile: false,
      }
    }
    return { available: false, currentVersion, isMobile: false }
  } catch (err: any) {
    const message = err?.message || String(err)
    console.warn('Tauri desktop updater check error:', message)

    // 容错降级：尝试通过网络拉取 latest.json 比对
    try {
      const res = await fetch('https://github.com/ht176/nas-music-player/releases/latest/download/latest.json', {
        cache: 'no-cache',
      })
      if (res.ok) {
        const data = await res.json()
        const remoteVersion = data.version || ''
        if (remoteVersion && isVersionNewer(remoteVersion, currentVersion)) {
          return {
            available: true,
            currentVersion,
            version: remoteVersion,
            date: data.pub_date,
            body: data.notes,
            downloadUrl: 'https://github.com/ht176/nas-music-player/releases/latest',
            isMobile: false,
          }
        }
      }
    } catch {
      // ignore
    }

    return { available: false, currentVersion, error: message }
  }
}

export async function installAppUpdate(onProgress?: (progress: number) => void): Promise<void> {
  const isMobile = isMobileDevice() || !isDesktopApp()
  const releaseUrl = 'https://github.com/ht176/nas-music-player/releases/latest'

  if (isMobile) {
    // 移动端：通过 AndroidMediaBridge 或系统浏览器跳转至 GitHub Releases 页面直接下载 APK
    try {
      const bridge = (window as any).AndroidMediaBridge
      if (bridge && typeof bridge.openUrl === 'function') {
        bridge.openUrl(releaseUrl)
        return
      }
    } catch (e) {
      console.warn('AndroidMediaBridge.openUrl failed:', e)
    }
    window.open(releaseUrl, '_blank')
    return
  }

  if (!isTauriApp() || !updaterInstance) {
    window.open('https://github.com/ht176/nas-music-player/releases/latest', '_blank')
    return
  }

  try {
    let downloaded = 0
    let contentLength = 0

    await updaterInstance.downloadAndInstall((event: any) => {
      if (event.event === 'Started') {
        contentLength = event.data.contentLength || 0
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength
        if (contentLength > 0 && onProgress) {
          onProgress(Math.round((downloaded / contentLength) * 100))
        }
      } else if (event.event === 'Finished') {
        if (onProgress) onProgress(100)
      }
    })

    const { relaunch } = await import('@tauri-apps/plugin-process')
    await relaunch()
  } catch (err) {
    console.error('Failed to install update:', err)
    throw err
  }
}
