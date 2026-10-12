import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
}

let lastNormalSize = { width: 1100, height: 720 }

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
    if (size.width > 400 && size.height > 200) {
      lastNormalSize = { width: size.width, height: size.height }
    }
    await win.setMinSize(new LogicalSize(300, 110))
    await win.setSize(new LogicalSize(340, 136))
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
    await win.setSize(new LogicalSize(lastNormalSize.width || 1100, lastNormalSize.height || 720))
  } catch (err) {
    console.warn('Failed to exit mini mode', err)
  }
}
