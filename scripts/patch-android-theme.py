#!/usr/bin/env python3
"""
patch-android-theme.py
自动为 Tauri 生成的 Android 原生工程注入深色沉浸主题、车载蓝牙 AVRCP、方向盘按键与导航避让降音 (Audio Focus Ducking)：
1. 修复全面屏手势导航栏呈白色的问题，统一设为 #060609 深色背景并开启白色手势线。
2. 消除冷启动白屏，设置窗口原生背景为 #060609。
3. 注入 AndroidManifest 权限 (WAKE_LOCK, FOREGROUND_SERVICE) 与 MEDIA_BUTTON 意图过滤器。
4. 注入 MainActivity.kt：
   - 实例化原生 android.media.session.MediaSession，向车载蓝牙 (AVRCP) 广播歌曲名称、歌手、专辑名、持续时间、专辑封面与当前滚动歌词。
   - 监听车载方向盘/蓝牙按键 (Next, Prev, Play, Pause, Stop, Seek) 并通过 WebView 回调给 Web 前端。
   - 接入 AudioManager AudioFocus，当高德/百度/腾讯等导航语音播报时自动触发 Transient Ducking 避让降音至 20%，播报完毕即刻无缝恢复。
   - 注册 AndroidMediaBridge JavascriptInterface 供前端直接交互。
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

def patch_themes_xml():
    theme_files = glob.glob("src-tauri/gen/android/app/src/main/res/values*/themes.xml")
    if not theme_files:
        print("[WARN] No themes.xml found under src-tauri/gen/android/app/src/main/res/values*/")
        return False

    for file_path in theme_files:
        print(f"[INFO] Patching theme file: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 确保 tools 命名空间存在
        if 'xmlns:tools="http://schemas.android.com/tools"' not in content:
            content = content.replace("<resources>", '<resources xmlns:tools="http://schemas.android.com/tools">')

        # 避免重复注入
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

        pkg_match = re.search(r'package\s+([\w\.]+)', content)
        package_name = pkg_match.group(1) if pkg_match else "com.nas.music.player"

        new_activity_content = f"""package {package_name}

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.view.WindowCompat
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : app.tauri.TauriActivity() {{
  private var webViewInstance: WebView? = null
  private var mediaSession: MediaSession? = null
  private var audioManager: AudioManager? = null
  private var audioFocusRequest: AudioFocusRequest? = null
  private var audioFocusChangeListener: AudioManager.OnAudioFocusChangeListener? = null
  private var hasAudioFocus = false
  private var currentMetadataBuilder: MediaMetadata.Builder? = null
  private var lastCoverUrl: String = ""
  private var lastCoverBitmap: Bitmap? = null

  override fun onCreate(savedInstanceState: Bundle?) {{
    super.onCreate(savedInstanceState)
    try {{
      window.statusBarColor = Color.parseColor("#060609")
      window.navigationBarColor = Color.parseColor("#060609")
      WindowCompat.getInsetsController(window, window.decorView)?.let {{
        it.isAppearanceLightStatusBars = false
        it.isAppearanceLightNavigationBars = false
      }}
    }} catch (e: Exception) {{
      e.printStackTrace()
    }}

    initAudioService()
    initMediaSession()
  }}

  override fun onWebViewCreate(webView: WebView) {{
    super.onWebViewCreate(webView)
    webViewInstance = webView
    try {{
      webView.settings.mediaPlaybackRequiresUserGesture = false
    }} catch (e: Exception) {{
      e.printStackTrace()
    }}
    webView.addJavascriptInterface(AndroidMediaBridge(this), "AndroidMediaBridge")
  }}

  private fun initAudioService() {{
    try {{
      audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
      audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener {{ focusChange ->
        handleAudioFocusChange(focusChange)
      }}
    }} catch (e: Exception) {{
      e.printStackTrace()
    }}
  }}

  private fun initMediaSession() {{
    try {{
      mediaSession = MediaSession(this, "AuraNASMusicPlayer").apply {{
        setFlags(
          MediaSession.FLAG_HANDLES_MEDIA_BUTTONS or
          MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS
        )
        setCallback(object : MediaSession.Callback() {{
          override fun onPlay() {{
            runOnUiThread {{
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('play');", null)
            }}
          }}

          override fun onPause() {{
            runOnUiThread {{
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('pause');", null)
            }}
          }}

          override fun onSkipToNext() {{
            runOnUiThread {{
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('next');", null)
            }}
          }}

          override fun onSkipToPrevious() {{
            runOnUiThread {{
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('prev');", null)
            }}
          }}

          override fun onStop() {{
            runOnUiThread {{
              webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('pause');", null)
            }}
          }}

          override fun onSeekTo(pos: Long) {{
            runOnUiThread {{
              webViewInstance?.evaluateJavascript("window.__AURA_ON_SEEK_TO__ && window.__AURA_ON_SEEK_TO__($pos);", null)
            }}
          }}

          override fun onMediaButtonEvent(mediaButtonIntent: Intent): Boolean {{
            val keyEvent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {{
              mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT, KeyEvent::class.java)
            }} else {{
              @Suppress("DEPRECATION")
              mediaButtonIntent.getParcelableExtra<KeyEvent>(Intent.EXTRA_KEY_EVENT)
            }}
            if (keyEvent != null && keyEvent.action == KeyEvent.ACTION_DOWN) {{
              when (keyEvent.keyCode) {{
                KeyEvent.KEYCODE_MEDIA_PLAY -> onPlay()
                KeyEvent.KEYCODE_MEDIA_PAUSE -> onPause()
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                KeyEvent.KEYCODE_HEADSETHOOK -> {{
                  runOnUiThread {{
                    webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('toggle');", null)
                  }}
                }}
                KeyEvent.KEYCODE_MEDIA_NEXT -> onSkipToNext()
                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> onSkipToPrevious()
                KeyEvent.KEYCODE_MEDIA_STOP -> onStop()
              }}
              return true
            }}
            return super.onMediaButtonEvent(mediaButtonIntent)
          }}
        }})
        isActive = true
      }}
    }} catch (e: Exception) {{
      e.printStackTrace()
    }}
  }}

  fun requestAudioFocus() {{
    if (hasAudioFocus) return
    val am = audioManager ?: return
    val listener = audioFocusChangeListener ?: return
    try {{
      val res = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {{
        val attrs = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
          .build()
        val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
          .setAudioAttributes(attrs)
          .setAcceptsDelayedFocusGain(true)
          .setWillPauseWhenDucked(false)
          .setOnAudioFocusChangeListener(listener)
          .build()
        audioFocusRequest = req
        am.requestAudioFocus(req)
      }} else {{
        @Suppress("DEPRECATION")
        am.requestAudioFocus(listener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
      }}
      hasAudioFocus = (res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED)
    }} catch (e: Exception) {{
      e.printStackTrace()
    }}
  }}

  fun abandonAudioFocus() {{
    if (!hasAudioFocus) return
    val am = audioManager ?: return
    try {{
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {{
        audioFocusRequest?.let {{ am.abandonAudioFocusRequest(it) }}
      }} else {{
        audioFocusChangeListener?.let {{
          @Suppress("DEPRECATION")
          am.abandonAudioFocus(it)
        }}
      }}
    }} catch (e: Exception) {{
      e.printStackTrace()
    }}
    hasAudioFocus = false
  }}

  private fun handleAudioFocusChange(focusChange: Int) {{
    runOnUiThread {{
      when (focusChange) {{
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {{
          // 导航播报中，临时调低音量 (避让降音至 20%)
          webViewInstance?.evaluateJavascript("window.__AURA_ON_DUCK__ && window.__AURA_ON_DUCK__(true);", null)
        }}
        AudioManager.AUDIOFOCUS_GAIN -> {{
          // 导航播报结束，恢复音量
          webViewInstance?.evaluateJavascript("window.__AURA_ON_DUCK__ && window.__AURA_ON_DUCK__(false);", null)
        }}
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {{
          // 来电等暂时丢失焦点，暂停播放
          webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('pause');", null)
        }}
        AudioManager.AUDIOFOCUS_LOSS -> {{
          // 永久丢失音频焦点（如其他音乐 App 开始出声），暂停并放弃焦点
          webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('pause');", null)
          abandonAudioFocus()
        }}
      }}
    }}
  }}

  fun updateNativeMetadata(title: String?, artist: String?, album: String?, durationSec: Double, coverUrl: String?, lyric: String?) {{
    runOnUiThread {{
      try {{
        val durMs = (durationSec * 1000).toLong()
        val builder = MediaMetadata.Builder()
          .putString(MediaMetadata.METADATA_KEY_TITLE, title ?: "")
          .putString(MediaMetadata.METADATA_KEY_ARTIST, artist ?: "")
          .putString(MediaMetadata.METADATA_KEY_ALBUM, album ?: "")
          .putString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST, artist ?: "")
          .putLong(MediaMetadata.METADATA_KEY_DURATION, durMs)
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE, title ?: "")
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE, lyric ?: (artist ?: ""))
          .putString(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION, lyric ?: "")

        if (lastCoverBitmap != null && coverUrl == lastCoverUrl) {{
          builder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, lastCoverBitmap)
          builder.putBitmap(MediaMetadata.METADATA_KEY_ART, lastCoverBitmap)
        }}

        currentMetadataBuilder = builder
        mediaSession?.setMetadata(builder.build())
      }} catch (e: Exception) {{
        e.printStackTrace()
      }}
    }}

    if (!coverUrl.isNullOrEmpty() && coverUrl != lastCoverUrl) {{
      lastCoverUrl = coverUrl
      Thread {{
        try {{
          val url = URL(coverUrl)
          val conn = url.openConnection() as HttpURLConnection
          conn.connectTimeout = 4000
          conn.readTimeout = 4000
          conn.doInput = true
          conn.connect()
          val stream = conn.inputStream
          val bitmap = BitmapFactory.decodeStream(stream)
          stream.close()
          conn.disconnect()
          if (bitmap != null) {{
            lastCoverBitmap = bitmap
            runOnUiThread {{
              currentMetadataBuilder?.let {{ b ->
                b.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bitmap)
                b.putBitmap(MediaMetadata.METADATA_KEY_ART, bitmap)
                mediaSession?.setMetadata(b.build())
              }}
            }}
          }}
        }} catch (e: Exception) {{
          // 封面图片加载失败时容错静默
        }}
      }}.start()
    }}
  }}

  fun updateNativePlaybackState(isPlaying: Boolean, positionSec: Double) {{
    runOnUiThread {{
      try {{
        if (isPlaying) {{
          requestAudioFocus()
          mediaSession?.isActive = true
        }}
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
          .setState(state, posMs, 1.0f)
          .build()
        mediaSession?.setPlaybackState(pbState)
      }} catch (e: Exception) {{
        e.printStackTrace()
      }}
    }}
  }}

  fun updateNativeLyric(lyric: String?) {{
    runOnUiThread {{
      try {{
        val text = lyric ?: ""
        currentMetadataBuilder?.let {{ b ->
          b.putString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE, text)
          b.putString(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION, text)
          mediaSession?.setMetadata(b.build())
        }}
      }} catch (e: Exception) {{
        e.printStackTrace()
      }}
    }}
  }}

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {{
    if (event?.action == KeyEvent.ACTION_DOWN) {{
      when (keyCode) {{
        KeyEvent.KEYCODE_MEDIA_PLAY -> {{
          mediaSession?.controller?.transportControls?.play()
          return true
        }}
        KeyEvent.KEYCODE_MEDIA_PAUSE -> {{
          mediaSession?.controller?.transportControls?.pause()
          return true
        }}
        KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
        KeyEvent.KEYCODE_HEADSETHOOK -> {{
          runOnUiThread {{
            webViewInstance?.evaluateJavascript("window.__AURA_ON_MEDIA_ACTION__ && window.__AURA_ON_MEDIA_ACTION__('toggle');", null)
          }}
          return true
        }}
        KeyEvent.KEYCODE_MEDIA_NEXT -> {{
          mediaSession?.controller?.transportControls?.skipToNext()
          return true
        }}
        KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {{
          mediaSession?.controller?.transportControls?.skipToPrevious()
          return true
        }}
        KeyEvent.KEYCODE_MEDIA_STOP -> {{
          mediaSession?.controller?.transportControls?.stop()
          return true
        }}
      }}
    }}
    return super.onKeyDown(keyCode, event)
  }}

  override fun onDestroy() {{
    super.onDestroy()
    try {{
      abandonAudioFocus()
      mediaSession?.isActive = false
      mediaSession?.release()
    }} catch (e: Exception) {{
      // ignore
    }}
  }}
}}

class AndroidMediaBridge(private val activity: MainActivity) {{
  @JavascriptInterface
  fun updateMetadata(title: String?, artist: String?, album: String?, durationSec: Double, coverUrl: String?, lyric: String?) {{
    activity.updateNativeMetadata(title, artist, album, durationSec, coverUrl, lyric)
  }}

  @JavascriptInterface
  fun setPlaybackState(isPlaying: Boolean, positionSec: Double) {{
    activity.updateNativePlaybackState(isPlaying, positionSec)
  }}

  @JavascriptInterface
  fun updateLyric(lyric: String?) {{
    activity.updateNativeLyric(lyric)
  }}
}}
"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_activity_content)
        print(f"[SUCCESS] Successfully patched {file_path}")

    return True

if __name__ == "__main__":
    print("=== Starting Android Theme, MediaSession & AudioFocus Patch ===")
    patch_themes_xml()
    patch_manifest_xml()
    patch_main_activity()
    print("=== Finished Android Theme, MediaSession & AudioFocus Patch ===")
