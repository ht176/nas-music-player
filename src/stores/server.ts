import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { SubsonicClient } from '../api/client'
import type { ServerConfig } from '../api/types'

const STORAGE_LIST_KEY = 'nas_music_servers_list'
const ACTIVE_SERVER_ID_KEY = 'nas_music_active_server_id'

export const useServerStore = defineStore('server', () => {
  const servers = ref<ServerConfig[]>([])
  const activeServerId = ref<string>('')
  const isConnected = ref(false)

  const server = computed(() => {
    return servers.value.find((s) => s.id === activeServerId.value) || servers.value[0] || null
  })

  const client = computed(() => {
    if (server.value) {
      return new SubsonicClient(server.value)
    }
    return null
  })

  function loadConfig() {
    try {
      const rawList = localStorage.getItem(STORAGE_LIST_KEY)
      if (rawList) {
        servers.value = JSON.parse(rawList)
      } else {
        // 兼容单服旧配置迁移
        const legacy = localStorage.getItem('nas_music_server_config')
        if (legacy) {
          const parsed = JSON.parse(legacy) as ServerConfig
          servers.value = [parsed]
          activeServerId.value = parsed.id
        }
      }

      const activeId = localStorage.getItem(ACTIVE_SERVER_ID_KEY)
      if (activeId && servers.value.some((s) => s.id === activeId)) {
        activeServerId.value = activeId
      } else if (servers.value.length > 0) {
        activeServerId.value = servers.value[0].id
      }

      if (server.value) {
        isConnected.value = true
      }
    } catch (e) {
      console.error('加载多服务器配置失败', e)
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(servers.value))
    localStorage.setItem(ACTIVE_SERVER_ID_KEY, activeServerId.value)
  }

  async function addOrUpdateServer(cfg: ServerConfig): Promise<boolean> {
    const testClient = new SubsonicClient(cfg)
    const ok = await testClient.ping()
    if (ok) {
      const idx = servers.value.findIndex((s) => s.id === cfg.id)
      if (idx >= 0) {
        servers.value[idx] = cfg
      } else {
        servers.value.push(cfg)
      }
      activeServerId.value = cfg.id
      isConnected.value = true
      saveToStorage()
      return true
    }
    return false
  }

  async function switchServer(id: string): Promise<boolean> {
    const target = servers.value.find((s) => s.id === id)
    if (!target) return false

    const testClient = new SubsonicClient(target)
    try {
      const ok = await testClient.ping()
      if (ok) {
        activeServerId.value = id
        isConnected.value = true
        saveToStorage()
        return true
      }
    } catch {
      // 容错
    }
    return false
  }

  function removeServer(id: string) {
    servers.value = servers.value.filter((s) => s.id !== id)
    if (activeServerId.value === id) {
      activeServerId.value = servers.value[0]?.id || ''
    }
    saveToStorage()
  }

  function clearAllServers() {
    servers.value = []
    activeServerId.value = ''
    isConnected.value = false
    localStorage.removeItem(STORAGE_LIST_KEY)
    localStorage.removeItem(ACTIVE_SERVER_ID_KEY)
  }

  loadConfig()

  return {
    servers,
    activeServerId,
    server,
    isConnected,
    client,
    loadConfig,
    addOrUpdateServer,
    switchServer,
    removeServer,
    clearAllServers,
  }
})
