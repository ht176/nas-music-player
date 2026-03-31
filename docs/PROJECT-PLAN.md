# 🎵 NAS 音乐播放器 - 项目开发计划

**创建时间:** 2026-03-28  
**当前阶段:** 规划完成，准备开发  
**版本:** 1.1 (已更新最新依赖)

---

## 📊 开发进度

```
规划阶段
├─ ✅ 需求分析 (PRD)
├─ ✅ 架构设计 (ARCHITECTURE)
├─ ✅ UI 设计 (UI-DESIGN)
└─ ⏳ 编码实现 (进行中)

开发阶段
├─ ⏳ Phase 1: 项目初始化
├─ ⏳ Phase 2: 核心组件
├─ ⏳ Phase 3: 播放功能
└─ ⏳ Phase 4:  polish 优化
```

---

## 📁 已创建文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **PRD.md** | `/nas-music-player/PRD.md` | 产品需求文档 |
| **ARCHITECTURE.md** | `/nas-music-player/ARCHITECTURE.md` | 技术架构文档 (v1.1) |
| **UI-DESIGN.md** | `/nas-music-player/UI-DESIGN.md` | UI 设计文档 |
| **PROJECT-PLAN.md** | `/nas-music-player/PROJECT-PLAN.md` | 开发计划 |
| **README.md** | `/nas-music-player/README.md` | 项目说明（待创建） |

---

## 🎯 Phase 1: 项目初始化

### 任务清单

- [ ] 创建 Vite + Vue 3 + TypeScript 项目
- [ ] 配置 Tailwind CSS 4
- [ ] 配置 ESLint + Prettier
- [ ] 配置 TypeScript
- [ ] 创建基础目录结构
- [ ] 创建基础组件

### 预计时间：2 小时

---

## 🎯 Phase 2: 核心组件开发

### 任务清单

- [ ] 布局组件 (Layout)
  - [ ] Header.vue
  - [ ] Sidebar.vue
  - [ ] PlayerBar.vue
  - [ ] MobileNav.vue

- [ ] 通用组件 (Common)
  - [ ] Button.vue
  - [ ] Input.vue
  - [ ] Slider.vue
  - [ ] Icon.vue

- [ ] 音乐组件 (Music)
  - [ ] SongList.vue
  - [ ] SongItem.vue
  - [ ] AlbumCover.vue
  - [ ] LyricsView.vue

- [ ] 路由配置
  - [ ] Vue Router 设置
  - [ ] 页面路由定义

### 预计时间：8 小时

---

## 🎯 Phase 3: 播放功能开发

### 任务清单

- [ ] 音频播放核心
  - [ ] useAudio.ts composable
  - [ ] player store (Pinia)
  - [ ] 播放控制逻辑

- [ ] API 集成
  - [ ] HTTP 请求封装
  - [ ] 音乐 API 接口
  - [ ] 歌单 API 接口

- [ ] 功能实现
  - [ ] 播放/暂停/切歌
  - [ ] 进度条控制
  - [ ] 音量控制
  - [ ] 播放模式（顺序/随机/循环）

### 预计时间：12 小时

---

## 🎯 Phase 4: 功能完善

### 任务清单

- [ ] 歌单管理
  - [ ] 创建/编辑/删除歌单
  - [ ] 添加/移除歌曲

- [ ] 搜索功能
  - [ ] 搜索框组件
  - [ ] 搜索结果展示
  - [ ] 搜索历史

- [ ] 收藏功能
  - [ ] 红心收藏
  - [ ] 收藏列表

- [ ] 歌词显示
  - [ ] LRC 解析
  - [ ] 歌词同步滚动

### 预计时间：10 小时

---

## 🎯 Phase 5: 优化与测试

### 任务清单

- [ ] 性能优化
  - [ ] 代码分割
  - [ ] 懒加载
  - [ ] 缓存策略

- [ ] 响应式测试
  - [ ] 移动端适配
  - [ ] 平板适配
  - [ ] 桌面端适配

- [ ] 测试
  - [ ] 单元测试
  - [ ] E2E 测试
  - [ ] 跨浏览器测试

- [ ] Bug 修复

### 预计时间：8 小时

---

## 📅 时间估算

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| Phase 1 | 项目初始化 | 2 小时 |
| Phase 2 | 核心组件 | 8 小时 |
| Phase 3 | 播放功能 | 12 小时 |
| Phase 4 | 功能完善 | 10 小时 |
| Phase 5 | 优化测试 | 8 小时 |
| **总计** | | **40 小时** |

---

## 🚀 快速开始命令

```bash
# 1. 进入项目目录
cd ~/.openclaw/workspace/nas-music-player

# 2. 创建 Vite 项目 (使用最新模板)
npm create vite@latest . -- --template vue-ts

# 3. 安装依赖
npm install

# 4. 安装额外依赖 (最新版本)
npm install vue@latest vue-router@latest pinia@latest @vueuse/core@latest
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
npm install -D eslint@latest prettier@latest

# 5. 初始化 Tailwind
npx tailwindcss init -p

# 6. 启动开发服务器
npm run dev
```

---

## 📦 依赖清单 (最新版本)

### 生产依赖

```json
{
  "dependencies": {
    "vue": "^3.5.31",
    "vue-router": "^5.0.4",
    "pinia": "^3.0.4",
    "@vueuse/core": "^13.0.0"
  }
}
```

### 开发依赖

```json
{
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "vite": "^8.0.3",
    "typescript": "^6.0.2",
    "vue-tsc": "^2.2.0",
    "tailwindcss": "^4.2.2",
    "postcss": "^8.5.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "prettier": "^3.5.0",
    "vitest": "^3.0.0"
  }
}
```

---

## ⚠️ 风险与注意事项

### 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| NAS API 未就绪 | 高 | 使用 Mock 数据开发 |
| 音频格式兼容性 | 中 | 优先支持 MP3/AAC |
| 移动端性能 | 中 | 早期真机测试 |
| 大列表渲染 | 中 | 虚拟滚动方案 |
| 新版本兼容性 | 低 | 关注 breaking changes |

### 待确认事项

- [ ] NAS 后端 API 接口文档
- [ ] 音乐文件存储路径
- [ ] 是否需要用户认证
- [ ] 部署目标环境

---

## 📝 下一步行动

1. **立即开始:** 初始化 Vite 项目
2. **需要确认:** NAS API 接口文档
3. **并行进行:** UI 组件开发 + 播放核心开发

---

**准备好了吗？让我们开始创建项目！** 🚀
