<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, DownloadCloud, X, AlertCircle } from 'lucide-vue-next'
import { installAppUpdate, type UpdateInfo } from '../services/updater'

const props = defineProps<{
  updateInfo: UpdateInfo
}>()

const visible = ref(true)
const installing = ref(false)
const progress = ref(0)
const error = ref('')

async function handleInstall() {
  installing.value = true
  progress.value = 0
  error.value = ''
  try {
    await installAppUpdate((p) => {
      progress.value = p
    })
  } catch (err: any) {
    error.value = '更新安装失败: ' + (err.message || err)
    installing.value = false
  }
}
</script>

<template>
  <div
    v-if="visible && updateInfo.available"
    class="fixed bottom-24 right-6 w-96 bg-neutral-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-4 z-50 animate-fade-in flex flex-col gap-3 select-none text-neutral-100"
  >
    <!-- 弹窗标题 -->
    <div class="flex items-center justify-between text-xs">
      <div class="flex items-center gap-2 font-bold text-emerald-400 text-sm">
        <Sparkles class="w-4 h-4" />
        <span>发现新版本 v{{ updateInfo.version }}</span>
      </div>
      <button
        v-if="!installing"
        class="p-1 hover:text-white rounded hover:bg-neutral-800 transition cursor-pointer text-neutral-400"
        title="稍后提醒"
        @click="visible = false"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- 更新说明 -->
    <div class="text-xs text-neutral-300">
      <p class="mb-1 text-neutral-400">当前版本: v{{ updateInfo.currentVersion }}</p>
      <div v-if="updateInfo.body" class="bg-black/30 p-2.5 rounded-lg whitespace-pre-wrap font-sans max-h-36 overflow-y-auto border border-white/5 text-[11px] leading-relaxed">
        {{ updateInfo.body }}
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="installing" class="space-y-1.5 pt-1">
      <div class="flex justify-between text-xs text-emerald-400 font-medium">
        <span>正在下载更新...</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-emerald-500 transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-else class="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800">
      <button
        class="px-3 py-1.5 rounded-lg text-xs hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
        @click="visible = false"
      >
        稍后再说
      </button>
      <button
        class="px-3.5 py-1.5 rounded-lg text-xs bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer"
        @click="handleInstall"
      >
        <DownloadCloud class="w-3.5 h-3.5" /> 立即更新并重启
      </button>
    </div>

    <div v-if="error" class="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 space-y-2">
      <div class="flex items-start gap-1.5">
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
        <span class="break-all">{{ error }}</span>
      </div>
      <div class="flex items-center justify-between pt-1 border-t border-rose-500/20 text-[11px]">
        <button
          class="text-neutral-300 hover:text-white underline cursor-pointer"
          @click="handleInstall"
        >
          重试下载
        </button>
        <a
          href="https://github.com/ht176/nas-music-player/releases/latest"
          target="_blank"
          class="text-emerald-400 hover:underline"
        >
          浏览器手动下载 &rarr;
        </a>
      </div>
    </div>
  </div>
</template>
