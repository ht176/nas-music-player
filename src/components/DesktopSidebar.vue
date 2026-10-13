<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Disc, Settings, Radio, Heart, User, ListMusic, Search, DownloadCloud, BarChart3, Music } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const emit = defineEmits<{
  (e: 'open-search'): void
}>()

const navItems = [
  { name: '发现音乐', path: '/', icon: Disc },
  { name: '我喜欢的', path: '/favorites', icon: Heart },
  { name: '全部歌曲', path: '/songs', icon: Music },
  { name: '已下载', path: '/downloaded', icon: DownloadCloud },
  { name: '足迹统计', path: '/stats', icon: BarChart3 },
  { name: '艺术家', path: '/artists', icon: User },
  { name: '播放列表', path: '/playlists', icon: ListMusic },
  { name: '连接设置', path: '/settings', icon: Settings },
]
</script>

<template>
  <aside class="w-60 bg-neutral-900/60 border-r border-neutral-800/80 flex flex-col justify-between p-4 shrink-0">
    <div class="space-y-6">
      <!-- 品牌 Logo -->
      <div class="flex items-center gap-3 px-3 py-2 cursor-pointer group" @click="router.push('/')">
        <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-neutral-950 shadow-[0_0_16px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_22px_rgba(16,185,129,0.7)] group-hover:scale-105 transition-all duration-300">
          <Radio class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div class="flex flex-col">
          <span class="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">AuraMusic</span>
          <span class="text-[10px] text-neutral-400 font-medium tracking-widest uppercase">极光私有音乐</span>
        </div>
      </div>

      <!-- 快捷搜索呼出按钮 -->
      <button
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs border border-neutral-800 transition cursor-pointer"
        @click="emit('open-search')"
      >
        <span class="flex items-center gap-2">
          <Search class="w-4 h-4 text-neutral-500" /> 全局搜索...
        </span>
        <kbd class="px-1.5 py-0.5 rounded bg-neutral-900 text-[10px] text-neutral-500 font-mono">⌘K</kbd>
      </button>

      <!-- 导航列表 -->
      <nav class="space-y-1">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
          :class="[
            route.path === item.path
              ? 'bg-neutral-800 text-emerald-400 font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40',
          ]"
          @click="router.push(item.path)"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.name }}
        </button>
      </nav>
    </div>

    <!-- 底部状态 -->
    <div class="text-[11px] text-neutral-500 px-3">
      Tauri 2.0 + Vue 3 · Navidrome
    </div>
  </aside>
</template>
