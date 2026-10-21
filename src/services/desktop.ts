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

export async function listenWindowResize(cb: () => void): Promise<(() => void) | undefined> {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    const unlisten = await win.onResized(() => {
      cb()
    })
    return unlisten
  } catch {
    window.addEventListener('resize', cb)
    return () => window.removeEventListener('resize', cb)
  }
}

export const DEFAULT_WINDOW_WIDTH = 1100
export const DEFAULT_WINDOW_HEIGHT = 720
export const MINI_WINDOW_WIDTH = 340
export const MINI_WINDOW_HEIGHT = 102
export const MINI_EXPANDED_HEIGHT = 380

export async function enterMiniMode() {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    // 禁止最大化与自由缩放，彻底杜绝 Windows 客户端双击标题栏/拖拽区域触发最大化全屏
    await win.setMaximizable(false)
    await win.setResizable(false)
    await win.setMinSize(new LogicalSize(280, 80))
    await win.setSize(new LogicalSize(MINI_WINDOW_WIDTH, MINI_WINDOW_HEIGHT))
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
    // 恢复窗口最大化与调整尺寸权限
    await win.setResizable(true)
    await win.setMaximizable(true)
    await win.setMinSize(new LogicalSize(400, 500))
    // 恢复为初始化默认尺寸 (1100 x 720)
    await win.setSize(new LogicalSize(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT))
    // 居中显示，彻底解决受迷你播放器拖拽位置影响的问题
    await win.center()
    await win.setFocus()
  } catch (err) {
    console.warn('Failed to exit mini mode', err)
  }
}

export async function expandMiniWindow() {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    await win.setSize(new LogicalSize(MINI_WINDOW_WIDTH, MINI_EXPANDED_HEIGHT))
  } catch (err) {
    console.warn('Failed to expand mini window', err)
  }
}

export async function collapseMiniWindow() {
  if (!isDesktopApp()) return
  try {
    const win = getCurrentWindow()
    await win.setSize(new LogicalSize(MINI_WINDOW_WIDTH, MINI_WINDOW_HEIGHT))
  } catch (err) {
    console.warn('Failed to collapse mini window', err)
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

export async function getAutostartStatus(): Promise<boolean> {
  if (!isDesktopApp()) return false
  try {
    const { isEnabled } = await import('@tauri-apps/plugin-autostart')
    return await isEnabled()
  } catch (err) {
    console.warn('Failed to get autostart status', err)
    return false
  }
}

export async function setAutostartStatus(enableAutostart: boolean): Promise<boolean> {
  if (!isDesktopApp()) return false
  try {
    const { enable, disable, isEnabled } = await import('@tauri-apps/plugin-autostart')
    if (enableAutostart) {
      await enable()
    } else {
      await disable()
    }
    return await isEnabled()
  } catch (err) {
    console.error('Failed to set autostart status', err)
    throw err
  }
}


