import { isDesktopApp } from './desktop'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version?: string
  date?: string
  body?: string
}

let updaterInstance: any = null

export async function checkAppUpdate(): Promise<UpdateInfo> {
  const currentVersion = '1.0.3'

  if (!isDesktopApp()) {
    try {
      const res = await fetch('https://api.github.com/repos/ht176/nas-music-player/releases/latest')
      if (!res.ok) return { available: false, currentVersion }
      const data = await res.json()
      const latestTag = (data.tag_name || '').replace(/^v/, '')
      return {
        available: Boolean(latestTag && latestTag !== currentVersion),
        currentVersion,
        version: latestTag,
        date: data.published_at,
        body: data.body,
      }
    } catch {
      return { available: false, currentVersion }
    }
  }

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
      }
    }
    return { available: false, currentVersion }
  } catch (err) {
    console.warn('Tauri updater check error:', err)
    return { available: false, currentVersion }
  }
}

export async function installAppUpdate(onProgress?: (progress: number) => void): Promise<void> {
  if (!isDesktopApp() || !updaterInstance) {
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
