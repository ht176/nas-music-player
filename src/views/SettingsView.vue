<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '../stores/server'
import { SubsonicClient } from '../api/client'
import { Server, CheckCircle2, AlertCircle, Plus, Trash2, Check, Radio } from 'lucide-vue-next'

const router = useRouter()
const serverStore = useServerStore()

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
</script>

<template>
  <div class="max-w-2xl mx-auto pt-6 pb-16 space-y-8">
    <div class="text-center space-y-2">
      <div class="inline-flex p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-emerald-400">
        <Server class="w-8 h-8" />
      </div>
      <h1 class="text-2xl font-bold text-white">多服务器节点管理</h1>
      <p class="text-sm text-neutral-400">配置多个 Navidrome 实例（如内网直连、外网穿透等），随时一键切换</p>
    </div>

    <!-- 已保存的服务器列表卡片 -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-neutral-300">已配置的服务器 ({{ serverStore.servers.length }})</h2>
        <button
          v-if="!showAddForm"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition cursor-pointer"
          @click="showAddForm = true"
        >
          <Plus class="w-4 h-4" /> 添加新服务器
        </button>
      </div>

      <div v-if="serverStore.servers.length" class="space-y-2">
        <div
          v-for="srv in serverStore.servers"
          :key="srv.id"
          class="flex items-center justify-between p-4 rounded-xl border transition cursor-pointer"
          :class="[
            srv.id === serverStore.activeServerId
              ? 'bg-neutral-900 border-emerald-500/50 shadow-lg'
              : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900',
          ]"
          @click="onSwitch(srv.id)"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              :class="srv.id === serverStore.activeServerId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'"
            >
              <Radio class="w-5 h-5" />
            </div>
            <div class="truncate">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-sm text-white truncate">{{ srv.name }}</span>
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
              class="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition cursor-pointer"
              @click.stop="onSwitch(srv.id)"
            >
              连接
            </button>

            <button
              class="p-2 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              title="删除此配置"
              @click="onRemove(srv.id, $event)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-10 bg-neutral-900/40 rounded-xl border border-neutral-800/60 text-neutral-500 text-sm">
        暂未保存任何服务器配置，请在下方添加您的首个 NAS 实例
      </div>
    </div>

    <!-- 添加新服务器表单 -->
    <div v-if="showAddForm || !serverStore.servers.length" class="bg-neutral-900/80 p-6 rounded-2xl border border-neutral-800 space-y-4 shadow-xl">
      <div class="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 class="font-bold text-white text-base">添加 Navidrome 节点</h3>
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
          placeholder="例如: 极空间NAS内网 / 异地穿透"
          class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">NAS 访问地址 *</label>
        <input
          v-model="serverUrl"
          type="url"
          required
          placeholder="例如: http://192.168.1.100:4533 或 https://music.yourdomain.com"
          class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
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
            class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">密码 *</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div v-if="errorMsg" class="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
        <AlertCircle class="w-4 h-4 shrink-0" /> {{ errorMsg }}
      </div>

      <div v-if="successMsg" class="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
        <CheckCircle2 class="w-4 h-4 shrink-0" /> {{ successMsg }}
      </div>

      <button
        type="button"
        :disabled="loading"
        class="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold text-sm transition shadow-lg cursor-pointer"
        @click="handleAddServer"
      >
        <span v-if="loading">正在测试并保存...</span>
        <span v-else>保存并启用该节点</span>
      </button>
    </div>
  </div>
</template>
