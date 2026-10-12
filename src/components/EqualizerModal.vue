<script setup lang="ts">
import { usePlayerStore } from '../stores/player'
import { EQ_FREQUENCIES } from '../services/audio'
import { Sliders, X, RotateCcw } from 'lucide-vue-next'

const playerStore = usePlayerStore()

const presets = [
  { key: 'default', name: '平直 (默认)' },
  { key: 'pop', name: '流行 (Pop)' },
  { key: 'rock', name: '摇滚 (Rock)' },
  { key: 'jazz', name: '爵士 (Jazz)' },
  { key: 'classical', name: '古典 (Classical)' },
  { key: 'bass', name: '重低音增强' },
  { key: 'vocal', name: '清澈人声' },
  { key: 'treble', name: '高音增强' },
]

const formatFreq = (freq: number) => {
  return freq >= 1000 ? `${freq / 1000}k` : `${freq}`
}
</script>

<template>
  <div
    v-if="playerStore.showEQModal"
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    @click.self="playerStore.showEQModal = false"
  >
    <div class="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-6">
      <!-- 头部 -->
      <div class="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div class="flex items-center gap-2">
          <Sliders class="w-5 h-5 text-emerald-400" />
          <h3 class="font-bold text-white text-lg">专业 10 段图形均衡器 (EQ)</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="text-xs text-neutral-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
            @click="playerStore.setEQPreset('default')"
          >
            <RotateCcw class="w-3.5 h-3.5" /> 重置
          </button>
          <button
            class="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            @click="playerStore.showEQModal = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- 预设选择器 -->
      <div>
        <div class="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">预设音效</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in presets"
            :key="p.key"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            :class="[
              playerStore.eqPreset === p.key
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700',
            ]"
            @click="playerStore.setEQPreset(p.key)"
          >
            {{ p.name }}
          </button>
          <span
            v-if="playerStore.eqPreset === 'custom'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
          >
            自定义调节中
          </span>
        </div>
      </div>

      <!-- 10 段频点滑块 -->
      <div class="grid grid-cols-10 gap-2 items-end h-48 pt-4 pb-2 bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
        <div
          v-for="(freq, idx) in EQ_FREQUENCIES"
          :key="freq"
          class="flex flex-col items-center h-full justify-between"
        >
          <span class="text-[10px] font-mono text-neutral-400">
            {{ playerStore.eqGains[idx] > 0 ? `+${playerStore.eqGains[idx]}` : playerStore.eqGains[idx] }}
          </span>

          <!-- 纵向滑块 -->
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            :value="playerStore.eqGains[idx]"
            class="w-24 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 -rotate-90 my-auto"
            @input="(e: any) => playerStore.setEQGain(idx, Number(e.target.value))"
          />

          <span class="text-[10px] font-semibold text-neutral-500 font-mono mt-2">
            {{ formatFreq(freq) }}
          </span>
        </div>
      </div>

      <div class="text-right text-[11px] text-neutral-500">
        基于 Web Audio API 实时高精度滤波运算 (±12 dB)
      </div>
    </div>
  </div>
</template>
