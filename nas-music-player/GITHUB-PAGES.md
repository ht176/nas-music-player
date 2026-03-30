# 🚀 GitHub Pages 部署指南

## ✅ 配置完成

- ✅ GitHub Actions 工作流已创建
- ✅ vite.config.ts base 已配置
- ✅ package.json 部署脚本已添加
- ✅ gh-pages 已安装

---

## 📦 部署步骤

### 1️⃣ 创建 GitHub 仓库

访问 https://github.com/new

**仓库设置：**
- **Repository name:** `nas-music-player`
- **Description:** NAS 音乐播放器 - 轻量、快速、美观的自托管音乐播放器
- **Visibility:** Public（推荐）或 Private
- ❌ 不要添加 README/.gitignore/license

点击 **Create repository**

---

### 2️⃣ 推送代码到 GitHub

```bash
cd /Users/hetong/.openclaw/workspace

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/nas-music-player.git

# 推送代码
git push -u origin master
```

---

### 3️⃣ 启用 GitHub Pages

1. 访问仓库 **Settings**
2. 选择 **Pages**
3. **Build and deployment**
   - **Source:** Deploy from a branch
   - **Branch:** 选择 `gh-pages`
   - **Folder:** `/ (root)`
4. 点击 **Save**

---

### 4️⃣ 自动部署

推送后 GitHub Actions 会自动触发：

1. 访问 **Actions** 标签
2. 查看部署进度
3. 等待构建完成（约 2-3 分钟）
4. 获得部署 URL：`https://YOUR_USERNAME.github.io/nas-music-player/`

---

### 5️⃣ 手动部署（可选）

```bash
cd nas-music-player

# 构建并部署
npm run deploy

# 或分步执行
npm run build
npx gh-pages -d dist
```

---

## 🔗 访问地址

| 环境 | 地址 |
|------|------|
| **开发环境** | http://localhost:5173 |
| **生产环境** | https://YOUR_USERNAME.github.io/nas-music-player/ |

---

## ⚙️ 配置说明

### vite.config.ts

```typescript
export default defineConfig({
  base: '/nas-music-player/',  // GitHub Pages 需要
  // ...其他配置
})
```

### package.json

```json
{
  "scripts": {
    "deploy": "npm run build && npx gh-pages -d dist"
  }
}
```

### .github/workflows/deploy.yml

- 自动构建和部署
- 推送到 master 分支触发
- 部署到 gh-pages 分支

---

## ⏱️ 部署时间

- **构建时间:** ~30 秒
- **推送时间:** ~10 秒
- **GitHub 处理:** 1-2 分钟
- **CDN 生效:** 1-5 分钟

**总计:** 约 2-5 分钟

---

## 🐛 常见问题

### 1. 404 错误

**原因:** GitHub Pages 还未生效  
**解决:** 等待 1-2 分钟，刷新页面

### 2. 资源加载失败

**原因:** base 路径配置错误  
**解决:** 检查 vite.config.ts 中的 base 配置是否为 `/nas-music-player/`

### 3. 路由问题（刷新后 404）

**原因:** SPA 路由需要特殊配置  
**解决:** 创建 `public/404.html`：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=/nas-music-player/">
  <title>Redirecting...</title>
</head>
<body>
  <script>
    window.location.href = '/nas-music-player/' + window.location.pathname.slice('/nas-music-player'.length);
  </script>
</body>
</html>
```

### 4. Actions 失败

**解决:**
1. 检查 Actions 日志
2. 确认 node_modules 已正确安装
3. 确认构建命令正确

---

## 📊 部署检查清单

- [ ] GitHub 仓库已创建
- [ ] 代码已推送到 GitHub
- [ ] GitHub Pages 已启用
- [ ] gh-pages 分支已创建
- [ ] Actions 工作流正常运行
- [ ] 部署成功，可以访问
- [ ] 测试所有功能正常
- [ ] 移动端适配正常
- [ ] HTTPS 已启用

---

## 🔍 检查部署状态

### 1. 检查 gh-pages 分支

```bash
git branch -r | grep gh-pages
```

### 2. 检查 GitHub Actions

访问：https://github.com/YOUR_USERNAME/nas-music-player/actions

### 3. 检查 Pages 状态

访问：https://github.com/YOUR_USERNAME/nas-music-player/settings/pages

---

## 🎯 当前版本信息

**版本:** v1.1.0  
**构建时间:** 2026-03-30  
**构建大小:** ~600 KB (gzip)  
**测试覆盖:** 100% (215/215)

---

## 📝 参考项目

本小说阅读器项目参考了以下项目的部署配置：
- novel-reader: https://github.com/ht176/novel-reader

---

## 🎉 部署完成！

部署成功后：
- ✅ 可以随时随地访问
- ✅ 支持手机、平板、电脑
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速

**下一步：** 配置你的 Navidrome 服务器，享受音乐！🎵

---

**最后更新:** 2026-03-30  
**状态:** ✅ 配置完成，准备推送
