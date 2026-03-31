# 🎵 NAS Music Player

**轻量、快速、美观的自托管音乐播放器**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Vue](https://img.shields.io/badge/vue-3.5.31-brightgreen.svg)
![Vite](https://img.shields.io/badge/vite-8.0.3-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-6.0.2-blue.svg)

---

## ✨ 特性

- 🏠 **私有部署** - 音乐数据完全掌握在自己手中
- 📱 **多端访问** - PC、手机、平板无缝切换
- 🎨 **精美界面** - 现代化的 UI 设计，优秀的视觉体验
- ⚡ **快速响应** - 低延迟播放，流畅的交互体验
- 🎵 **格式支持** - MP3、FLAC、AAC、WAV 等常见格式

---

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm >= 10.0.0

### 安装依赖

```bash
cd nas-music-player
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

输出到 `dist/` 目录

### 预览构建

```bash
npm run preview
```

---

## 📁 项目结构

```
nas-music-player/
├── src/
│   ├── api/              # API 接口层
│   ├── assets/           # 资源文件
│   ├── components/       # 组件库
│   ├── composables/      # 组合式函数
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── types/            # TypeScript 类型
│   ├── utils/            # 工具函数
│   ├── views/            # 页面视图
│   ├── App.vue           # 根组件
│   ├── main.ts           # 入口文件
│   └── style.css         # 全局样式
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🛠️ 技术栈

### 前端核心

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5.31 | UI 框架 |
| TypeScript | 6.0.2 | 类型系统 |
| Vite | 8.0.3 | 构建工具 |
| Vue Router | 5.0.4 | 路由管理 |
| Pinia | 3.0.4 | 状态管理 |

### UI 与样式

| 技术 | 版本 | 用途 |
|------|------|------|
| Tailwind CSS | 4.2.2 | CSS 框架 |
| VueUse | 13.0.0 | 组合式工具 |

### 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| ESLint | 9.0.0 | 代码检查 |
| Prettier | 3.5.0 | 代码格式化 |
| Vue TSC | 2.2.0 | 类型检查 |

---

## 📝 开发命令

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format

# 预览构建
npm run preview
```

---

## 🎨 UI 设计

### 配色方案

- **主色**: 温暖琥珀 `#f59e0b`
- **背景**: 深色主题 `#0a0a0a`
- **文字**: 白色层次 `#ffffff` / `#a3a3a3` / `#737373`

### 设计风格

- Modern Dark Minimal (现代深色极简)
- 毛玻璃效果
- 流畅动效
- 响应式设计

---

## 📋 开发计划

### Phase 1: 项目初始化 ✅

- [x] 创建 Vite 项目
- [x] 配置 Tailwind CSS 4
- [x] 配置 TypeScript
- [x] 创建基础目录结构
- [ ] 创建基础组件

### Phase 2: 核心组件开发

- [ ] 布局组件 (Header, Sidebar, PlayerBar)
- [ ] 通用组件 (Button, Input, Slider)
- [ ] 音乐组件 (SongList, SongItem, AlbumCover)

### Phase 3: 播放功能开发

- [ ] 音频播放核心 (useAudio)
- [ ] 播放器状态 (Pinia Store)
- [ ] 播放控制 (播放/暂停/切歌)

### Phase 4: 功能完善

- [ ] 歌单管理
- [ ] 搜索功能
- [ ] 收藏功能
- [ ] 歌词显示

### Phase 5: 优化与测试

- [ ] 性能优化
- [ ] 响应式测试
- [ ] 单元测试
- [ ] Bug 修复

---

## 📄 相关文档

- [产品需求文档 (PRD)](./PRD.md)
- [技术架构文档](./ARCHITECTURE.md)
- [UI 设计文档](./UI-DESIGN.md)
- [开发计划](./PROJECT-PLAN.md)

---

## ⚠️ 注意事项

### 后端 API

本项目是前端播放器，需要 NAS 后端提供以下 API：

- 音乐文件列表
- 音乐文件流
- 歌词文件
- 专辑封面
- 歌单管理

### 浏览器兼容

- Chrome >= 120
- Safari >= 17
- Firefox >= 120
- Edge >= 120

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Jarvis - NAS Music Player

---

**🎵 Enjoy your music!**
