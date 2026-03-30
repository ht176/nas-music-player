# 🚀 NAS Music Player - 部署指南

## 📦 方式一：GitHub + Vercel（推荐）

### 1. 创建 GitHub 仓库

```bash
# 在 GitHub 上创建新仓库
# 访问 https://github.com/new
# 仓库名：nas-music-player
# 设为 Public 或 Private
```

### 2. 推送代码到 GitHub

```bash
# 添加远程仓库（替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/nas-music-player.git

# 推送代码
git push -u origin master
```

### 3. 部署到 Vercel

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择 "Import Git Repository"
   - 选择 `nas-music-player` 仓库
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 1-2 分钟）
   - 获得部署 URL：`https://nas-music-player.vercel.app`

### 4. 配置环境变量（可选）

在 Vercel 项目设置中添加：

```
VITE_NAVIDROME_URL=https://your-navidrome.com:4533
VITE_NAVIDROME_USERNAME=your-username
```

---

## 📦 方式二：GitHub + Netlify

### 1. 推送代码到 GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/nas-music-player.git
git push -u origin master
```

### 2. 部署到 Netlify

1. **访问 Netlify**
   - 打开 https://netlify.com
   - 使用 GitHub 账号登录

2. **添加站点**
   - 点击 "Add new site"
   - 选择 "Import an existing project"
   - 选择 GitHub
   - 选择 `nas-music-player` 仓库

3. **配置构建**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

4. **部署**
   - 点击 "Deploy site"
   - 获得部署 URL：`https://nas-music-player.netlify.app`

---

## 📦 方式三：Docker 部署到 NAS

### 1. 构建 Docker 镜像

```bash
# 在项目根目录创建 Dockerfile
cd nas-music-player

# 构建镜像
docker build -t nas-music-player .
```

### 2. Dockerfile 内容

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 3. nginx.conf 配置

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. 运行容器

```bash
# 运行容器
docker run -d \
  --name nas-music-player \
  -p 3000:80 \
  nas-music-player

# 访问 http://localhost:3000
```

### 5. 群晖 Docker 部署

1. **打开 Docker 应用**
2. **注册表** - 搜索并拉取镜像（或本地构建）
3. **映像** - 选择 `nas-music-player`
4. **启动** - 配置：
   - 网络端口：本地 3000 → 容器 80
   - 环境变量（可选）：NAVIDROME_URL
5. **完成** - 访问 `http://your-nas-ip:3000`

---

## 📦 方式四：直接部署到 NAS Web 服务器

### 1. 构建项目

```bash
cd nas-music-player
npm run build
```

### 2. 上传到 NAS

```bash
# 使用 SCP 上传
scp -r dist/* user@nas-ip:/volume1/web/music-player/

# 或使用群晖 File Station 拖拽上传
```

### 3. 配置 Web Station

1. **打开 Web Station**
2. **创建虚拟主机**
   - 文档根目录：`/volume1/web/music-player`
   - 端口：8001（或其他可用端口）
3. **应用配置**

### 4. 访问

```
http://nas-ip:8001
```

---

## 📦 方式五：GitHub Pages

### 1. 配置 Vite

修改 `vite.config.ts`：

```typescript
export default defineConfig({
  base: '/nas-music-player/',
  // ...其他配置
})
```

### 2. 安装 gh-pages

```bash
npm install -D gh-pages
```

### 3. 添加部署脚本

修改 `package.json`：

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### 4. 部署

```bash
npm run deploy
```

### 5. 配置 GitHub Pages

1. 访问仓库 Settings
2. 选择 Pages
3. Source 选择 `gh-pages` 分支
4. 保存后访问：`https://your-username.github.io/nas-music-player/`

---

## 🔧 部署后配置

### 配置 Navidrome 服务器

1. 访问部署后的网站
2. 进入 **服务器配置** 页面
3. 添加你的 Navidrome 服务器：
   - 服务器名称：例如 "家庭 NAS"
   - 服务器地址：`https://your-navidrome.com:4533`
   - 用户名：你的用户名
   - 密码：你的密码
4. 点击 **测试** 验证连接
5. 点击 **保存**

### 多服务器配置

可以配置多个服务器并快速切换：
- 家庭 NAS
- 公司服务器
- 朋友服务器

---

## ⚡ 性能优化建议

### 生产环境优化

1. **启用 HTTPS**
   ```bash
   # 使用 Let's Encrypt
   certbot --nginx -d your-domain.com
   ```

2. **配置 CDN**
   - Cloudflare（免费）
   - Vercel 自带 CDN
   - Netlify 自带 CDN

3. **启用 Gzip/Brotli 压缩**
   ```nginx
   # nginx 配置
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

4. **配置缓存**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
     expires 1y;
     add_header Cache-Control "public, immutable";
   }
   ```

---

## 🐛 常见问题

### 1. 跨域问题 (CORS)

**解决：** 在 Navidrome 配置中启用 CORS

```properties
# Navidrome 配置文件
EnableGravatar = true
EnableExternalServices = true
```

### 2. 构建失败

**解决：** 清除缓存重新构建

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 3. 路由 404

**解决：** 配置服务器支持 SPA 路由

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 4. 无法连接 Navidrome

**解决：**
- 检查服务器地址是否正确（包含协议和端口）
- 确认 Navidrome 允许跨域访问
- 检查防火墙设置
- 使用 HTTPS 而非 HTTP（如果 Navidrome 使用 HTTPS）

---

## 📊 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 已选择部署平台（Vercel/Netlify/NAS）
- [ ] 已配置构建命令和输出目录
- [ ] 已添加环境变量（如需要）
- [ ] 已启用 HTTPS
- [ ] 已配置自定义域名（可选）
- [ ] 已测试 Navidrome 连接
- [ ] 已测试音乐播放功能
- [ ] 已测试搜索功能
- [ ] 已测试移动端适配

---

## 🎉 部署成功！

部署完成后，你可以：
- 随时随地访问你的音乐播放器
- 在手机、平板、电脑上使用
- 享受自托管的音乐流媒体服务

**祝你使用愉快！** 🎵
