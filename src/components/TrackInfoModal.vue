<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useServerStore } from '../stores/server'
import {
  Info,
  X,
  FileAudio,
  Folder,
  Music,
  Disc,
  User,
  HardDrive,
  Activity,
  Calendar,
  Layers,
  Copy,
  Check,
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const playerStore = usePlayerStore()
const serverStore = useServerStore()
const copied = ref(false)

const track = computed(() => playerStore.currentTrack)

const coverUrl = computed(() => {
  return serverStore.client?.getCoverArtUrl(track.value?.coverArtId, 300) || ''
})

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '未知大小'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB (${bytes.toLocaleString()} 字节)`
}

const formatDuration = (sec?: number) => {
  if (!sec || sec <= 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m} 分 ${s.toString().padStart(2, '0')} 秒`
}

const formatSampleRate = (rate?: number) => {
  if (!rate) return '44.1 kHz'
  return `${(rate / 1000).toFixed(1)} kHz`
}

function handleCopyPath() {
  if (!track.value?.path) return
  navigator.clipboard.writeText(track.value.path)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && track"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      @click.self="emit('update:modelValue', false)"
    >
      <div
        class="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <!-- 弹窗顶栏 -->
        <div class="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div class="flex items-center gap-2.5">
            <Info class="w-5 h-5 text-emerald-400" />
            <h3 class="text-base font-bold text-white">音乐文件属性与物理存储信息</h3>
          </div>
          <button
            class="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            @click="emit('update:modelValue', false)"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- 内容主体 -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1">
          <!-- 歌曲顶部概览卡片 -->
          <div class="flex items-center gap-4 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div class="w-16 h-16 rounded-xl overflow-hidden bg-neutral-800 shrink-0 shadow-md">
              <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover" alt="cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-neutral-600">
                <Music class="w-7 h-7" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-white font-bold text-base truncate">{{ track.title }}</h4>
              <p class="text-xs text-neutral-400 truncate mt-0.5">{{ track.artist }} · {{ track.album }}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {{ track.suffix || 'FLAC' }}
                </span>
                <span v-if="track.bitRate" class="text-[11px] text-neutral-400 font-mono">
                  {{ track.bitRate }} kbps
                </span>
              </div>
            </div>
          </div>

          <!-- 物理存储文件路径 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs text-neutral-400 font-medium">
              <span class="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Folder class="w-4 h-4" /> 物理文件存储相对路径
              </span>
              <button
                v-if="track.path"
                class="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
                @click="handleCopyPath"
              >
                <Check v-if="copied" class="w-3 h-3 text-emerald-400" />
                <Copy v-else class="w-3 h-3" />
                <span>{{ copied ? '已复制' : '复制路径' }}</span>
              </button>
            </div>
            <div class="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 font-mono text-xs text-neutral-200 break-all select-all leading-relaxed">
              {{ track.path || '服务端未返回物理文件路径（建议在音乐库中重新扫描文件）' }}
            </div>
          </div>

        <!-- 详细音频规格与属性网格 -->
        <div class="grid grid-cols-2 gap-3 text-xs">
          <!-- 文件大小 -->
          <div class="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/50 space-y-1">
            <span class="text-neutral-500 flex items-center gap-1.5">
              <HardDrive class="w-3.5 h-3.5 text-neutral-400" /> 文件大小
            </span>
            <div class="font-mono text-neutral-200 font-medium truncate">
              {{ formatFileSize(track.size) }}
            </div>
          </div>

          <!-- 音轨时长 -->
          <div class="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/50 space-y-1">
            <span class="text-neutral-500 flex items-center gap-1.5">
              <Activity class="w-3.5 h-3.5 text-neutral-400" /> 音频时长
            </span>
            <div class="font-mono text-neutral-200 font-medium">
              {{ formatDuration(track.duration) }}
            </div>
          </div>

          <!-- 采样率与位深 -->
          <div class="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/50 space-y-1">
            <span class="text-neutral-500 flex items-center gap-1.5">
              <FileAudio class="w-3.5 h-3.5 text-neutral-400" /> 采样率 / 位深
            </span>
            <div class="font-mono text-neutral-200 font-medium">
              {{ formatSampleRate(track.samplingRate) }} / {{ track.bitDepth ? `${track.bitDepth} bit` : '16 bit' }}
            </div>
          </div>

          <!-- 声道格式 -->
          <div class="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/50 space-y-1">
            <span class="text-neutral-500 flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5 text-neutral-400" /> 声道 / MIME类型
            </span>
            <div class="font-mono text-neutral-200 font-medium truncate">
              {{ track.channelCount === 1 ? '单声道 (Mono)' : '双声道 (Stereo)' }}
            </div>
          </div>

          <!-- 轨道编号与光盘编号 -->
          <div class="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/50 space-y-1">
            <span class="text-neutral-500 flex items-center gap-1.5">
              <Disc class="w-3.5 h-3.5 text-neutral-400" /> 轨道 / 唱片编号
            </span>
            <div class="font-mono text-neutral-200 font-medium">
              Track {{ track.trackNumber || 1 }} {{ track.discNumber ? `(Disc ${track.discNumber})` : '' }}
            </div>
          </div>

          <!-- 发行年份与流派 -->
          <div class="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/50 space-y-1">
            <span class="text-neutral-500 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-neutral-400" /> 年份 / 流派
            </span>
            <div class="font-mono text-neutral-200 font-medium truncate">
              {{ track.year || '未知年份' }} {{ track.genre ? `· ${track.genre}` : '' }}
            </div>
          </div>
        </div>

        <!-- 服务端内部标识 -->
        <div class="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/50 space-y-2 text-xs">
          <div class="flex items-center justify-between text-neutral-400">
            <span class="flex items-center gap-1.5">
              <User class="w-3.5 h-3.5" /> 服务端音轨 ID (Song ID)
            </span>
            <span class="font-mono text-neutral-300">{{ track.id }}</span>
          </div>
          <div v-if="track.albumId" class="flex items-center justify-between text-neutral-400">
            <span>专辑 ID (Album ID)</span>
            <span class="font-mono text-neutral-300">{{ track.albumId }}</span>
          </div>
        </div>
      </div>

      <!-- 底部关闭按钮 -->
      <div class="p-4 border-t border-neutral-800 flex justify-end bg-neutral-900/90">
        <button
          class="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition cursor-pointer"
          @click="emit('update:modelValue', false)"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>
