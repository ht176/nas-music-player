import { isDesktopApp } from './desktop'

export interface ShortcutHandlers {
  togglePlay: () => void
  prev: () => void
  next: () => void
  volumeUp: () => void
  volumeDown: () => void
}

/**
 * 注册系统全局多媒体与组合快捷键
 * 在播放器失去焦点、鼠标未聚焦或迷你窗口驻留时均可生效
 */
export async function initGlobalShortcuts(handlers: ShortcutHandlers): Promise<(() => Promise<void>) | undefined> {
  if (!isDesktopApp()) return

  try {
    const { register, unregisterAll } = await import('@tauri-apps/plugin-global-shortcut')

    try {
      await unregisterAll()
    } catch {}

    const shortcutConfigs: Array<{ keys: string[]; action: () => void }> = [
      {
        keys: ['MediaPlayPause', 'CommandOrControl+Alt+Space', 'Alt+Space'],
        action: handlers.togglePlay,
      },
      {
        keys: ['MediaTrackNext', 'CommandOrControl+Alt+Right'],
        action: handlers.next,
      },
      {
        keys: ['MediaTrackPrevious', 'CommandOrControl+Alt+Left'],
        action: handlers.prev,
      },
      {
        keys: ['CommandOrControl+Alt+Up'],
        action: handlers.volumeUp,
      },
      {
        keys: ['CommandOrControl+Alt+Down'],
        action: handlers.volumeDown,
      },
    ]

    for (const item of shortcutConfigs) {
      for (const key of item.keys) {
        try {
          await register(key, (event) => {
            if (event.state === 'Pressed') {
              item.action()
            }
          })
        } catch (e) {
          // 快捷键若被系统其他应用抢占则安全容错
          console.warn(`[GlobalShortcut] 注册 ${key} 失败或已被占用:`, e)
        }
      }
    }

    return async () => {
      try {
        await unregisterAll()
      } catch {}
    }
  } catch (err) {
    console.warn('[GlobalShortcut] 全局快捷键插件不可用或未启用:', err)
  }
}
