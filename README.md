# NAS Music Player (Tauri 2.0 + Vue 3)

一个轻量、极简、高保真且跨全平台（macOS、Windows、Linux、Android、iOS）的现代化私有 NAS 音乐播放器。

---

## 🚀 核心特性

- **协议兼容**：原生接入标准的 Subsonic / Navidrome API 协议，采用安全性极高的 MD5 + Salt 鉴权加密。
- **极致音质**：
  - 支持 FLAC、APE、WAV、MP3、AAC、OGG、M4A 等全格式回放；
  - 智能格式探测，针对特定浏览器格式无感自动启用服务端转码（format=mp3），杜绝解码异常；
  - 内置 **专业 10 段图形均衡器 (10-Band EQ)** 与 8 组经典音效预设。
- **无缝与沉浸体验**：
  - **Apple Music 风格动态流光极光背景**；
  - 毫秒级 LRC 逐行/逐字平滑居中滚动歌词（支持点击任意歌词即刻 Seek 跳转）；
  - **16 阶平滑交叉淡入淡出 (Crossfade)**；
  - **换曲零延迟无缝预加载 (Gapless Playback)**；
  - **桌面悬浮迷你播放器 / 画中画小窗 (Mini Player)**。
- **离线与断网支持**：
  - 基于 IndexedDB 本地沙盒离线缓存，断网 0 流量秒开回放；
  - 专设「已下载音乐」专区与磁盘占用空间分析。
- **内容组织与工具**：
  - 红心收藏单曲/专辑（双向同步至 NAS）；
  - 歌单管理（新建/删除/查看）；
  - 艺术家作品墙；
  - `Ctrl+K` 全局即时模糊搜索浮窗；
  - 睡眠倒计时定时器 (Sleep Timer) 与双向听歌打卡 (Scrobble)；
  - 多服务器节点管理（内网/外网一键无感切换）。

---

## 🛠️ 本地运行与开发

```bash
# 1. 进入项目文件夹
cd nas-music-player

# 2. 安装依赖
pnpm install

# 3. 启动 Web 端开发服务器
pnpm dev

# 4. 构建 Web 生产包
pnpm build
```

---

## 📦 全平台桌面端 / 移动端原生打包 (Tauri 2.0)

本项目已完整配置 Tauri 2.0 跨平台原生运行时环境 (`src-tauri`)。

### 1. 准备环境
- 安装 [Rust 工具链](https://rustup.rs/)（运行 `rustup-init.exe` 并安装稳定版）。
- Windows 环境需确保已安装 Visual Studio C++ 生成工具或 WebView2。

### 2. 桌面端一键编译打包
```bash
# Windows (.exe / .msi 安装包)
pnpm tauri:build

# macOS (.dmg / .app 安装包)
pnpm tauri:build --target universal-apple-darwin

# Linux (.deb / .AppImage)
pnpm tauri:build
```

### 3. 移动端编译打包 (Android / iOS)
```bash
# Android (.apk)
pnpm tauri android init
pnpm tauri android build

# iOS (.ipa)
pnpm tauri ios init
pnpm tauri ios build
```

---

## 💡 常见问题与排错 (FAQ)

### macOS 提示「“NAS Music Player”已损坏，无法打开。你应该将它移到废纸篓」
- **原因**：开源软件未经 Apple 商业付费证书（每年 $99）公证，从浏览器或 GitHub 下载时 macOS Gatekeeper 隔离机制会自动打上 `com.apple.quarantine` 属性并拦截运行。
- **解决方法**：打开系统终端（Terminal），执行以下单行命令清除隔离属性与重新赋予本地签名即可正常打开：
  ```bash
  xattr -cr "/Applications/NAS Music Player.app" && codesign --force --deep --sign - "/Applications/NAS Music Player.app"
  ```

### Windows 安装时提示选择 Remove 卸载旧版本？
- **原因**：如果下载的是 `.msi`（微软企业分发格式），当系统已安装过该应用时，Windows Installer 会强制触发“维护模式”（Maintenance Mode：修复或卸载），必须点击 Remove 卸载退出后再重新打开安装。
- **解决方法**：强烈推荐 Windows 用户下载 **`.exe` (x64-setup.exe)** 安装包。该安装包由 NSIS 构建，具备智能覆盖升级能力，会自动检测旧版并一次性平滑升级完成，绝不会提示手动 Remove。


