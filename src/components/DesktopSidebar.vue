<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Disc, Settings, Heart, User, ListMusic, Search, DownloadCloud, BarChart3, Music } from 'lucide-vue-next'
import gsap from 'gsap'

const route = useRoute()
const router = useRouter()
const sidebarRef = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined

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
  { name: '设置', path: '/settings', icon: Settings },
]

onMounted(() => {
  if (!sidebarRef.value) return
  ctx = gsap.context(() => {
    gsap.fromTo(
      '.nav-item-btn',
      { x: -12, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.03,
        duration: 0.4,
        ease: 'power2.out',
        clearProps: 'transform,opacity,visibility',
      }
    )
  }, sidebarRef.value)
})

onUnmounted(() => {
  ctx?.revert()
})

function handleNavClick(path: string, event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  if (target) {
    gsap.fromTo(target, { scale: 0.96 }, { scale: 1, duration: 0.22, ease: 'back.out(2)', clearProps: 'scale' })
  }
  router.push(path)
}
</script>

<template>
  <aside
    ref="sidebarRef"
    class="w-60 border-r flex flex-col justify-between p-4 shrink-0 transition-colors duration-500 overflow-y-auto"
    :style="{
      backgroundColor: 'var(--theme-surface)',
      borderColor: 'var(--theme-border)',
      backdropFilter: 'blur(24px)',
    }"
  >
    <div class="space-y-6">
      <!-- 品牌 Logo -->
      <div class="flex items-center gap-3 px-3 py-2 cursor-pointer group" @click="router.push('/')">
        <div
          class="h-11 w-11 rounded-2xl overflow-hidden group-hover:scale-105 transition-all duration-300 shrink-0 border border-white/10"
          :style="{
            boxShadow: '0 0 20px var(--theme-glow)',
          }"
        >
          <img src="/favicon.svg" class="w-full h-full object-cover" alt="AuraMusic Logo" />
        </div>
        <div class="flex flex-col">
          <span
            class="font-extrabold text-lg tracking-tight text-[var(--theme-text-primary)] transition-colors"
          >
            AuraMusic
          </span>
          <span class="text-[10px] text-[var(--theme-text-muted)] font-medium tracking-widest uppercase">极光私有音乐</span>
        </div>
      </div>

      <!-- 快捷搜索呼出按钮 -->
      <button
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition cursor-pointer hover:border-[var(--theme-border-highlight)]"
        :style="{
          backgroundColor: 'var(--theme-surface-solid)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-secondary)',
        }"
        @click="emit('open-search')"
      >
        <span class="flex items-center gap-2">
          <Search class="w-4 h-4 text-[var(--theme-text-muted)]" /> 全局搜索...
        </span>
        <kbd
          class="px-1.5 py-0.5 rounded text-[10px] font-mono"
          :style="{
            backgroundColor: 'var(--theme-bg)',
            color: 'var(--theme-text-muted)',
          }"
        >
          ⌘K
        </kbd>
      </button>

      <!-- 导航列表 -->
      <nav class="space-y-1">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="nav-item-btn w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer"
          :style="
            route.path === item.path
              ? {
                  backgroundColor: 'var(--theme-surface-active)',
                  color: 'var(--theme-accent)',
                  boxShadow: 'inset 0 0 0 1px var(--theme-border-highlight)',
                }
              : {
                  color: 'var(--theme-text-secondary)',
                }
          "
          @click="handleNavClick(item.path, $event)"
        >
          <component
            :is="item.icon"
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'scale-110': route.path === item.path }"
          />
          {{ item.name }}
        </button>
      </nav>
    </div>

    <!-- 底部状态 -->
    <div class="text-[11px] text-[var(--theme-text-muted)] px-3">
      AuraMusic · 高保真私有云
    </div>
  </aside>
</template>
