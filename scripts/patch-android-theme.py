#!/usr/bin/env python3
"""
patch-android-theme.py
自动为 Tauri 生成的 Android 原生工程注入深色沉浸主题配置：
1. 修复小米/MIUI/HyperOS 及原生 Android 全面屏手势导航栏呈白色的问题，统一设为 #060609 深色背景并开启白色手势线。
2. 消除冷启动白屏，设置窗口原生背景为 #060609。
3. 动态配置 MainActivity.kt，设置 WindowInsetsController 与 NavigationBarColor。
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
            # 匹配任意 <style name="Theme.*" parent="*">
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

def patch_main_activity():
    activity_files = glob.glob("src-tauri/gen/android/app/src/main/java/**/MainActivity.kt", recursive=True)
    if not activity_files:
        print("[WARN] No MainActivity.kt found.")
        return False

    for file_path in activity_files:
        print(f"[INFO] Patching MainActivity: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 注入颜色控制代码到 onCreate
        snippet = """
    try {
      window.statusBarColor = android.graphics.Color.parseColor("#060609")
      window.navigationBarColor = android.graphics.Color.parseColor("#060609")
      androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)?.let {
        it.isAppearanceLightStatusBars = false
        it.isAppearanceLightNavigationBars = false
      }
    } catch (e: Exception) {
      // 容错处理
    }
"""
        if "window.navigationBarColor" not in content:
            if "super.onCreate(savedInstanceState)" in content:
                content = content.replace(
                    "super.onCreate(savedInstanceState)",
                    "super.onCreate(savedInstanceState)\n" + snippet
                )
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"[SUCCESS] Successfully patched {file_path}")
            else:
                print(f"[WARN] super.onCreate not found in {file_path}")
        else:
            print(f"[INFO] Already patched navigation bar color in {file_path}")

    return True

if __name__ == "__main__":
    print("=== Starting Android Theme & Navigation Bar Patch ===")
    patch_themes_xml()
    patch_main_activity()
    print("=== Finished Android Theme & Navigation Bar Patch ===")
