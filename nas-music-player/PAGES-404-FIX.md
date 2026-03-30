# ⚠️ GitHub Pages 404 解决方案

## 问题诊断

访问 https://ht176.github.io/nas-music-player/ 显示 404

**原因：**
1. ✅ gh-pages 分支已创建
2. ✅ 构建产物已推送
3. ⚠️ GitHub Pages 还未正确配置
4. ⚠️ 需要手动启用 Pages

---

## 🔧 解决方案

### 方案 1：手动启用 GitHub Pages（推荐）

#### 步骤：

1. **访问仓库设置**
   - 打开：https://github.com/ht176/nas-music-player/settings/pages

2. **配置 Build and deployment**
   - **Source:** Deploy from a branch
   - **Branch:** 选择 `gh-pages`
   - **Folder:** `/ (root)`
   - 点击 **Save**

3. **等待部署**
   - GitHub 会自动部署
   - 约 1-2 分钟
   - 访问：https://github.com/ht176/nas-music-player/actions

4. **访问网站**
   - 部署完成后访问：https://ht176.github.io/nas-music-player/

---

### 方案 2：使用 GitHub Actions（已配置）

仓库已有 `.github/workflows/deploy.yml`，会自动部署。

**检查 Actions 状态：**
https://github.com/ht176/nas-music-player/actions

---

### 方案 3：检查 404.html

创建 `public/404.html` 处理 SPA 路由：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0;url=/nas-music-player/">
  <script>
    window.location.href = '/nas-music-player/' + window.location.pathname.slice('/nas-music-player'.length);
  </script>
</head>
<body>
  <p>Redirecting to NAS Music Player...</p>
</body>
</html>
```

---

## 📊 当前状态

- ✅ **GitHub 仓库:** https://github.com/ht176/nas-music-player
- ✅ **gh-pages 分支:** 已创建并推送
- ✅ **构建产物:** 已推送到 gh-pages
- ⚠️ **GitHub Pages:** 需要手动启用

---

## 🔗 快速链接

| 链接 | 操作 |
|------|------|
| **仓库设置** | https://github.com/ht176/nas-music-player/settings/pages |
| **Actions** | https://github.com/ht176/nas-music-player/actions |
| **gh-pages 分支** | https://github.com/ht176/nas-music-player/tree/gh-pages |
| **GitHub Pages** | https://ht176.github.io/nas-music-player/ |

---

## ⏱️ 部署时间

- **GitHub Pages 处理:** 1-2 分钟
- **CDN 生效:** 1-5 分钟
- **总计:** 约 2-5 分钟

---

## ✅ 检查清单

- [ ] gh-pages 分支已推送
- [ ] GitHub Pages 已启用（Settings → Pages）
- [ ] Source 选择 gh-pages 分支
- [ ] Folder 选择 / (root)
- [ ] 等待 Actions 完成
- [ ] 访问网站正常

---

**请立即访问仓库设置启用 GitHub Pages！** 🚀

https://github.com/ht176/nas-music-player/settings/pages
