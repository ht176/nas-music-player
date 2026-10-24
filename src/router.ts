import { createRouter, createWebHistory } from 'vue-router'
import ExploreView from './views/ExploreView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ExploreView },
    { path: '/album/:id', component: () => import('./views/AlbumDetailView.vue') },
    { path: '/favorites', component: () => import('./views/FavoritesView.vue') },
    { path: '/songs', component: () => import('./views/AllSongsView.vue') },
    { path: '/downloaded', component: () => import('./views/DownloadedView.vue') },
    { path: '/stats', component: () => import('./views/StatsView.vue') },
    { path: '/artists', component: () => import('./views/ArtistsView.vue') },
    { path: '/artist/:id', component: () => import('./views/ArtistDetailView.vue') },
    { path: '/playlists', component: () => import('./views/PlaylistsView.vue') },
    { path: '/playlist/:id', component: () => import('./views/PlaylistDetailView.vue') },
    { path: '/settings', component: () => import('./views/SettingsView.vue') },
  ],
})
