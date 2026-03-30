<template>
  <aside class="sidebar">
    <nav class="nav-menu">
      <!-- 主导航 -->
      <div class="nav-section">
        <h3 class="nav-section-title">主导航</h3>
        <ul class="nav-list">
          <li>
            <router-link to="/" class="nav-item" active-class="active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span class="nav-text">首页</span>
            </router-link>
          </li>
          <li>
            <router-link to="/library" class="nav-item" active-class="active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
              </svg>
              <span class="nav-text">音乐库</span>
            </router-link>
          </li>
          <li>
            <router-link to="/search" class="nav-item" active-class="active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span class="nav-text">搜索</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- 我的音乐 -->
      <div class="nav-section">
        <h3 class="nav-section-title">我的音乐</h3>
        <ul class="nav-list">
          <li>
            <router-link to="/playlist/favorites" class="nav-item" active-class="active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span class="nav-text">我喜欢</span>
            </router-link>
          </li>
          <li>
            <router-link to="/playlist/history" class="nav-item" active-class="active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
              </svg>
              <span class="nav-text">最近播放</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- 歌单 -->
      <div class="nav-section">
        <div class="nav-section-header">
          <h3 class="nav-section-title">歌单</h3>
          <router-link to="/playlists" class="create-playlist-btn" title="管理歌单">
            <svg class="icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </router-link>
        </div>
        <ul class="nav-list">
          <li v-for="playlist in userPlaylists" :key="playlist.id">
            <router-link :to="`/playlist/${playlist.id}`" class="nav-item" active-class="active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span class="nav-text">{{ playlist.name }}</span>
              <span class="playlist-count">{{ playlist.songCount }}</span>
            </router-link>
          </li>
        </ul>
      </div>
      
      <!-- 系统 -->
      <div class="nav-section">
        <h3 class="nav-section-title">系统</h3>
        <ul class="nav-list">
          <li>
            <router-link to="/navidrome-config" class="nav-item" active-class="active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span class="nav-text">服务器配置</span>
            </router-link>
          </li>
          <li>
            <router-link to="/settings" class="nav-item" active-class="active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span class="nav-text">设置</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Playlist {
  id: string
  name: string
  songCount: number
}

const userPlaylists = ref<Playlist[]>([])

// 加载用户歌单
function loadPlaylists() {
  const saved = localStorage.getItem('playlists')
  if (saved) {
    try {
      const playlists = JSON.parse(saved)
      userPlaylists.value = playlists.map((p: any) => ({
        id: p.id,
        name: p.name,
        songCount: p.songCount || 0,
      }))
    } catch (e) {
      console.error('Failed to load playlists:', e)
    }
  }
}

onMounted(() => {
  loadPlaylists()
})
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  position: fixed;
  left: 0;
  top: 64px;
  padding: 24px 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.nav-section {
  padding: 0 16px;
}

.nav-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-left: 12px;
}

.nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-left: 12px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.playlist-count {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: auto;
}

.create-playlist-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.create-playlist-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--primary);
  color: var(--primary);
}

.icon-plus {
  width: 14px;
  height: 14px;
}

/* 滚动条样式 */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}

/* 移动端隐藏侧边栏 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
