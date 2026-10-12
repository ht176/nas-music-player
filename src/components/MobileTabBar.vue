<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Disc, Heart, User, ListMusic, Settings } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = [
  { name: '发现', path: '/', icon: Disc },
  { name: '喜欢', path: '/favorites', icon: Heart },
  { name: '歌手', path: '/artists', icon: User },
  { name: '歌单', path: '/playlists', icon: ListMusic },
  { name: '设置', path: '/settings', icon: Settings },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 h-14 bg-neutral-900 border-t border-neutral-800 flex items-center justify-around z-30 md:hidden">
    <button
      v-for="item in navItems"
      :key="item.path"
      class="flex flex-col items-center gap-1 text-[11px] py-1 transition cursor-pointer"
      :class="[
        route.path === item.path ? 'text-emerald-400 font-semibold' : 'text-neutral-400',
      ]"
      @click="router.push(item.path)"
    >
      <component :is="item.icon" class="w-4 h-4" />
      <span>{{ item.name }}</span>
    </button>
  </nav>
</template>
