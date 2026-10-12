import { createRouter, createWebHistory } from 'vue-router'
import ExploreView from './views/ExploreView.vue'
import AlbumDetailView from './views/AlbumDetailView.vue'
import FavoritesView from './views/FavoritesView.vue'
import ArtistsView from './views/ArtistsView.vue'
import ArtistDetailView from './views/ArtistDetailView.vue'
import PlaylistsView from './views/PlaylistsView.vue'
import PlaylistDetailView from './views/PlaylistDetailView.vue'
import DownloadedView from './views/DownloadedView.vue'
import StatsView from './views/StatsView.vue'
import SettingsView from './views/SettingsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ExploreView },
    { path: '/album/:id', component: AlbumDetailView },
    { path: '/favorites', component: FavoritesView },
    { path: '/downloaded', component: DownloadedView },
    { path: '/stats', component: StatsView },
    { path: '/artists', component: ArtistsView },
    { path: '/artist/:id', component: ArtistDetailView },
    { path: '/playlists', component: PlaylistsView },
    { path: '/playlist/:id', component: PlaylistDetailView },
    { path: '/settings', component: SettingsView },
  ],
})
