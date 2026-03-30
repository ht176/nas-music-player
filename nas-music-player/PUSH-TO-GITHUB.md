# 🚀 推送到 GitHub 指南

## 当前状态
✅ 代码已提交到本地仓库
✅ 部署指南已添加

## 📝 推送步骤

### 1️⃣ 创建 GitHub 仓库

访问 https://github.com/new

**仓库信息：**
- **Repository name:** `nas-music-player`
- **Description:** NAS 音乐播放器 - 轻量、快速、美观的自托管音乐播放器
- **Public** 或 **Private**（推荐 Public）
- ❌ 不要勾选 "Add a README file"
- ❌ 不要勾选 "Add .gitignore"
- ❌ 不要勾选 "Choose a license"

点击 **Create repository**

---

### 2️⃣ 推送代码

在终端执行以下命令：

```bash
cd /Users/hetong/.openclaw/workspace

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/nas-music-player.git

# 推送代码
git push -u origin master
```

**如果提示已存在远程仓库：**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/nas-music-player.git
git push -u origin master
```

---

### 3️⃣ 验证推送

访问你的 GitHub 仓库：
```
https://github.com/YOUR_USERNAME/nas-music-player
```

确认文件已上传：
- ✅ package.json
- ✅ src/ 目录
- ✅ tests/ 目录
- ✅ 文档（README.md, DEPLOYMENT.md 等）

---

### 4️⃣ 部署到 Vercel（推荐）

#### 方法 A：通过 Vercel 官网

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 **"Add New Project"**
4. 选择 **"Import Git Repository"**
5. 找到并选择 `nas-music-player`
6. 点击 **"Import"**
7. 配置项目：
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
8. 点击 **"Deploy"**
9. 等待 1-2 分钟，获得部署 URL

#### 方法 B：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd nas-music-player
vercel

# 生产部署
vercel --prod
```

---

### 5️⃣ 配置环境变量（可选）

在 Vercel 项目设置中添加：

```
Settings → Environment Variables

VITE_NAVIDROME_URL=https://your-navidrome.com:4533
VITE_NAVIDROME_USERNAME=your-username
```

---

## 🎯 快速部署命令

```bash
# 1. 创建仓库后，执行：
cd /Users/hetong/.openclaw/workspace
git remote add origin https://github.com/YOUR_USERNAME/nas-music-player.git
git push -u origin master

# 2. 部署到 Vercel：
npm install -g vercel
vercel login
cd nas-music-player
vercel --prod
```

---

## 📊 部署后的 URL

- **GitHub:** `https://github.com/YOUR_USERNAME/nas-music-player`
- **Vercel:** `https://nas-music-player.vercel.app`
- **Netlify:** `https://nas-music-player.netlify.app`

---

## ⚠️ 注意事项

1. **node_modules 不需要提交** - 已在 .gitignore 中排除
2. **dist 不需要提交** - 构建产物，由 CI/CD 生成
3. **.env.local 不需要提交** - 包含敏感信息
4. **OpenClaw 工作空间文件不需要提交** - 已排除

---

## 🎉 完成！

推送成功后：
1. ✅ 代码已备份到 GitHub
2. ✅ 可以部署到 Vercel/Netlify
3. ✅ 可以分享给其他人使用
4. ✅ 支持自动 CI/CD

**下一步：** 访问部署后的 URL，配置你的 Navidrome 服务器！
