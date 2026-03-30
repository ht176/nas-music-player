# 🎵 Navidrome 集成指南

## ✅ 已完成

- [x] 环境变量配置
- [x] Navidrome API 封装 (`src/api/navidrome.ts`)
- [x] Pinia Store (`src/stores/navidrome.ts`)
- [x] 测试页面 (`/navidrome-test`)
- [x] 路由配置

## 🔧 配置

### 1. 环境变量

已创建以下文件：

```bash
# .env.example (示例配置，可提交)
VITE_NAVIDROME_URL=https://music.xiaoyunjia.site:6
VITE_NAVIDROME_USERNAME=hetong

# .env.local (实际配置，不提交)
VITE_NAVIDROME_URL=https://music.xiaoyunjia.site:6
VITE_NAVIDROME_USERNAME=hetong
VITE_NAVIDROME_PASSWORD=your-password
```

### 2. 依赖

已安装：
- `crypto-js` - 用于 Subsonic API 认证

## 📡 API 封装

### 位置
`src/api/navidrome.ts`

### 支持的功能

| 功能 | 方法 | 说明 |
|------|------|------|
| 测试连接 | `ping()` | 测试服务器连接 |
| 获取歌曲 | `getSong(id)` | 获取歌曲详情 |
| 流媒体播放 | `getStreamUrl(id)` | 获取播放 URL |
| 专辑封面 | `getCoverArtUrl(id)` | 获取封面 URL |
| 专辑列表 | `getAlbumList()` | 获取专辑列表 |
| 艺术家列表 | `getArtists()` | 获取艺术家列表 |
| 搜索 | `search3(query)` | 搜索歌曲/专辑/艺术家 |
| 歌词 | `getLyrics(id)` | 获取歌词 |
| 收藏 | `star(id)` / `unstar(id)` | 收藏/取消收藏 |
| 随机歌曲 | `getRandomSongs()` | 获取随机歌曲 |
| 最常播放 | `getTopSongs()` | 获取最常播放 |
| 最近播放 | `getNowPlaying()` | 获取最近播放 |

## 🏪 Pinia Store

### 位置
`src/stores/navidrome.ts`

### 状态

```typescript
{
  connected: boolean,      // 是否已连接
  loading: boolean,        // 是否加载中
  error: string | null,    // 错误信息
  songs: Song[],          // 歌曲列表
  albums: Album[],        // 专辑列表
  artists: Artist[],      // 艺术家列表
  searchResults: object,  // 搜索结果
  currentSong: Song | null // 当前歌曲
}
```

### 方法

```typescript
// 测试连接
await store.testConnection()

// 加载数据
await store.loadSongs(50)
await store.loadAlbums('random', 20)
await store.loadArtists()

// 搜索
await store.search('周杰伦')

// 播放
const url = store.getStreamUrl(songId)
const coverUrl = store.getCoverArtUrl(coverArtId)

// 收藏
await store.toggleFavorite(songId, isFavorite)
```

## 🧪 测试页面

### 访问地址
http://localhost:5173/navidrome-test

### 功能
- ✅ 连接测试
- ✅ 加载随机歌曲
- ✅ 加载专辑
- ✅ 加载艺术家
- ✅ 歌曲播放测试
- ✅ 错误提示

## 🚀 使用示例

### 在组件中使用

```vue
<template>
  <div>
    <Button @click="handleTest">测试连接</Button>
    <div v-if="store.isConnected">
      <div v-for="song in store.songs" :key="song.id">
        {{ song.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavidromeStore } from '@/stores/navidrome'

const store = useNavidromeStore()

async function handleTest() {
  await store.testConnection()
  if (store.isConnected) {
    await store.loadSongs(20)
  }
}
</script>
```

### 直接调用 API

```typescript
import * as navidrome from '@/api/navidrome'

// 测试连接
const ping = await navidrome.ping()

// 获取歌曲
const song = await navidrome.getSong('123')

// 获取播放 URL
const streamUrl = navidrome.getStreamUrl('123')

// 搜索
const results = await navidrome.search3('周杰伦')
```

## ⚠️ 注意事项

### 1. 跨域问题 (CORS)

如果浏览器报跨域错误，需要：

**方案 A: Navidrome 配置 CORS**
```bash
# 在 Navidrome 配置中添加
ND_ENABLECORS=true
```

**方案 B: 使用代理**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/rest': {
        target: 'https://music.xiaoyunjia.site:6',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### 2. HTTPS 证书

如果 Navidrome 使用自签名证书，可能需要：
- 在浏览器中先访问一次并信任证书
- 或者配置 `secure: false` 在开发环境

### 3. 密码安全

- ✅ 密码存储在 `.env.local` (不提交到 Git)
- ✅ 使用 MD5 哈希传输 (Subsonic API 标准)
- ⚠️ 生产环境建议使用 HTTPS

## 📊 当前配置

```
服务地址：https://music.xiaoyunjia.site:6
用户名：hetong
API 版本：1.16.1
客户端：NAS-Music-Player
```

## 🎯 下一步

1. ✅ 测试连接
2. ⏳ 集成到播放器组件
3. ⏳ 实现播放控制
4. ⏳ 集成歌词显示
5. ⏳ 集成专辑封面

## 📝 相关文档

- [Subsonic API 文档](http://www.subsonic.org/pages/api.jsp)
- [Navidrome 文档](https://www.navidrome.org/docs/)
- [OpenSubsonic 扩展](https://opensubsonic.netlify.app/)

---

**最后更新:** 2026-03-28 23:30
