import { isTauriApp } from './desktop'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version?: string
  date?: string
  body?: string
  error?: string
}

let updaterInstance: any = null

export async function checkAppUpdate(): Promise<UpdateInfo> {
  const currentVersion = '1.0.11'

  // 纯网页端 (Web/Docker 部署) 由服务端发布与浏览器刷新维护，不参与客户端版本检测与弹窗
  if (!isTauriApp()) {
    return { available: false, currentVersion }
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
  } catch (err: any) {
    const message = err?.message || String(err)
    console.warn('Tauri updater check error:', message)
    return { available: false, currentVersion, error: message }
  }
}

export async function installAppUpdate(onProgress?: (progress: number) => void): Promise<void> {
  if (!isTauriApp() || !updaterInstance) {
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
