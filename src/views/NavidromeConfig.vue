<template>
  <div class="navidrome-config">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">服务器配置</h1>
      <Button @click="showAddServer = true" variant="primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 mr-2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        添加服务器
      </Button>
    </div>
    
    <!-- 服务器列表 -->
    <div v-if="servers.length > 0" class="servers-grid mb-8">
      <div
        v-for="server in servers"
        :key="server.id"
        class="server-card"
        :class="{ 'is-active': activeServerId === server.id }"
      >
        <div class="server-header">
          <div class="server-info">
            <h3 class="server-name">{{ server.name }}</h3>
            <p class="server-url">{{ server.url }}</p>
          </div>
          <div class="server-status" :class="server.status">
            <span class="status-dot"></span>
            <span class="status-text">{{ server.status === 'connected' ? '已连接' : server.status === 'error' ? '连接失败' : '未测试' }}</span>
          </div>
        </div>
        
        <div class="server-actions">
          <Button @click="handleSelectServer(server)" variant="secondary" size="sm">
            {{ activeServerId === server.id ? '当前服务器' : '切换' }}
          </Button>
          <Button @click="handleEditServer(server)" variant="ghost" size="sm">
            编辑
          </Button>
          <Button @click="handleTestServer(server)" variant="ghost" size="sm" :loading="server.testing">
            测试
          </Button>
          <Button @click="handleDeleteServer(server)" variant="danger" size="sm">
            删除
          </Button>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-16 h-16 mb-4 opacity-30">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/>
        <line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>
      <p class="text-lg text-secondary mb-4">还没有配置服务器</p>
      <Button @click="showAddServer = true" variant="primary">
        添加第一个服务器
      </Button>
    </div>
    
    <!-- 添加/编辑服务器弹窗 -->
    <div
      v-if="showAddServer || showEditServer"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div
        class="bg-primary rounded-lg p-6 w-full max-w-md"
        @click.stop
        @keyup.enter="handleSubmit"
      >
        <h2 class="text-xl font-bold mb-4">
          {{ showAddServer ? '添加服务器' : '编辑服务器' }}
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">服务器名称</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="例如：家庭 NAS、公司服务器"
              class="w-full px-4 py-2 bg-secondary rounded-lg border border-border-subtle focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">服务器地址</label>
            <input
              v-model="formData.url"
              type="url"
              placeholder="https://music.example.com:4533"
              class="w-full px-4 py-2 bg-secondary rounded-lg border border-border-subtle focus:border-primary focus:outline-none"
            />
            <p class="text-xs text-tertiary mt-1">包含协议和端口</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">用户名</label>
            <input
              v-model="formData.username"
              type="text"
              placeholder="your-username"
              class="w-full px-4 py-2 bg-secondary rounded-lg border border-border-subtle focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">密码</label>
            <input
              v-model="formData.password"
              type="password"
              placeholder="your-password"
              class="w-full px-4 py-2 bg-secondary rounded-lg border border-border-subtle focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <Button @click="closeModal" variant="ghost">
            取消
          </Button>
          <Button @click="handleSubmit" variant="primary" :disabled="!formData.name || !formData.url">
            {{ showAddServer ? '添加' : '保存' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNavidromeStore } from '@/stores/navidrome'
import { ping } from '@/api/navidrome'
import Button from '@/components/common/Button.vue'

interface Server {
  id: string
  name: string
  url: string
  username: string
  password: string
  status: 'connected' | 'error' | 'unknown'
  testing?: boolean
  lastTest?: number
}

const router = useRouter()
const navidromeStore = useNavidromeStore()

const servers = ref<Server[]>([])
const activeServerId = ref<string | null>(null)
const showAddServer = ref(false)
const showEditServer = ref(false)
const editingServerId = ref<string | null>(null)

const formData = reactive({
  name: '',
  url: '',
  username: '',
  password: '',
})

// 加载服务器配置
function loadServers() {
  const saved = localStorage.getItem('navidrome-servers')
  if (saved) {
    try {
      servers.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load servers:', e)
      servers.value = []
    }
  }
  
  const activeId = localStorage.getItem('navidrome-active-server')
  if (activeId) {
    activeServerId.value = activeId
  }
}

// 保存服务器配置
function saveServers() {
  localStorage.setItem('navidrome-servers', JSON.stringify(servers.value))
  if (activeServerId.value) {
    localStorage.setItem('navidrome-active-server', activeServerId.value)
  }
}

// 添加服务器
function handleSubmit() {
  if (showAddServer.value) {
    const newServer: Server = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      url: formData.url.trim(),
      username: formData.username.trim(),
      password: formData.password,
      status: 'unknown',
    }
    servers.value.push(newServer)
  } else if (showEditServer.value && editingServerId.value) {
    const index = servers.value.findIndex(s => s.id === editingServerId.value)
    if (index !== -1) {
      servers.value[index].name = formData.name.trim()
      servers.value[index].url = formData.url.trim()
      servers.value[index].username = formData.username.trim()
      if (formData.password) {
        servers.value[index].password = formData.password
      }
    }
  }
  
  saveServers()
  closeModal()
}

// 编辑服务器
function handleEditServer(server: Server) {
  editingServerId.value = server.id
  formData.name = server.name
  formData.url = server.url
  formData.username = server.username
  formData.password = ''
  showEditServer.value = true
  showAddServer.value = false
}

// 删除服务器
function handleDeleteServer(server: Server) {
  if (confirm(`确定要删除服务器 "${server.name}" 吗？`)) {
    servers.value = servers.value.filter(s => s.id !== server.id)
    if (activeServerId.value === server.id) {
      activeServerId.value = servers.value[0]?.id || null
    }
    saveServers()
  }
}

// 选择服务器
async function handleSelectServer(server: Server) {
  activeServerId.value = server.id
  
  // 更新 API 配置
  localStorage.setItem('navidrome-config', JSON.stringify({
    url: server.url,
    username: server.username,
    password: server.password,
  }))
  
  saveServers()
  
  // 重新加载音乐库
  await navidromeStore.testConnection()
  
  // 跳转到首页
  router.push('/')
}

// 测试服务器连接
async function handleTestServer(server: Server) {
  server.testing = true
  
  try {
    // 临时切换配置进行测试
    const originalConfig = localStorage.getItem('navidrome-config')
    localStorage.setItem('navidrome-config', JSON.stringify({
      url: server.url,
      username: server.username,
      password: server.password,
    }))
    
    await ping()
    server.status = 'connected'
  } catch (e) {
    server.status = 'error'
  } finally {
    server.testing = false
    server.lastTest = Date.now()
    
    // 恢复原配置
    if (activeServerId.value) {
      const activeServer = servers.value.find(s => s.id === activeServerId.value)
      if (activeServer) {
        localStorage.setItem('navidrome-config', JSON.stringify({
          url: activeServer.url,
          username: activeServer.username,
          password: activeServer.password,
        }))
      }
    }
    
    saveServers()
  }
}

// 关闭弹窗
function closeModal() {
  showAddServer.value = false
  showEditServer.value = false
  editingServerId.value = null
  formData.name = ''
  formData.url = ''
  formData.username = ''
  formData.password = ''
}

onMounted(() => {
  loadServers()
})
</script>

<style scoped>
.navidrome-config {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.servers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.server-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.server-card:hover {
  border-color: var(--border-strong);
}

.server-card.is-active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.server-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.server-url {
  font-size: 13px;
  color: var(--text-secondary);
}

.server-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 6px;
}

.server-status.connected {
  color: var(--success);
  background: var(--success-soft);
}

.server-status.error {
  color: var(--error);
  background: var(--error-soft);
}

.server-status.unknown {
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.server-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
}
</style>
