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
    class="w-full bg-[#0e0e14]/95 backdrop-blur-2xl border-t border-white/10 select-none shadow-[0_-8px_25px_rgba(0,0,0,0.6)] pointer-events-auto"
    :style="{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }"
  >
    <div class="h-14 flex items-center justify-around px-1">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer relative"
        :class="[
          route.path === item.path ? 'text-emerald-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200',
        ]"
        @click="router.push(item.path)"
      >
        <div class="relative flex items-center justify-center p-1">
          <component :is="item.icon" class="w-5 h-5 transition-transform duration-200" :class="{ 'scale-110 stroke-[2.2] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]': route.path === item.path }" />
          <span
            v-if="route.path === item.path"
            class="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
          />
        </div>
        <span class="text-[10px] mt-0.5 tracking-tight">{{ item.name }}</span>
      </button>
    </div>
  </nav>
</template>
