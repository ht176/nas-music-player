<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import { useThemeStore, type ThemePreset } from '../stores/theme'
import { SubsonicClient } from '../api/client'
import { checkAppUpdate, installAppUpdate, type UpdateInfo } from '../services/updater'
import { isTauriApp, isDesktopApp, getAutostartStatus, setAutostartStatus } from '../services/desktop'
import { cacheService } from '../services/cache'
import { toastService } from '../services/toast'
import gsap from 'gsap'
import {
  Server,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Radio,
  Sparkles,
  RefreshCw,
  DownloadCloud,
  Keyboard,
  Info,
  Sliders,
  Database,
  Music2,
  HardDrive,
  SlidersHorizontal,
  Palette,
  Activity,
  Layers,
  Globe,
  AppWindow,
} from 'lucide-vue-next'

const router = useRouter()
const serverStore = useServerStore()
const playerStore = usePlayerStore()
const themeStore = useThemeStore()

// Tab 栏目定义
type SettingsTab = 'appearance' | 'connection' | 'playback' | 'cache' | 'shortcuts' | 'about'

const currentTab = ref<SettingsTab>('appearance')

const tabs = [
  { id: 'appearance' as SettingsTab, name: '外观与主题', icon: Palette, desc: '专属音频调色、黑胶质感与视效' },
  { id: 'connection' as SettingsTab, name: '连接管理', icon: Server, desc: 'NAS 与 Navidrome 节点配置' },
  { id: 'playback' as SettingsTab, name: '播放与音效', icon: Sliders, desc: '高保真音频、淡入淡出与音质' },
  { id: 'cache' as SettingsTab, name: '缓存与存储', icon: Database, desc: '离线曲目与本地音质空间' },
  { id: 'shortcuts' as SettingsTab, name: '快捷键', icon: Keyboard, desc: '全局与窗口键盘快捷指令' },
  { id: 'about' as SettingsTab, name: '关于', icon: Info, desc: '客户端版本、更新与开源信息' },
]

const appearanceContainer = ref<HTMLElement | null>(null)
let appearanceCtx: gsap.Context | null = null

function triggerAppearanceAnimation() {
  if (appearanceContainer.value) {
    appearanceCtx?.revert()
    appearanceCtx = gsap.context(() => {
      gsap.fromTo(
        '.theme-card-stagger',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.06,
          duration: 0.4,
          ease: 'power2.out',
          clearProps: 'all',
        }
      )
    }, appearanceContainer.value)
  }
}

watch(currentTab, async (newTab) => {
  if (newTab === 'appearance') {
    await nextTick()
    triggerAppearanceAnimation()
  }
})

function handleSelectTheme(preset: ThemePreset, e?: MouseEvent) {
  themeStore.setTheme(preset.id)
  toastService.success(`已应用「${preset.name}」主题`)
  if (e?.currentTarget) {
    gsap.fromTo(e.currentTarget, { scale: 0.97 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' })
  }
}

// 1. 连接管理状态
const serverName = ref('家庭内网 NAS')
const serverUrl = ref('http://192.168.1.100:4533')
const username = ref('admin')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const showAddForm = ref(false)

async function handleAddServer() {
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true

  try {
    let salt: string | undefined
    let token: string | undefined
    if (password.value) {
      const creds = SubsonicClient.generateCredentials(password.value)
      salt = creds.salt
      token = creds.token
    }

    const config = {
      id: Date.now().toString(),
      name: serverName.value || 'Navidrome 实例',
      url: serverUrl.value,
      username: username.value || undefined,
      token,
      salt,
      active: true,
    }

    const success = await serverStore.addOrUpdateServer(config)
    if (success) {
      successMsg.value = '服务器连接验证成功并已保存！'
      showAddForm.value = false
      password.value = ''
      setTimeout(() => {
        successMsg.value = ''
      }, 2000)
    } else {
      errorMsg.value = '连接测试失败，请检查服务器地址与凭证。'
    }
  } catch (e: any) {
    errorMsg.value = `连接出错: ${e.message || e}`
  } finally {
    loading.value = false
  }
}

async function onSwitch(id: string) {
  loading.value = true
  const ok = await serverStore.switchServer(id)
  loading.value = false
  if (ok) {
    const srv = serverStore.servers.find(s => s.id === id)
    toastService.success(`已切换至音乐库节点「${srv?.name || '未知节点'}」`)
    router.push('/')
  } else {
    toastService.error('该服务器连接超时或当前不可达，请检查网络配置')
  }
}

function onRemove(id: string, e: MouseEvent) {
  e.stopPropagation()
  const srv = serverStore.servers.find(s => s.id === id)
  if (confirm(`确定移除服务器配置「${srv?.name || '该节点'}」吗？`)) {
    serverStore.removeServer(id)
    toastService.info(`已移除节点「${srv?.name || ''}」配置`)
  }
}

// 2. 播放与音效配置状态 (持久化到 localStorage)
const PLAYBACK_SETTINGS_KEY = 'aura_playback_settings'
const playbackSettings = ref({
  fadeDuration: 400, // 音轨切换平滑淡入淡出时长 (ms)
  preloadNext: true, // 智能预加载下一首歌曲音频流
  autoResume: true,  // 启动时自动恢复上次播放状态
})

function loadPlaybackSettings() {
  try {
    const raw = localStorage.getItem(PLAYBACK_SETTINGS_KEY)
    if (raw) {
      playbackSettings.value = { ...playbackSettings.value, ...JSON.parse(raw) }
    }
  } catch {}
}

function savePlaybackSettings() {
  try {
    localStorage.setItem(PLAYBACK_SETTINGS_KEY, JSON.stringify(playbackSettings.value))
    toastService.success('播放与音效配置已保存')
  } catch {}
}

// 2.2 桌面开机自启动设置
const autostartEnabled = ref(false)
const autostartLoading = ref(false)

async function loadAutostartSetting() {
  if (isDesktopApp()) {
    try {
      autostartLoading.value = true
      autostartEnabled.value = await getAutostartStatus()
    } catch {
      // 容错
    } finally {
      autostartLoading.value = false
    }
  }
}

async function handleToggleAutostart() {
  if (!isDesktopApp() || autostartLoading.value) return
  try {
    autostartLoading.value = true
    const targetState = autostartEnabled.value
    const newState = await setAutostartStatus(targetState)
    autostartEnabled.value = newState
    toastService.success(newState ? '已开启开机自启动' : '已关闭开机自启动')
  } catch (err: any) {
    toastService.error(`设置开机自启失败: ${err?.message || err}`)
    autostartEnabled.value = !autostartEnabled.value
  } finally {
    autostartLoading.value = false
  }
}

// 3. 缓存与存储状态
const cachedTracksCount = ref(0)
const totalCacheSizeMb = ref('0.00')
const clearingCache = ref(false)

async function refreshCacheStats() {
  try {
    const tracks = await cacheService.getAllCachedTracks()
    cachedTracksCount.value = tracks.length
    const totalBytes = tracks.reduce((acc, t) => acc + (t.size || 0), 0)
    totalCacheSizeMb.value = (totalBytes / (1024 * 1024)).toFixed(2)
  } catch {
    cachedTracksCount.value = 0
    totalCacheSizeMb.value = '0.00'
  }
}

async function handleClearAllCache() {
  if (cachedTracksCount.value === 0) {
    toastService.info('当前离线缓存已为空')
    return
  }
  if (!confirm('确定要清空所有已离线下载的音频文件缓存吗？')) return
  clearingCache.value = true
  try {
    const clearedCount = cachedTracksCount.value
    await cacheService.clearAll()
    await refreshCacheStats()
    toastService.success(`已清空 ${clearedCount} 首本地离线音乐缓存`)
  } catch (err) {
    toastService.error('清空缓存失败')
  } finally {
    clearingCache.value = false
  }
}

// 4. 快捷键分类清单
const shortcutCategories = [
  {
    id: 'global',
    title: '系统全局快捷键',
    subtitle: '在任何第三方软件、系统后台或桌面迷你窗下均可随时响应',
    badge: '后台常驻',
    isGlobal: true,
    shortcuts: [
      { name: '播放 / 暂停', key: 'MediaPlayPause / ⌘+Alt+Space' },
      { name: '下一首曲目', key: 'MediaTrackNext / ⌘+Alt+→' },
      { name: '上一首曲目', key: 'MediaTrackPrevious / ⌘+Alt+←' },
      { name: '全局音量增加 5%', key: 'Ctrl / ⌘ + Alt + ↑' },
      { name: '全局音量减小 5%', key: 'Ctrl / ⌘ + Alt + ↓' },
    ],
  },
  {
    id: 'inapp',
    title: '应用窗口内快捷键',
    subtitle: '仅当音乐播放器主窗口处于前台激活聚焦状态时生效',
    badge: '窗口聚焦',
    isGlobal: false,
    shortcuts: [
      { name: '播放 / 暂停', key: 'Space (空格键)' },
      { name: '快速唤起全局搜索', key: 'Ctrl / ⌘ + K' },
      { name: '切换到下一首曲目', key: 'Ctrl / ⌘ + →' },
      { name: '切换到上一首曲目', key: 'Ctrl / ⌘ + ←' },
      { name: '窗口音量增加 5%', key: 'Ctrl / ⌘ + ↑' },
      { name: '窗口音量减小 5%', key: 'Ctrl / ⌘ + ↓' },
    ],
  },
]

// 5. 版本检查与更新状态
const checkingUpdate = ref(false)
const installingUpdate = ref(false)
const downloadProgress = ref<number>(0)
const updateInfo = ref<UpdateInfo | null>(null)
const updateChecked = ref(false)
const updateError = ref('')

async function handleCheckUpdate() {
  checkingUpdate.value = true
  updateError.value = ''
  try {
    const res = await checkAppUpdate()
    updateInfo.value = res
    if (res.error) {
      updateError.value = '检查更新异常: ' + res.error
    }
    updateChecked.value = true
  } catch (err: any) {
    updateError.value = '检查更新失败: ' + (err.message || err)
  } finally {
    checkingUpdate.value = false
  }
}

async function handleInstallUpdate() {
  installingUpdate.value = true
  downloadProgress.value = 0
  try {
    await installAppUpdate((p) => {
      downloadProgress.value = p
    })
  } catch (err: any) {
    updateError.value = '更新安装失败: ' + (err.message || err)
    installingUpdate.value = false
  }
}

onMounted(() => {
  loadPlaybackSettings()
  refreshCacheStats()
  if (isDesktopApp()) {
    loadAutostartSetting()
  }
  if (isTauriApp()) {
    handleCheckUpdate()
  }
  if (currentTab.value === 'appearance') {
    nextTick(() => {
      triggerAppearanceAnimation()
    })
  }
})

onUnmounted(() => {
  appearanceCtx?.revert()
})
</script>

<template>
  <div class="max-w-4xl mx-auto pt-2 sm:pt-4 pb-16 space-y-5 sm:space-y-6 animate-fade-in">
    <!-- 顶部标题与栏目切换选项卡 -->
    <div class="space-y-3 sm:space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/30 flex items-center justify-center text-[var(--theme-accent)] shadow-[0_0_15px_var(--theme-glow)] shrink-0">
          <SlidersHorizontal class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-extrabold text-[var(--theme-text-primary)] tracking-tight">系统设置</h1>
          <p class="text-xs text-[var(--theme-text-secondary)] mt-0.5 truncate">定制专属音频偏好、个性化主题与本地选项</p>
        </div>
      </div>

      <!-- 紧凑分类导航选项卡 (Tabs) -->
      <div class="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[var(--theme-surface-solid)]/80 border border-[var(--theme-border)] overflow-x-auto no-scrollbar">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 whitespace-nowrap"
          :class="[
            currentTab === t.id
              ? 'bg-[var(--theme-accent)] text-neutral-950 shadow-md font-bold'
              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-hover)]',
          ]"
          @click="currentTab = t.id"
        >
          <component :is="t.icon" class="w-4 h-4 shrink-0" />
          <span>{{ t.name }}</span>
        </button>
      </div>
    </div>

    <!-- 栏目 0：外观与主题 (Appearance & Themes) -->
    <div v-if="currentTab === 'appearance'" ref="appearanceContainer" class="space-y-5 sm:space-y-6 animate-fade-in">
      <!-- 1. 当前主题高光卡片 -->
      <div class="glass-card p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xl relative overflow-hidden" :style="{ backgroundColor: 'var(--theme-surface)' }">
        <div
          class="absolute -right-8 -top-8 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors duration-500"
          :style="{ background: themeStore.currentTheme.colors.accent }"
        ></div>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-[var(--theme-border)] pb-4 relative z-10">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 shrink-0 whitespace-nowrap">
                ACTIVE THEME
              </span>
              <h2 class="text-lg sm:text-xl font-black text-[var(--theme-text-primary)] flex items-center gap-2 flex-wrap">
                <span>{{ themeStore.currentTheme.name }}</span>
                <span class="text-xs font-mono font-normal text-[var(--theme-text-secondary)] whitespace-nowrap">({{ themeStore.currentTheme.enName }})</span>
              </h2>
            </div>
            <p class="text-xs text-[var(--theme-text-secondary)] mt-1.5 leading-relaxed break-words">{{ themeStore.currentTheme.description }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <span class="text-xs font-medium text-[var(--theme-text-secondary)] whitespace-nowrap">当前主色:</span>
            <div class="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[var(--theme-surface-solid)]/70 border border-[var(--theme-border)] shrink-0">
              <span class="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" :style="{ background: themeStore.currentTheme.colors.accent }"></span>
              <span class="text-xs font-mono font-semibold text-[var(--theme-text-primary)] whitespace-nowrap">{{ themeStore.currentTheme.accentName }}</span>
            </div>
          </div>
        </div>

        <!-- 当前主题色彩流光矩阵概览 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 relative z-10">
          <div class="p-3 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
            <span class="text-[10px] uppercase font-mono text-[var(--theme-text-muted)] block">背景底色 (BG)</span>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-3.5 h-3.5 rounded-full border border-[var(--theme-border)]" :style="{ background: themeStore.currentTheme.colors.bg }"></span>
              <span class="text-xs font-mono text-[var(--theme-text-primary)] font-bold">{{ themeStore.currentTheme.colors.bg }}</span>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
            <span class="text-[10px] uppercase font-mono text-[var(--theme-text-muted)] block">面板表面 (Surface)</span>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-3.5 h-3.5 rounded-full border border-[var(--theme-border)]" :style="{ background: themeStore.currentTheme.colors.surface }"></span>
              <span class="text-xs font-mono text-[var(--theme-text-primary)] font-bold truncate">{{ themeStore.currentTheme.colors.surface }}</span>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
            <span class="text-[10px] uppercase font-mono text-[var(--theme-text-muted)] block">核心强调色 (Accent)</span>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-3.5 h-3.5 rounded-full" :style="{ background: themeStore.currentTheme.colors.accent }"></span>
              <span class="text-xs font-mono font-bold text-[var(--theme-accent)]">{{ themeStore.currentTheme.colors.accent }}</span>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
            <span class="text-[10px] uppercase font-mono text-[var(--theme-text-muted)] block">辅助副色 (Secondary)</span>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-3.5 h-3.5 rounded-full" :style="{ background: themeStore.currentTheme.colors.accentSecondary }"></span>
              <span class="text-xs font-mono font-bold text-[var(--theme-text-primary)]">{{ themeStore.currentTheme.colors.accentSecondary }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 主题预设画廊 -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
              <Layers class="w-4 h-4 text-[var(--theme-accent)] shrink-0" /> 预设主题风格库
            </h3>
            <p class="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed break-words">精心配比的高级声学调色板，专为夜间与多场景音乐倾听定制</p>
          </div>
          <span class="text-xs font-mono text-[var(--theme-text-muted)] font-medium shrink-0 whitespace-nowrap self-start sm:self-center">共 {{ themeStore.presets.length }} 套声学主题</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="preset in themeStore.presets"
            :key="preset.id"
            class="theme-card-stagger rounded-2xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer relative overflow-hidden group select-none"
            :class="[
              themeStore.currentThemeId === preset.id
                ? 'bg-[var(--theme-surface-active)] border-[var(--theme-accent)] shadow-[0_0_25px_var(--theme-glow)]'
                : 'bg-[var(--theme-surface)] border-[var(--theme-border)] hover:border-[var(--theme-border-highlight)] hover:bg-[var(--theme-surface-hover)] hover:scale-[1.01]'
            ]"
            @click="handleSelectTheme(preset, $event)"
          >
            <!-- 激活微光角标 -->
            <div
              v-if="themeStore.currentThemeId === preset.id"
              class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--theme-accent)] text-neutral-950 flex items-center gap-1 shadow-md z-10 shrink-0 whitespace-nowrap"
            >
              <Check class="w-3 h-3 stroke-[3]" /> 当前使用
            </div>

            <!-- 主题微型视觉预览展示条 -->
            <div
              class="h-24 rounded-xl mb-4 p-3 relative overflow-hidden flex flex-col justify-between border"
              :style="{
                background: `linear-gradient(135deg, ${preset.colors.bg} 0%, ${preset.colors.surface} 100%)`,
                borderColor: preset.colors.border,
              }"
            >
              <!-- 模拟播放条胶囊光晕 -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full" :style="{ background: preset.colors.accent }"></span>
                  <span class="text-[10px] font-mono tracking-wider font-bold" :style="{ color: preset.colors.accent }">
                    {{ preset.enName.toUpperCase() }}
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <span
                    class="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium"
                    :style="{
                      background: preset.category === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)',
                      color: preset.colors.text
                    }"
                  >
                    {{ preset.category === 'dark' ? 'DARK' : 'LIGHT' }}
                  </span>
                </div>
              </div>

              <!-- 模拟迷你音乐频谱条 -->
              <div class="flex items-end gap-1 h-6">
                <span class="w-1.5 rounded-full h-2" :style="{ background: preset.colors.accent }"></span>
                <span class="w-1.5 rounded-full h-5" :style="{ background: preset.colors.accent }"></span>
                <span class="w-1.5 rounded-full h-3" :style="{ background: preset.colors.accentSecondary }"></span>
                <span class="w-1.5 rounded-full h-6" :style="{ background: preset.colors.accent }"></span>
                <span class="w-1.5 rounded-full h-4" :style="{ background: preset.colors.accentSecondary }"></span>
                <span class="w-1.5 rounded-full h-2" :style="{ background: preset.colors.accent }"></span>
              </div>

              <!-- 渐变极光背景装饰 -->
              <div
                class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-xl opacity-50 pointer-events-none"
                :style="{ background: preset.colors.glow }"
              ></div>
            </div>

            <!-- 主题名称与诗意标语 -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <h4 class="font-extrabold text-base text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                  {{ preset.name }}
                </h4>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ background: preset.colors.accent }"></span>
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ background: preset.colors.accentSecondary }"></span>
                </div>
              </div>
              <div class="text-xs font-medium font-sans break-words" :style="{ color: preset.colors.accent }">
                {{ preset.tagline }}
              </div>
              <p class="text-xs text-[var(--theme-text-secondary)] leading-relaxed pt-1 break-words">
                {{ preset.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 迷你播放器动效与沉浸细节设置 -->
      <div class="p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xl" :style="{ backgroundColor: 'var(--theme-surface)' }">
        <div class="border-b border-[var(--theme-border)] pb-3">
          <h3 class="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Activity class="w-4 h-4 text-[var(--theme-accent)] shrink-0" /> 交互微动效与沉浸视效
          </h3>
          <p class="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed break-words">基于 GSAP 3 硬件加速引擎，享受黑胶旋转与流光光效</p>
        </div>

        <div class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words">迷你播放器黑胶滑出与转动动效</div>
              <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">播放音乐时，黑胶唱片将从封套优雅滑出并伴随 20s/圈真实物理平滑旋转</div>
            </div>
            <span class="self-start sm:self-center text-xs font-mono font-bold text-[var(--theme-accent)] px-2.5 py-1 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 shrink-0 whitespace-nowrap">
              已启用
            </span>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words">实时律动音频跳动频谱 (Equalizer Wave)</div>
              <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">迷你窗与歌曲行播放时实时跳动的声波柱状律动动画</div>
            </div>
            <span class="self-start sm:self-center text-xs font-mono font-bold text-[var(--theme-accent)] px-2.5 py-1 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 shrink-0 whitespace-nowrap">
              已启用
            </span>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words">桌面原生反锯齿圆角适配</div>
              <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">已完美解决 macOS 无边框窗口圆角黑边问题，在窗口化与最大化之间智能平滑切换</div>
            </div>
            <span class="self-start sm:self-center text-xs font-mono font-bold text-[var(--theme-accent)] px-2.5 py-1 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 shrink-0 whitespace-nowrap">
              原生支持
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 栏目 1：连接管理 -->
    <div v-else-if="currentTab === 'connection'" class="space-y-5 sm:space-y-6 animate-fade-in">
      <!-- 已保存的服务器列表卡片 -->
      <div class="p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xl" :style="{ backgroundColor: 'var(--theme-surface)' }">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border-b border-[var(--theme-border)] pb-3">
          <div>
            <h2 class="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
              <Server class="w-4 h-4 text-[var(--theme-accent)] shrink-0" /> 已配置的服务器 ({{ serverStore.servers.length }})
            </h2>
            <p class="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed break-words">支持配置多个 Navidrome 实例（如内网直连、外网穿透等），随时一键热切换</p>
          </div>
          <button
            v-if="!showAddForm"
            class="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-neutral-950 font-bold text-xs transition cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
            @click="showAddForm = true"
          >
            <Plus class="w-4 h-4" /> 添加新节点
          </button>
        </div>

        <div v-if="serverStore.servers.length" class="space-y-2.5">
          <div
            v-for="srv in serverStore.servers"
            :key="srv.id"
            class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition cursor-pointer gap-3"
            :class="[
              srv.id === serverStore.activeServerId
                ? 'bg-[var(--theme-surface-active)] border-[var(--theme-accent)] shadow-lg'
                : 'bg-[var(--theme-surface-solid)]/40 border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)]',
            ]"
            @click="onSwitch(srv.id)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                :class="srv.id === serverStore.activeServerId ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]' : 'bg-[var(--theme-surface-solid)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]'"
              >
                <Radio class="w-5 h-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-sm text-[var(--theme-text-primary)] truncate">{{ srv.name }}</span>
                  <span
                    v-if="srv.id === serverStore.activeServerId"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--theme-accent)] text-neutral-950 shrink-0 whitespace-nowrap"
                  >
                    当前使用
                  </span>
                </div>
                <div class="text-xs text-[var(--theme-text-secondary)] font-mono truncate mt-0.5">{{ srv.url }}</div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center">
              <button
                v-if="srv.id === serverStore.activeServerId"
                class="p-2 text-[var(--theme-accent)] rounded-lg shrink-0"
                title="当前已连接"
              >
                <Check class="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                v-else
                class="px-3 py-1.5 rounded-xl text-xs bg-[var(--theme-surface-solid)] hover:bg-[var(--theme-surface-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-medium transition cursor-pointer shrink-0 whitespace-nowrap"
                @click.stop="onSwitch(srv.id)"
              >
                连接
              </button>

              <button
                class="p-2 text-[var(--theme-text-muted)] hover:text-rose-400 rounded-xl hover:bg-[var(--theme-surface-hover)] transition cursor-pointer shrink-0"
                title="删除此配置"
                @click="onRemove(srv.id, $event)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 bg-[var(--theme-surface-solid)]/30 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-muted)] text-sm">
          暂未保存任何服务器配置，请在下方添加您的首个音乐库实例
        </div>
      </div>

      <!-- 添加新服务器表单 -->
      <div v-if="showAddForm || !serverStore.servers.length" class="p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xl" :style="{ backgroundColor: 'var(--theme-surface)' }">
        <div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
          <h3 class="font-bold text-[var(--theme-text-primary)] text-base">添加 Navidrome 音乐库节点</h3>
          <button
            v-if="serverStore.servers.length"
            class="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer"
            @click="showAddForm = false"
          >
            收起表单
          </button>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1.5">节点备注名称</label>
          <input
            v-model="serverName"
            type="text"
            placeholder="例如: 家庭内网 NAS / 异地穿透节点"
            class="w-full bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1.5">服务器访问地址 *</label>
          <input
            v-model="serverUrl"
            type="url"
            required
            placeholder="例如: http://192.168.1.100:4533 或 https://music.yourdomain.com"
            class="w-full bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1.5">用户名 *</label>
            <input
              v-model="username"
              type="text"
              required
              placeholder="例如: admin"
              class="w-full bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1.5">密码 *</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          <AlertCircle class="w-4 h-4 shrink-0" /> {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="flex items-center gap-2 text-[var(--theme-accent)] text-xs bg-[var(--theme-accent)]/10 p-3 rounded-xl border border-[var(--theme-accent)]/20">
          <CheckCircle2 class="w-4 h-4 shrink-0" /> {{ successMsg }}
        </div>

        <button
          type="button"
          :disabled="loading"
          class="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-50 text-neutral-950 font-bold text-sm transition shadow-lg cursor-pointer"
          @click="handleAddServer"
        >
          <span v-if="loading">正在测试连接并保存...</span>
          <span v-else>保存并启用该节点</span>
        </button>
      </div>
    </div>

    <!-- 栏目 2：播放与音效设置 -->
    <div v-else-if="currentTab === 'playback'" class="space-y-5 sm:space-y-6 animate-fade-in">
      <div class="p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)] space-y-4 sm:space-y-5 shadow-xl" :style="{ backgroundColor: 'var(--theme-surface)' }">
        <div class="border-b border-[var(--theme-border)] pb-3">
          <h2 class="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Sliders class="w-4 h-4 text-[var(--theme-accent)] shrink-0" /> 音频输出与播放策略
          </h2>
          <p class="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed break-words">调控切歌淡入淡出、智能缓冲流及播放恢复行为</p>
        </div>

        <!-- 1. 平滑交叉淡入淡出时长 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words">切歌平滑淡入淡出 (Crossfade)</div>
            <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">在切换上一首/下一首歌曲时自动应用渐变衰减，消除杂音爆音</div>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--theme-border)]/50">
            <input
              type="range"
              min="0"
              max="1500"
              step="100"
              v-model.number="playbackSettings.fadeDuration"
              @change="savePlaybackSettings"
              class="w-full sm:w-36 cursor-pointer"
              :style="{ accentColor: 'var(--theme-accent)' }"
            />
            <span class="text-xs font-mono font-bold text-[var(--theme-accent)] w-16 text-right shrink-0 whitespace-nowrap">
              {{ playbackSettings.fadeDuration }} ms
            </span>
          </div>
        </div>

        <!-- 2. 预加载下一首歌曲音频流 -->
        <div class="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words">智能音频流预加载 (Preload)</div>
            <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">在当前曲目接近播放结束时自动预缓冲下一首流媒体，实现无缝连续播放</div>
          </div>
          <input
            type="checkbox"
            v-model="playbackSettings.preloadNext"
            @change="savePlaybackSettings"
            class="w-5 h-5 rounded cursor-pointer shrink-0"
            :style="{ accentColor: 'var(--theme-accent)' }"
          />
        </div>

        <!-- 3. 启动恢复播放 -->
        <div class="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words">启动时恢复播放进度与队列</div>
            <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">每次重新打开软件时自动定位到上次未听完的曲目与时间点</div>
          </div>
          <input
            type="checkbox"
            v-model="playbackSettings.autoResume"
            @change="savePlaybackSettings"
            class="w-5 h-5 rounded cursor-pointer shrink-0"
            :style="{ accentColor: 'var(--theme-accent)' }"
          />
        </div>

        <!-- 4. 开机自启动设置 -->
        <div class="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words flex items-center gap-2">
              <span>开机自动启动客户端 (Autostart)</span>
              <span v-if="!isDesktopApp()" class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--theme-surface-solid)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] shrink-0">仅桌面端</span>
            </div>
            <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">系统开机登录后自动在后台驻留启动，随时响应全局快捷键与媒体播放</div>
          </div>
          <div v-if="isDesktopApp()" class="shrink-0 flex items-center">
            <input
              type="checkbox"
              v-model="autostartEnabled"
              :disabled="autostartLoading"
              @change="handleToggleAutostart"
              class="w-5 h-5 rounded cursor-pointer shrink-0 disabled:opacity-50"
              :style="{ accentColor: 'var(--theme-accent)' }"
            />
          </div>
          <span v-else class="text-xs text-[var(--theme-text-muted)] shrink-0 whitespace-nowrap">
            仅桌面端支持
          </span>
        </div>

        <!-- 5. 主界面浮动歌词显示行数 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words">主界面浮动歌词显示模式</div>
            <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">主界面播放条上方胶囊歌词的行数（单行聚焦 / 双行连贯展示）</div>
          </div>
          <div class="flex items-center self-start sm:self-center bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] rounded-xl p-1 gap-1 shrink-0">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap"
              :class="playerStore.lyricDisplayLines === 1 ? 'bg-[var(--theme-accent)] text-neutral-950 font-bold shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-hover)]'"
              @click="playerStore.setLyricDisplayLines(1)"
            >
              单行歌词
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap"
              :class="playerStore.lyricDisplayLines === 2 ? 'bg-[var(--theme-accent)] text-neutral-950 font-bold shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-hover)]'"
              @click="playerStore.setLyricDisplayLines(2)"
            >
              双行歌词
            </button>
          </div>
        </div>

        <!-- 6. 均衡器快捷入口 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)]">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-[var(--theme-text-primary)] break-words">专业 10 段图形均衡器 (10-Band EQ)</div>
            <div class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">支持流行、摇滚、爵士、古典、低音增强等多种专业音效预设</div>
          </div>
          <button
            class="self-start sm:self-center px-4 py-2 rounded-xl bg-[var(--theme-surface-solid)] hover:bg-[var(--theme-surface-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm"
            @click="playerStore.showEQModal = true"
          >
            <Sliders class="w-3.5 h-3.5 text-[var(--theme-accent)]" />
            <span>配置音效</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 栏目 3：缓存与存储空间 -->
    <div v-else-if="currentTab === 'cache'" class="space-y-5 sm:space-y-6 animate-fade-in">
      <div class="p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)] space-y-4 sm:space-y-5 shadow-xl" :style="{ backgroundColor: 'var(--theme-surface)' }">
        <div class="border-b border-[var(--theme-border)] pb-3">
          <h2 class="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Database class="w-4 h-4 text-[var(--theme-accent)] shrink-0" /> 离线缓存与存储占用
          </h2>
          <p class="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed break-words">基于浏览器/客户端本地 IndexedDB 存储，断网无信号时亦可尽情畅听</p>
        </div>

        <!-- 缓存容量概览卡片 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div class="p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)] space-y-1">
            <span class="text-xs text-[var(--theme-text-secondary)] flex items-center gap-1.5">
              <Music2 class="w-4 h-4 text-[var(--theme-accent)] shrink-0" /> 已离线下载曲目
            </span>
            <div class="text-2xl font-black text-[var(--theme-text-primary)] font-mono">
              {{ cachedTracksCount }} <span class="text-xs font-normal text-[var(--theme-text-muted)]">首</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-[var(--theme-surface-solid)]/50 border border-[var(--theme-border)] space-y-1">
            <span class="text-xs text-[var(--theme-text-secondary)] flex items-center gap-1.5">
              <HardDrive class="w-4 h-4 text-[var(--theme-accent-secondary)] shrink-0" /> 本地占用磁盘空间
            </span>
            <div class="text-2xl font-black text-[var(--theme-accent)] font-mono">
              {{ totalCacheSizeMb }} <span class="text-xs font-normal text-[var(--theme-text-muted)]">MB</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            class="px-4 py-2.5 rounded-xl bg-[var(--theme-surface-solid)] hover:bg-[var(--theme-surface-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm"
            @click="router.push('/downloaded')"
          >
            <DownloadCloud class="w-3.5 h-3.5" /> 查看离线曲目列表
          </button>

          <button
            :disabled="clearingCache || cachedTracksCount === 0"
            class="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
            @click="handleClearAllCache"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>{{ clearingCache ? '正在清空...' : '清空全部本地缓存' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 栏目 4：快捷键指南与设置 -->
    <div v-else-if="currentTab === 'shortcuts'" class="space-y-5 sm:space-y-6 animate-fade-in">
      <div
        v-for="cat in shortcutCategories"
        :key="cat.id"
        class="p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xl"
        :style="{ backgroundColor: 'var(--theme-surface)' }"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-3">
          <div>
            <h2 class="text-base font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
              <component
                :is="cat.isGlobal ? Globe : AppWindow"
                class="w-4 h-4 text-[var(--theme-accent)] shrink-0"
              />
              <span>{{ cat.title }}</span>
            </h2>
            <p class="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed break-words">{{ cat.subtitle }}</p>
          </div>
          <span
            class="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold self-start sm:self-center shrink-0 whitespace-nowrap"
            :class="cat.isGlobal ? 'bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30' : 'bg-[var(--theme-surface-solid)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'"
          >
            {{ cat.badge }}
          </span>
        </div>

        <div class="divide-y divide-[var(--theme-border)]">
          <div
            v-for="(item, idx) in cat.shortcuts"
            :key="idx"
            class="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 sm:py-3 text-xs gap-1.5 sm:gap-4"
          >
            <span class="text-[var(--theme-text-primary)] font-medium text-sm">{{ item.name }}</span>
            <div class="flex items-center self-start sm:self-center shrink-0">
              <span class="px-2.5 py-1 rounded-lg bg-[var(--theme-surface-solid)] border border-[var(--theme-border)] font-mono text-[var(--theme-accent)] font-bold tracking-wide shadow-inner text-xs whitespace-nowrap">
                {{ item.key }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 栏目 5：关于与版本信息 -->
    <div v-else-if="currentTab === 'about'" class="space-y-5 sm:space-y-6 animate-fade-in">
      <div class="p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)] space-y-4 sm:space-y-5 shadow-xl" :style="{ backgroundColor: 'var(--theme-surface)' }">
        <!-- 软件标志与介绍 -->
        <div class="flex items-start sm:items-center gap-3.5 sm:gap-4 border-b border-[var(--theme-border)] pb-4 sm:pb-5">
          <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-[0_0_20px_var(--theme-glow)] shrink-0 border border-[var(--theme-border)]">
            <img src="/favicon.svg" class="w-full h-full object-cover" alt="AuraMusic" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 class="text-lg sm:text-xl font-black text-[var(--theme-text-primary)] tracking-tight">AuraMusic · 极光私有音乐</h2>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 shrink-0 whitespace-nowrap">
                v1.0.13
              </span>
            </div>
            <p class="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed break-words">
              基于 Tauri v2 + Vue 3 的全平台极速私有云 Hi-Fi 无损音乐播放器
            </p>
          </div>
        </div>

        <!-- 软件版本与自动更新模块（仅客户端原生环境支持） -->
        <div v-if="isTauriApp()" class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 text-[var(--theme-text-primary)] font-bold text-sm">
              <Sparkles class="w-4 h-4 text-[var(--theme-accent)] shrink-0" /> 软件版本与自动更新
            </div>
            <button
              :disabled="checkingUpdate || installingUpdate"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-surface-solid)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-50 text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold transition cursor-pointer shrink-0 whitespace-nowrap shadow-sm"
              @click="handleCheckUpdate"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': checkingUpdate }" />
              <span>{{ checkingUpdate ? '正在检查...' : '检查更新' }}</span>
            </button>
          </div>

          <!-- 发现新版本提示卡片 -->
          <div v-if="updateInfo?.available" class="p-4 rounded-xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/30 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-[var(--theme-accent)] font-semibold text-sm">
                <Sparkles class="w-4 h-4 shrink-0" />
                <span>发现新版本: v{{ updateInfo.version }}</span>
              </div>
              <span v-if="updateInfo.date" class="text-[11px] text-[var(--theme-text-secondary)] font-mono shrink-0 whitespace-nowrap">
                {{ new Date(updateInfo.date).toLocaleDateString() }}
              </span>
            </div>

            <div v-if="updateInfo.body" class="text-xs text-[var(--theme-text-primary)] bg-[var(--theme-surface-solid)]/70 p-2.5 rounded-lg whitespace-pre-wrap font-sans max-h-32 overflow-y-auto border border-[var(--theme-border)] break-words">
              {{ updateInfo.body }}
            </div>

            <!-- 下载进度条 -->
            <div v-if="installingUpdate" class="space-y-1.5">
              <div class="flex justify-between text-xs text-[var(--theme-accent)] font-medium">
                <span>正在下载并安装更新...</span>
                <span>{{ downloadProgress }}%</span>
              </div>
              <div class="w-full h-1.5 bg-[var(--theme-surface-solid)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                <div
                  class="h-full bg-[var(--theme-accent)] transition-all duration-300"
                  :style="{ width: `${downloadProgress}%` }"
                />
              </div>
            </div>

            <button
              v-else
              class="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-neutral-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              @click="handleInstallUpdate"
            >
              <DownloadCloud class="w-4 h-4" /> 立即更新并重启应用
            </button>
          </div>

          <div v-else-if="updateChecked && !checkingUpdate" class="text-xs text-[var(--theme-text-secondary)] flex items-center gap-1.5 bg-[var(--theme-surface-solid)]/40 p-3 rounded-xl border border-[var(--theme-border)]">
            <CheckCircle2 class="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
            <span>当前已是最新版本，无需更新。</span>
          </div>

          <div v-if="updateError" class="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 space-y-2">
            <div class="flex items-start gap-1.5">
              <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
              <span class="break-all">{{ updateError }}</span>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-rose-500/20 text-[11px] gap-2 flex-wrap">
              <button
                class="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] underline cursor-pointer"
                @click="handleInstallUpdate"
              >
                重试下载
              </button>
              <a
                href="https://github.com/ht176/nas-music-player/releases/latest"
                target="_blank"
                class="text-[var(--theme-accent)] hover:underline"
              >
                前往 GitHub 浏览器下载 &rarr;
              </a>
            </div>
          </div>
        </div>

        <!-- 技术栈与开源信息 -->
        <div class="pt-3 border-t border-[var(--theme-border)] space-y-2.5 text-xs text-[var(--theme-text-secondary)]">
          <div class="flex items-center justify-between gap-2">
            <span class="whitespace-nowrap">Subsonic / Navidrome 协议</span>
            <span class="text-[var(--theme-text-primary)] font-mono shrink-0 whitespace-nowrap">Open API v1.16.1</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="whitespace-nowrap">底层运行时环境</span>
            <span class="text-[var(--theme-text-primary)] font-mono shrink-0 whitespace-nowrap">{{ isTauriApp() ? 'Tauri Native Engine' : 'Web Browser PWA' }}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="whitespace-nowrap">开源许可协议</span>
            <span class="text-[var(--theme-text-primary)] font-mono shrink-0 whitespace-nowrap">MIT License</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
