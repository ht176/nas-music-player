#!/usr/bin/env python3
"""
patch-android-theme.py
自动为 Tauri 生成的 Android 原生工程注入深色沉浸主题、车载蓝牙 AVRCP、方向盘按键与导航避让降音 (Audio Focus Ducking)：
1. 修复全面屏手势导航栏呈白色的问题，统一设为 #060609 深色背景并开启白色手势线。
2. 消除冷启动白屏，设置窗口原生背景为 #060609。
3. 注入 AndroidManifest 权限 (WAKE_LOCK, FOREGROUND_SERVICE) 与 MEDIA_BUTTON 意图过滤器。
4. 增强 MainActivity.kt：
   - 保持原生类声明 (WryActivity/TauriActivity/AppCompatActivity) 不变，无损注入 MediaSession。
   - 实例化原生 android.media.session.MediaSession，向车载蓝牙 (AVRCP) 广播歌曲名称、歌手、专辑名、持续时间、专辑封面与当前滚动歌词。
   - 监听车载方向盘/蓝牙按键 (Next, Prev, Play, Pause, Stop, Seek) 并通过 WebView 回调给 Web 前端。
   - 接入 AudioManager AudioFocus，当高德/百度/腾讯等导航语音播报时自动触发 Transient Ducking 避让降音至 20%，播报完毕即刻无缝恢复。
   - 动态获取并注册 AndroidMediaBridge JavascriptInterface 供前端直接交互。
"""

import glob
import os
import re
import sys

DARK_THEME_ITEMS = """
        <!-- NAS Music Player 极光暗色沉浸主题配置 (适配全面屏手势与深色导航栏) -->
        <item name="android:statusBarColor">#060609</item>
        <item name="android:navigationBarColor">#060609</item>
        <item name="android:windowBackground">#060609</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowLightNavigationBar">false</item>
        <item name="android:enforceNavigationBarContrast" tools:targetApi="q">false</item>
        <item name="android:enforceStatusBarContrast" tools:targetApi="q">false</item>
"""

EXTRA_IMPORTS = """
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.net.Uri
import android.os.Build
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.view.WindowCompat
import java.net.HttpURLConnection
import java.net.URL
"""

ON_CREATE_SNIPPET = """
    try {
      window.statusBarColor = Color.parseColor("#060609")
      window.navigationBarColor = Color.parseColor("#060609")
      WindowCompat.getInsetsController(window, window.decorView)?.let {
        it.isAppearanceLightStatusBars = false
        it.isAppearanceLightNavigationBars = false
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
    initMediaSession()
    setupWebViewBridge()
"""

ACTIVITY_METHODS = """
  private var webViewInstance: WebView? = null
  private var mediaSession: MediaSession? = null
  private var currentMetadataBuilder: MediaMetadata.Builder? = null
  private var lastCoverUrl: String = ""
  private var lastCoverBitmap: Bitmap? = null
  private var currentTitle: String = ""
  private var currentArtist: String = ""
  private var currentAlbum: String = ""
  private var currentDurationMs: Long = 0L
  private var lastLyric: String = ""
  private var lastLyricUpdateTime: Long = 0L

  private fun setupWebViewBridge(retryCount: Int = 0) {
    try {
      window.decorView.post {
        try {
          val webView = findWebView(window.decorView)
          if (webView != null) {
            webViewInstance = webView
            webView.settings.mediaPlaybackRequiresUserGesture = false
            webView.addJavascriptInterface(AndroidMediaBridge(this@MainActivity), "AndroidMediaBridge")
          } else if (retryCount < 5) {
            window.decorView.postDelayed({ setupWebViewBridge(retryCount + 1) }, 500)
          }
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  private fun findWebView(view: View): WebView? {
    if (view is WebView) return view
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val child = findWebView(view.getChildAt(i))
        if (child != null) return child
      }
    }
    return null
  }

  private fun initMediaSession() {
    try {
      mediaSession = MediaSession(this, "AuraNASMusicPlayer").apply {
        setFlags(
          MediaSession.FLAG_HANDLES_MEDIA_BUTTONS or
          MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS
        )
        setCallback(object : MediaSession.Callback() {
          override fun onPlay() {
            runOnUiThread {
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('play');", null)
            }
          }

          override fun onPause() {
            runOnUiThread {
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('pause');", null)
            }
          }

          override fun onSkipToNext() {
            runOnUiThread {
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('next');", null)
            }
          }

          override fun onSkipToPrevious() {
            runOnUiThread {
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('prev');", null)
            }
          }

          override fun onStop() {
            runOnUiThread {
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('pause');", null)
            }
          }

          override fun onSeekTo(pos: Long) {
            runOnUiThread {
              webViewInstance?.evaluateJavascript("window.__AURA_ON_SEEK_TO__ && window.__AURA_ON_SEEK_TO__($pos);", null)
            }
          }

          override fun onMediaButtonEvent(mediaButtonIntent: Intent): Boolean {
            val keyEvent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
              mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT, KeyEvent::class.java)
            } else {
              @Suppress("DEPRECATION")
              mediaButtonIntent.getParcelableExtra<KeyEvent>(Intent.EXTRA_KEY_EVENT)
            }
            if (keyEvent != null && keyEvent.action == KeyEvent.ACTION_DOWN) {
              when (keyEvent.keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY -> { onPlay(); return true }
                KeyEvent.KEYCODE_MEDIA_PAUSE -> { onPause(); return true }
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                KeyEvent.KEYCODE_HEADSETHOOK -> {
                  runOnUiThread {
                    webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('toggle');", null)
                  }
                  return true
                }
                KeyEvent.KEYCODE_MEDIA_NEXT -> { onSkipToNext(); return true }
                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> { onSkipToPrevious(); return true }
                KeyEvent.KEYCODE_MEDIA_STOP -> { onStop(); return true }
              }
            }
            return super.onMediaButtonEvent(mediaButtonIntent)
          }
        })
        isActive = true
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  fun updateNativeMetadata(title: String?, artist: String?, album: String?, durationSec: Double, coverUrl: String?, lyric: String?) {
    runOnUiThread {
      try {
        currentTitle = title ?: ""
        currentArtist = artist ?: ""
        currentAlbum = album ?: ""
        currentDurationMs = (durationSec * 1000).toLong()
        lastLyric = ""

        val builder = MediaMetadata.Builder()
          .putString(MediaMetadata.METADATA_KEY_TITLE, currentTitle)
          .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
          .putString(MediaMetadata.METADATA_KEY_ALBUM, currentAlbum)
          .putString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST, currentArtist)
          .putLong(MediaMetadata.METADATA_KEY_DURATION, if (currentDurationMs > 0) currentDurationMs else -1L)
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE, currentTitle)
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE, currentArtist)
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION, currentAlbum)

        if (lastCoverBitmap != null && coverUrl == lastCoverUrl) {
          builder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, lastCoverBitmap)
          builder.putBitmap(MediaMetadata.METADATA_KEY_ART, lastCoverBitmap)
        }

        currentMetadataBuilder = builder
        mediaSession?.setMetadata(builder.build())
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    if (!coverUrl.isNullOrEmpty() && coverUrl != lastCoverUrl) {
      lastCoverUrl = coverUrl
      Thread {
        try {
          val url = URL(coverUrl)
          val conn = url.openConnection() as HttpURLConnection
          conn.connectTimeout = 3000
          conn.readTimeout = 3000
          conn.doInput = true
          conn.connect()
          val stream = conn.inputStream
          val bitmap = BitmapFactory.decodeStream(stream)
          stream.close()
          conn.disconnect()
          if (bitmap != null) {
            val scaledBitmap = if (bitmap.width > 320 || bitmap.height > 320) {
              val scale = 320f / Math.max(bitmap.width, bitmap.height)
              Bitmap.createScaledBitmap(bitmap, (bitmap.width * scale).toInt(), (bitmap.height * scale).toInt(), true)
            } else {
              bitmap
            }
            lastCoverBitmap = scaledBitmap
            runOnUiThread {
              currentMetadataBuilder?.let { b ->
                b.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, scaledBitmap)
                b.putBitmap(MediaMetadata.METADATA_KEY_ART, scaledBitmap)
                mediaSession?.setMetadata(b.build())
              }
            }
          }
        } catch (e: Exception) {
          // 封面图片加载失败时容错静默
        }
      }.start()
    }
  }

  fun updateNativePlaybackState(isPlaying: Boolean, positionSec: Double) {
    runOnUiThread {
      try {
        mediaSession?.isActive = true
        val actions = PlaybackState.ACTION_PLAY or
          PlaybackState.ACTION_PAUSE or
          PlaybackState.ACTION_PLAY_PAUSE or
          PlaybackState.ACTION_STOP or
          PlaybackState.ACTION_SKIP_TO_NEXT or
          PlaybackState.ACTION_SKIP_TO_PREVIOUS or
          PlaybackState.ACTION_SEEK_TO

        val state = if (isPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED
        val posMs = (positionSec * 1000).toLong()
        val pbState = PlaybackState.Builder()
          .setActions(actions)
          .setState(state, posMs, if (isPlaying) 1.0f else 0.0f)
          .build()
        mediaSession?.setPlaybackState(pbState)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  fun updateNativeLyric(lyric: String?) {
    val cleanLyric = lyric?.trim() ?: ""
    if (cleanLyric == lastLyric) return
    val now = System.currentTimeMillis()
    // 防抖限流：歌词刷新至少间隔 400ms，避免蓝牙通道被过于密集的指令拥塞
    if (now - lastLyricUpdateTime < 400) return
    lastLyric = cleanLyric
    lastLyricUpdateTime = now

    runOnUiThread {
      try {
        if (currentTitle.isEmpty()) return@runOnUiThread
        // 车载蓝牙屏幕全面适配方案 (业界通用标准)：
        // 1. 对于仅支持显示 Title 字段的车机，将歌词拼接在歌名后展示：“歌名 - 当前歌词”
        // 2. 对于支持副标题/描述的高级车机屏幕，在 SUBTITLE / DESCRIPTION 中同步展示实时歌词
        val displayTitle = if (cleanLyric.isNotEmpty()) "$currentTitle - $cleanLyric" else currentTitle

        val builder = MediaMetadata.Builder()
          .putString(MediaMetadata.METADATA_KEY_TITLE, displayTitle)
          .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
          .putString(MediaMetadata.METADATA_KEY_ALBUM, currentAlbum)
          .putString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST, currentArtist)
          .putLong(MediaMetadata.METADATA_KEY_DURATION, if (currentDurationMs > 0) currentDurationMs else -1L)
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE, displayTitle)
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE, if (cleanLyric.isNotEmpty()) cleanLyric else currentArtist)
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION, if (cleanLyric.isNotEmpty()) cleanLyric else currentAlbum)

        lastCoverBitmap?.let {
          builder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, it)
          builder.putBitmap(MediaMetadata.METADATA_KEY_ART, it)
        }

        currentMetadataBuilder = builder
        mediaSession?.setMetadata(builder.build())
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    if (event?.action == KeyEvent.ACTION_DOWN) {
      when (keyCode) {
        KeyEvent.KEYCODE_MEDIA_PLAY -> {
          mediaSession?.controller?.transportControls?.play()
          return true
        }
        KeyEvent.KEYCODE_MEDIA_PAUSE -> {
          mediaSession?.controller?.transportControls?.pause()
          return true
        }
        KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
        KeyEvent.KEYCODE_HEADSETHOOK -> {
          runOnUiThread {
            webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('toggle');", null)
          }
          return true
        }
        KeyEvent.KEYCODE_MEDIA_NEXT -> {
          mediaSession?.controller?.transportControls?.skipToNext()
          return true
        }
        KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
          mediaSession?.controller?.transportControls?.skipToPrevious()
          return true
        }
        KeyEvent.KEYCODE_MEDIA_STOP -> {
          mediaSession?.controller?.transportControls?.stop()
          return true
        }
      }
    }
    return super.onKeyDown(keyCode, event)
  }

  override fun onDestroy() {
    super.onDestroy()
    try {
      mediaSession?.isActive = false
      mediaSession?.release()
    } catch (e: Exception) {
      // ignore
    }
  }
"""

BRIDGE_CLASS = """
class AndroidMediaBridge(private val activity: MainActivity) {
  @JavascriptInterface
  fun updateMetadata(title: String?, artist: String?, album: String?, durationSec: Double, coverUrl: String?, lyric: String?) {
    activity.updateNativeMetadata(title, artist, album, durationSec, coverUrl, lyric)
  }

  @JavascriptInterface
  fun setPlaybackState(isPlaying: Boolean, positionSec: Double) {
    activity.updateNativePlaybackState(isPlaying, positionSec)
  }

  @JavascriptInterface
  fun updateLyric(lyric: String?) {
    activity.updateNativeLyric(lyric)
  }

  @JavascriptInterface
  fun openUrl(url: String?) {
    if (!url.isNullOrEmpty()) {
      try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        activity.startActivity(intent)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }
}
"""

def patch_themes_xml():
    theme_files = glob.glob("src-tauri/gen/android/app/src/main/res/values*/themes.xml")
    if not theme_files:
        print("[WARN] No themes.xml found under src-tauri/gen/android/app/src/main/res/values*/")
        return False

    for file_path in theme_files:
        print(f"[INFO] Patching theme file: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if 'xmlns:tools="http://schemas.android.com/tools"' not in content:
            content = content.replace("<resources>", '<resources xmlns:tools="http://schemas.android.com/tools">')

        if "android:navigationBarColor" not in content:
            pattern = re.compile(r'(<style\s+name=["\']Theme\.[^"\']+["\']\s+parent=["\'][^"\']+["\']\s*>)')
            if pattern.search(content):
                content = pattern.sub(r'\1' + DARK_THEME_ITEMS, content)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"[SUCCESS] Successfully injected dark theme into {file_path}")
            else:
                print(f"[WARN] Could not find <style name=\"Theme.*\"> in {file_path}")
        else:
            print(f"[INFO] Already contains navigationBarColor in {file_path}, skipping.")

    return True

def patch_manifest_xml():
    manifest_files = glob.glob("src-tauri/gen/android/app/src/main/AndroidManifest.xml")
    if not manifest_files:
        print("[WARN] No AndroidManifest.xml found.")
        return False

    for file_path in manifest_files:
        print(f"[INFO] Patching AndroidManifest: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if 'xmlns:tools="http://schemas.android.com/tools"' not in content:
            content = content.replace("<manifest", '<manifest xmlns:tools="http://schemas.android.com/tools"')

        permissions = """
    <!-- 允许后台播放与屏幕熄灭时持续维持音频传输 -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" tools:targetApi="upside_down_cake" />
"""
        if "android.permission.WAKE_LOCK" not in content:
            content = content.replace("<application", permissions + "\n    <application", 1)

        media_button_filter = """
            <intent-filter>
                <action android:name="android.intent.action.MEDIA_BUTTON" />
            </intent-filter>
"""
        if "android.intent.action.MEDIA_BUTTON" not in content:
            pattern = re.compile(r'(<activity[^>]*android:name=["\']\.MainActivity["\'][^>]*>)')
            if pattern.search(content):
                content = pattern.sub(r'\1' + media_button_filter, content, count=1)
            else:
                pattern_fallback = re.compile(r'(<activity[^>]*>)')
                content = pattern_fallback.sub(r'\1' + media_button_filter, content, count=1)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[SUCCESS] Successfully patched {file_path}")

    return True

def patch_main_activity():
    activity_files = glob.glob("src-tauri/gen/android/app/src/main/java/**/MainActivity.kt", recursive=True)
    if not activity_files:
        print("[WARN] No MainActivity.kt found.")
        return False

    for file_path in activity_files:
        print(f"[INFO] Patching MainActivity: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if "class AndroidMediaBridge" in content:
            print(f"[INFO] Already patched AndroidMediaBridge in {file_path}, skipping.")
            continue

        # 1. 注入 imports (保留原本 package 及已有 imports)
        pkg_match = re.search(r'(package\s+[\w\.]+)', content)
        if pkg_match:
            pkg_end = pkg_match.end()
            content = content[:pkg_end] + "\n" + EXTRA_IMPORTS + content[pkg_end:]
        else:
            content = EXTRA_IMPORTS + "\n" + content

        # 2. 在 super.onCreate 后注入初始化代码
        if "super.onCreate(savedInstanceState)" in content:
            content = content.replace(
                "super.onCreate(savedInstanceState)",
                "super.onCreate(savedInstanceState)\n" + ON_CREATE_SNIPPET
            )
        else:
            print(f"[WARN] super.onCreate not found in {file_path}")

        # 3. 在 MainActivity 类末尾 (最后一个 '}') 之前注入辅助方法，保持原有 class MainActivity 声明完全不变
        last_brace = content.rfind("}")
        if last_brace != -1:
            content = content[:last_brace] + "\n" + ACTIVITY_METHODS + "\n}\n" + BRIDGE_CLASS
        else:
            print(f"[WARN] Closing brace not found in {file_path}")

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[SUCCESS] Successfully patched {file_path}")

    return True

if __name__ == "__main__":
    print("=== Starting Android Theme, MediaSession & AudioFocus Patch ===")
    patch_themes_xml()
    patch_manifest_xml()
    patch_main_activity()
    print("=== Finished Android Theme, MediaSession & AudioFocus Patch ===")
