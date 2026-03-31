import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('@/views/Library.vue'),
    meta: { title: '音乐库' },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/Search.vue'),
    meta: { title: '搜索' },
  },
  {
    path: '/artist/:id',
    name: 'artist-detail',
    component: () => import('@/views/ArtistDetail.vue'),
    meta: { title: '艺术家详情' },
  },
  {
    path: '/album/:id',
    name: 'album-detail',
    component: () => import('@/views/AlbumDetail.vue'),
    meta: { title: '专辑详情' },
  },
  {
    path: '/lyrics',
    name: 'lyrics',
    component: () => import('@/views/Lyrics.vue'),
    meta: { title: '歌词' },
  },
  {
    path: '/playlists',
    name: 'playlists',
    component: () => import('@/views/Playlists.vue'),
    meta: { title: '我的歌单' },
  },
  {
    path: '/playlist/:id',
    name: 'playlist',
    component: () => import('@/views/Playlist.vue'),
    meta: { title: '歌单详情' },
  },
  {
    path: '/player',
    name: 'player',
    component: () => import('@/views/Player.vue'),
    meta: { title: '播放器' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '设置' },
  },
  {
    path: '/navidrome-config',
    name: 'navidrome-config',
    component: () => import('@/views/NavidromeConfig.vue'),
    meta: { title: '服务器配置' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫：设置页面标题
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'NAS Music Player'} - NAS Music Player`
  next()
})

export default router
