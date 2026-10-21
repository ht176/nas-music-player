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
  <nav
    class="w-full border-t select-none pointer-events-auto transition-colors duration-500 shadow-[0_-8px_25px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
    :style="{
      backgroundColor: 'var(--theme-surface-solid)',
      borderColor: 'var(--theme-border)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)'
    }"
  >
    <div class="h-14 flex items-center justify-around px-1">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer relative"
        :style="{
          color: route.path === item.path ? 'var(--theme-accent)' : 'var(--theme-text-muted)'
        }"
        @click="router.push(item.path)"
      >
        <div class="relative flex items-center justify-center p-1">
          <component
            :is="item.icon"
            class="w-5 h-5 transition-all duration-200"
            :class="{ 'scale-110 stroke-[2.2]': route.path === item.path }"
            :style="route.path === item.path ? { filter: 'drop-shadow(0 0 6px var(--theme-glow))' } : undefined"
          />
          <span
            v-if="route.path === item.path"
            class="absolute -bottom-1 w-1.5 h-1.5 rounded-full transition-all duration-300"
            :style="{
              backgroundColor: 'var(--theme-accent)',
              boxShadow: '0 0 8px var(--theme-glow)'
            }"
          />
        </div>
        <span
          class="text-[10px] mt-0.5 tracking-tight transition-colors"
          :class="route.path === item.path ? 'font-bold' : 'font-medium'"
        >
          {{ item.name }}
        </span>
      </button>
    </div>
  </nav>
</template>
