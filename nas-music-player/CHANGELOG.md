# 📝 NAS Music Player - 更新日志

## [1.1.0] - 2026-03-30

### ✨ 新增功能

#### 多服务器配置
- ✅ 支持配置多个 Navidrome 服务器
- ✅ 服务器列表管理（添加/编辑/删除）
- ✅ 快速切换活动服务器
- ✅ 服务器连接状态显示
- ✅ 配置持久化到 localStorage

#### 服务器管理
- ✅ 服务器卡片展示
- ✅ 一键测试连接
- ✅ 当前服务器标识
- ✅ 服务器名称自定义
- ✅ 空状态引导

### 🔧 优化改进

#### 代码清理
- ❌ 删除测试页面（NavidromeTest.vue）
- ❌ 删除测试路由
- ❌ 清理测试代码
- ✅ 简化配置页面

#### 用户体验
- ✅ 更直观的服务器管理界面
- ✅ 卡片式布局，清晰展示
- ✅ 状态指示器（已连接/连接失败/未测试）
- ✅ 快捷操作按钮

### 📦 技术变更

#### 路由调整
- 移除 `/navidrome-test` 路由
- 更新 `/navidrome-config` 为服务器管理页面

#### 存储结构
```typescript
// 新增多服务器存储
navidrome-servers: Server[]
navidrome-active-server: string

// Server 接口
interface Server {
  id: string
  name: string
  url: string
  username: string
  password: string
  status: 'connected' | 'error' | 'unknown'
  testing?: boolean
  lastTest?: number
}
```

### 📊 统计

- **删除文件:** 1 个（NavidromeTest.vue）
- **修改文件:** 3 个（NavidromeConfig.vue, router/index.ts, Sidebar.vue）
- **新增代码:** ~300 行
- **删除代码:** ~450 行

---

## [1.0.0] - 2026-03-30

### 🎉 首次发布

#### 核心功能
- ✅ 完整音乐播放功能
- ✅ 音乐库浏览（艺术家/专辑/歌曲）
- ✅ 实时搜索
- ✅ 歌词显示（LRC 解析 + 同步）
- ✅ 歌单管理
- ✅ 专辑详情页
- ✅ 艺术家详情页

#### 技术栈
- Vue 3.5.31
- Vite 8.0.3
- TypeScript 6.0.2
- Pinia 3.0.4
- Tailwind CSS 4.2.2

#### 测试覆盖
- 215 个测试用例
- 100% 通过率
- 15 个测试文件

#### 性能优化
- 虚拟滚动
- 骨架屏
- 路由懒加载
- 防抖节流

---

**更新完成！** 🚀
