<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import { usePlayerStore } from '../stores/player'
import { SubsonicClient } from '../api/client'
import { checkAppUpdate, installAppUpdate, type UpdateInfo } from '../services/updater'
import { isTauriApp } from '../services/desktop'
import { cacheService } from '../services/cache'
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
} from 'lucide-vue-next'

const router = useRouter()
const serverStore = useServerStore()
const playerStore = usePlayerStore()

// Tab 栏目定义
type SettingsTab = 'connection' | 'playback' | 'cache' | 'shortcuts' | 'about'

const currentTab = ref<SettingsTab>('connection')

const tabs = [
  { id: 'connection' as SettingsTab, name: '连接管理', icon: Server, desc: 'NAS 与 Navidrome 节点配置' },
  { id: 'playback' as SettingsTab, name: '播放与音效', icon: Sliders, desc: '高保真音频、淡入淡出与音质' },
  { id: 'cache' as SettingsTab, name: '缓存与存储', icon: Database, desc: '离线曲目与本地音质空间' },
  { id: 'shortcuts' as SettingsTab, name: '快捷键', icon: Keyboard, desc: '全局与窗口键盘快捷指令' },
  { id: 'about' as SettingsTab, name: '关于', icon: Info, desc: '客户端版本、更新与开源信息' },
]

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
    router.push('/')
  } else {
    alert('该服务器连接超时或当前不可达')
  }
}

function onRemove(id: string, e: MouseEvent) {
  e.stopPropagation()
  if (confirm('确定移除此服务器配置吗？')) {
    serverStore.removeServer(id)
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
  } catch {}
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
  if (!confirm('确定要清空所有已离线下载的音频文件缓存吗？')) return
  clearingCache.value = true
  try {
    await cacheService.clearAll()
    await refreshCacheStats()
  } finally {
    clearingCache.value = false
  }
}

// 4. 快捷键清单
const shortcutList = [
  { key: 'Space (空格键)', desc: '播放 / 暂停', scope: '全局窗口' },
  { key: 'Ctrl / ⌘ + K', desc: '快速呼出全局搜索弹窗', scope: '全局窗口' },
  { key: 'Ctrl / ⌘ + →', desc: '切换到下一首曲目', scope: '全局窗口' },
  { key: 'Ctrl / ⌘ + ←', desc: '切换到上一首曲目', scope: '全局窗口' },
  { key: 'Ctrl / ⌘ + ↑', desc: '音量增加 5%', scope: '全局窗口' },
  { key: 'Ctrl / ⌘ + ↓', desc: '音量减小 5%', scope: '全局窗口' },
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
  if (isTauriApp()) {
    handleCheckUpdate()
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto pt-4 pb-16 space-y-6 animate-fade-in">
    <!-- 顶部标题与栏目切换选项卡 -->
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <SlidersHorizontal class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h1 class="text-2xl font-extrabold text-white tracking-tight">系统设置</h1>
          <p class="text-xs text-neutral-400 mt-0.5">定制专属音频偏好、网络连接节点与本地个性化选项</p>
        </div>
      </div>

      <!-- 紧凑分类导航选项卡 (Tabs) -->
      <div class="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 overflow-x-auto">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0"
          :class="[
            currentTab === t.id
              ? 'bg-emerald-500 text-neutral-950 shadow-md font-bold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50',
          ]"
          @click="currentTab = t.id"
        >
          <component :is="t.icon" class="w-4 h-4" />
          <span>{{ t.name }}</span>
        </button>
      </div>
    </div>

    <!-- 栏目 1：连接管理 -->
    <div v-if="currentTab === 'connection'" class="space-y-6 animate-fade-in">
      <!-- 已保存的服务器列表卡片 -->
      <div class="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 space-y-4 shadow-xl">
        <div class="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <Server class="w-4 h-4 text-emerald-400" /> 已配置的服务器 ({{ serverStore.servers.length }})
            </h2>
            <p class="text-xs text-neutral-400 mt-0.5">支持配置多个 Navidrome 实例（如内网直连、外网穿透等），随时一键热切换</p>
          </div>
          <button
            v-if="!showAddForm"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition cursor-pointer shadow-sm"
            @click="showAddForm = true"
          >
            <Plus class="w-4 h-4" /> 添加新节点
          </button>
        </div>

        <div v-if="serverStore.servers.length" class="space-y-2.5">
          <div
            v-for="srv in serverStore.servers"
            :key="srv.id"
            class="flex items-center justify-between p-4 rounded-xl border transition cursor-pointer"
            :class="[
              srv.id === serverStore.activeServerId
                ? 'bg-neutral-950/80 border-emerald-500/50 shadow-lg'
                : 'bg-neutral-950/40 border-neutral-800/80 hover:bg-neutral-950',
            ]"
            @click="onSwitch(srv.id)"
          >
            <div class="flex items-center gap-3.5 overflow-hidden">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                :class="srv.id === serverStore.activeServerId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'"
              >
                <Radio class="w-5 h-5" />
              </div>
              <div class="truncate">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-white truncate">{{ srv.name }}</span>
                  <span
                    v-if="srv.id === serverStore.activeServerId"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-neutral-950"
                  >
                    当前使用
                  </span>
                </div>
                <div class="text-xs text-neutral-400 font-mono truncate mt-0.5">{{ srv.url }}</div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="srv.id === serverStore.activeServerId"
                class="p-2 text-emerald-400 rounded-lg"
                title="当前已连接"
              >
                <Check class="w-5 h-5" />
              </button>
              <button
                v-else
                class="px-3 py-1.5 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition cursor-pointer"
                @click.stop="onSwitch(srv.id)"
              >
                连接
              </button>

              <button
                class="p-2 text-neutral-500 hover:text-rose-400 rounded-xl hover:bg-neutral-800 transition cursor-pointer"
                title="删除此配置"
                @click="onRemove(srv.id, $event)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 bg-neutral-950/40 rounded-xl border border-neutral-800/60 text-neutral-500 text-sm">
          暂未保存任何服务器配置，请在下方添加您的首个音乐库实例
        </div>
      </div>

      <!-- 添加新服务器表单 -->
      <div v-if="showAddForm || !serverStore.servers.length" class="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 space-y-4 shadow-xl">
        <div class="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 class="font-bold text-white text-base">添加 Navidrome 音乐库节点</h3>
          <button
            v-if="serverStore.servers.length"
            class="text-xs text-neutral-400 hover:text-white cursor-pointer"
            @click="showAddForm = false"
          >
            收起表单
          </button>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">节点备注名称</label>
          <input
            v-model="serverName"
            type="text"
            placeholder="例如: 家庭内网 NAS / 异地穿透节点"
            class="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">服务器访问地址 *</label>
          <input
            v-model="serverUrl"
            type="url"
            required
            placeholder="例如: http://192.168.1.100:4533 或 https://music.yourdomain.com"
            class="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">用户名 *</label>
            <input
              v-model="username"
              type="text"
              required
              placeholder="例如: admin"
              class="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">密码 *</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          <AlertCircle class="w-4 h-4 shrink-0" /> {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
          <CheckCircle2 class="w-4 h-4 shrink-0" /> {{ successMsg }}
        </div>

        <button
          type="button"
          :disabled="loading"
          class="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold text-sm transition shadow-lg cursor-pointer"
          @click="handleAddServer"
        >
          <span v-if="loading">正在测试连接并保存...</span>
          <span v-else>保存并启用该节点</span>
        </button>
      </div>
    </div>

    <!-- 栏目 2：播放与音效设置 -->
    <div v-else-if="currentTab === 'playback'" class="space-y-6 animate-fade-in">
      <div class="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 space-y-5 shadow-xl">
        <div class="border-b border-neutral-800 pb-3">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <Sliders class="w-4 h-4 text-emerald-400" /> 音频输出与播放策略
          </h2>
          <p class="text-xs text-neutral-400 mt-0.5">调控切歌淡入淡出、智能缓冲流及播放恢复行为</p>
        </div>

        <!-- 1. 平滑交叉淡入淡出时长 -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
          <div>
            <div class="text-sm font-semibold text-white">切歌平滑淡入淡出 (Crossfade)</div>
            <div class="text-xs text-neutral-400 mt-0.5">在切换上一首/下一首歌曲时自动应用渐变衰减，消除杂音爆音</div>
          </div>
          <div class="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1500"
              step="100"
              v-model.number="playbackSettings.fadeDuration"
              @change="savePlaybackSettings"
              class="w-28 sm:w-36 accent-emerald-400 cursor-pointer"
            />
            <span class="text-xs font-mono font-bold text-emerald-400 w-16 text-right">
              {{ playbackSettings.fadeDuration }} ms
            </span>
          </div>
        </div>

        <!-- 2. 预加载下一首歌曲音频流 -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
          <div>
            <div class="text-sm font-semibold text-white">智能音频流预加载 (Preload)</div>
            <div class="text-xs text-neutral-400 mt-0.5">在当前曲目接近播放结束时自动预缓冲下一首流媒体，实现无缝连续播放</div>
          </div>
          <input
            type="checkbox"
            v-model="playbackSettings.preloadNext"
            @change="savePlaybackSettings"
            class="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
          />
        </div>

        <!-- 3. 启动恢复播放 -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
          <div>
            <div class="text-sm font-semibold text-white">启动时恢复播放进度与队列</div>
            <div class="text-xs text-neutral-400 mt-0.5">每次重新打开软件时自动定位到上次未听完的曲目与时间点</div>
          </div>
          <input
            type="checkbox"
            v-model="playbackSettings.autoResume"
            @change="savePlaybackSettings"
            class="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
          />
        </div>

        <!-- 4. 主界面浮动歌词显示行数 -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
          <div>
            <div class="text-sm font-semibold text-white">主界面浮动歌词显示模式</div>
            <div class="text-xs text-neutral-400 mt-0.5">主界面播放条上方胶囊歌词的行数（单行聚焦 / 双行连贯展示）</div>
          </div>
          <div class="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
              :class="playerStore.lyricDisplayLines === 1 ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm' : 'text-neutral-400 hover:text-white'"
              @click="playerStore.setLyricDisplayLines(1)"
            >
              单行歌词
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
              :class="playerStore.lyricDisplayLines === 2 ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm' : 'text-neutral-400 hover:text-white'"
              @click="playerStore.setLyricDisplayLines(2)"
            >
              双行歌词
            </button>
          </div>
        </div>

        <!-- 5. 均衡器快捷入口 -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-neutral-950/40 border border-neutral-800/60">
          <div>
            <div class="text-sm font-semibold text-white">专业 10 段图形均衡器 (10-Band EQ)</div>
            <div class="text-xs text-neutral-400 mt-0.5">支持流行、摇滚、爵士、古典、低音增强等多种专业音效预设</div>
          </div>
          <button
            class="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            @click="playerStore.showEQModal = true"
          >
            <Sliders class="w-3.5 h-3.5 text-emerald-400" />
            <span>配置音效</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 栏目 3：缓存与存储空间 -->
    <div v-else-if="currentTab === 'cache'" class="space-y-6 animate-fade-in">
      <div class="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 space-y-5 shadow-xl">
        <div class="border-b border-neutral-800 pb-3">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <Database class="w-4 h-4 text-emerald-400" /> 离线缓存与存储占用
          </h2>
          <p class="text-xs text-neutral-400 mt-0.5">基于浏览器/客户端本地 IndexedDB 存储，断网无信号时亦可尽情畅听</p>
        </div>

        <!-- 缓存容量概览卡片 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-neutral-950/50 border border-neutral-800/80 space-y-1">
            <span class="text-xs text-neutral-400 flex items-center gap-1.5">
              <Music2 class="w-4 h-4 text-emerald-400" /> 已离线下载曲目
            </span>
            <div class="text-2xl font-black text-white font-mono">
              {{ cachedTracksCount }} <span class="text-xs font-normal text-neutral-400">首</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-neutral-950/50 border border-neutral-800/80 space-y-1">
            <span class="text-xs text-neutral-400 flex items-center gap-1.5">
              <HardDrive class="w-4 h-4 text-teal-400" /> 本地占用磁盘空间
            </span>
            <div class="text-2xl font-black text-emerald-400 font-mono">
              {{ totalCacheSizeMb }} <span class="text-xs font-normal text-neutral-400">MB</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button
            class="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            @click="router.push('/downloaded')"
          >
            <DownloadCloud class="w-3.5 h-3.5" /> 查看离线曲目列表
          </button>

          <button
            :disabled="clearingCache || cachedTracksCount === 0"
            class="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            @click="handleClearAllCache"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>{{ clearingCache ? '正在清空...' : '清空全部本地缓存' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 栏目 4：快捷键指南与设置 -->
    <div v-else-if="currentTab === 'shortcuts'" class="space-y-6 animate-fade-in">
      <div class="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 space-y-4 shadow-xl">
        <div class="border-b border-neutral-800 pb-3">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <Keyboard class="w-4 h-4 text-emerald-400" /> 键盘快捷键指南
          </h2>
          <p class="text-xs text-neutral-400 mt-0.5">在键盘上随心操控播放、切歌、全局秒级检索</p>
        </div>

        <div class="divide-y divide-neutral-800/80">
          <div
            v-for="(item, idx) in shortcutList"
            :key="idx"
            class="flex items-center justify-between py-3.5 text-xs"
          >
            <span class="text-neutral-200 font-medium text-sm">{{ item.desc }}</span>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-emerald-400 font-bold tracking-wide shadow-inner">
                {{ item.key }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 栏目 5：关于与版本信息 -->
    <div v-else-if="currentTab === 'about'" class="space-y-6 animate-fade-in">
      <div class="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 space-y-5 shadow-xl">
        <!-- 软件标志与介绍 -->
        <div class="flex items-center gap-4 border-b border-neutral-800 pb-5">
          <div class="w-14 h-14 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.35)] shrink-0 border border-white/10">
            <img src="/favicon.svg" class="w-full h-full object-cover" alt="AuraMusic" />
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h2 class="text-xl font-black text-white tracking-tight">AuraMusic · 极光私有音乐</h2>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0.6
              </span>
            </div>
            <p class="text-xs text-neutral-400 mt-1">
              基于 Tauri v2 + Vue 3 的全平台极速私有云 Hi-Fi 无损音乐播放器
            </p>
          </div>
        </div>

        <!-- 软件版本与自动更新模块（仅客户端原生环境支持） -->
        <div v-if="isTauriApp()" class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-white font-bold text-sm">
              <Sparkles class="w-4 h-4 text-emerald-400" /> 软件版本与自动更新
            </div>
            <button
              :disabled="checkingUpdate || installingUpdate"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-semibold transition cursor-pointer"
              @click="handleCheckUpdate"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': checkingUpdate }" />
              <span>{{ checkingUpdate ? '正在检查...' : '检查更新' }}</span>
            </button>
          </div>

          <!-- 发现新版本提示卡片 -->
          <div v-if="updateInfo?.available" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Sparkles class="w-4 h-4" />
                <span>发现新版本: v{{ updateInfo.version }}</span>
              </div>
              <span v-if="updateInfo.date" class="text-[11px] text-neutral-400 font-mono">
                {{ new Date(updateInfo.date).toLocaleDateString() }}
              </span>
            </div>

            <div v-if="updateInfo.body" class="text-xs text-neutral-300 bg-black/30 p-2.5 rounded-lg whitespace-pre-wrap font-sans max-h-32 overflow-y-auto border border-white/5">
              {{ updateInfo.body }}
            </div>

            <!-- 下载进度条 -->
            <div v-if="installingUpdate" class="space-y-1.5">
              <div class="flex justify-between text-xs text-emerald-400 font-medium">
                <span>正在下载并安装更新...</span>
                <span>{{ downloadProgress }}%</span>
              </div>
              <div class="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-emerald-500 transition-all duration-300"
                  :style="{ width: `${downloadProgress}%` }"
                />
              </div>
            </div>

            <button
              v-else
              class="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              @click="handleInstallUpdate"
            >
              <DownloadCloud class="w-4 h-4" /> 立即更新并重启应用
            </button>
          </div>

          <div v-else-if="updateChecked && !checkingUpdate" class="text-xs text-neutral-400 flex items-center gap-1.5 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/40">
            <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
            <span>当前已是最新版本，无需更新。</span>
          </div>

          <div v-if="updateError" class="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex items-center gap-1.5">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ updateError }}</span>
          </div>
        </div>

        <!-- 技术栈与开源信息 -->
        <div class="pt-3 border-t border-neutral-800 space-y-2 text-xs text-neutral-400">
          <div class="flex items-center justify-between">
            <span>Subsonic / Navidrome 协议</span>
            <span class="text-neutral-200 font-mono">Open API v1.16.1</span>
          </div>
          <div class="flex items-center justify-between">
            <span>底层运行时环境</span>
            <span class="text-neutral-200 font-mono">{{ isTauriApp() ? 'Tauri Native Engine' : 'Web Browser PWA' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>开源许可协议</span>
            <span class="text-neutral-200 font-mono">MIT License</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
