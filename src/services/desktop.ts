import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'

export function isTauriApp(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return /android|iphone|ipad|ipod|mobile/i.test(ua)
}

export function isDesktopApp(): boolean {
  // 桌面端必须运行在 Tauri 环境且非移动端操作系统
  return isTauriApp() && !isMobileDevice()
}

export function isMobileApp(): boolean {
  // 移动端 App（Tauri 打包的 Android/iOS 客户端）
  return isTauriApp() && isMobileDevice()
}

export function isWebApp(): boolean {
  // 网页浏览器端（Docker 或 Web 部署环境）
  return !isTauriApp()
}

const NORMAL_SIZE_KEY = 'aura_desktop_last_normal_size'

function getSavedNormalSize(): { width: number; height: number } {
  try {
    const raw = localStorage.getItem(NORMAL_SIZE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.width >= 400 && parsed.height >= 300) {
        return parsed
      }
    }
  } catch {}
  return { width: 1100, height: 720 }
}

let lastNormalSize = getSavedNormalSize()

export async function minimizeWindow() {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    await win.minimize()
  } catch (err) {
    console.warn('Failed to minimize window', err)
  }
}

export async function toggleMaximizeWindow() {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    await win.toggleMaximize()
  } catch (err) {
    console.warn('Failed to toggle maximize window', err)
  }
}

export async function closeWindow() {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    // 桌面端点击关闭时隐藏到后台托盘驻留
    await win.hide()
  } catch (err) {
    console.warn('Failed to hide window', err)
  }
}

export async function isWindowMaximized(): Promise<boolean> {
  if (!isDesktopApp()) return false
  try {
    const win = getCurrentWindow()
    return await win.isMaximized()
  } catch {
    return false
  }
}

export async function enterMiniMode() {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    const size = await win.innerSize()
    // 仅在当前处于正常非迷你尺寸时记录
    if (size.width >= 500 && size.height >= 350) {
      lastNormalSize = { width: size.width, height: size.height }
      try {
        localStorage.setItem(NORMAL_SIZE_KEY, JSON.stringify(lastNormalSize))
      } catch {}
    }
    // 迷你播放器高度减小: 设为 88px 高度, 330px 宽度
    await win.setMinSize(new LogicalSize(280, 80))
    await win.setSize(new LogicalSize(330, 92))
    await win.setAlwaysOnTop(true)
  } catch (err) {
    console.warn('Failed to enter mini mode', err)
  }
}

export async function exitMiniMode() {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    await win.setAlwaysOnTop(false)
    await win.setMinSize(new LogicalSize(400, 500))
    const restoreSize = lastNormalSize.width ? lastNormalSize : getSavedNormalSize()
    await win.setSize(new LogicalSize(restoreSize.width || 1100, restoreSize.height || 720))
  } catch (err) {
    console.warn('Failed to exit mini mode', err)
  }
}

export async function listenTrayActions(handler: (action: string) => void): Promise<(() => void) | undefined> {
  if (!isDesktopApp()) return
  try {
    const { listen } = await import('@tauri-apps/api/event')
    const unlisten = await listen<string>('tray-action', (event) => {
      handler(event.payload)
    })
    return unlisten
  } catch (err) {
    console.warn('Failed to listen to tray actions', err)
  }
}

