<template>
  <div class="playlists">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">我的歌单</h1>
      <Button @click="showCreateModal = true" variant="primary" size="md">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 mr-2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        创建歌单
      </Button>
    </div>
    
    <!-- 歌单列表 -->
    <div v-if="playlists.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="playlist in playlists"
        :key="playlist.id"
        class="bg-secondary rounded-lg p-4 hover:bg-tertiary transition-all cursor-pointer group relative"
        @click="handlePlaylistClick(playlist)"
      >
        <!-- 封面 -->
        <div class="aspect-square bg-tertiary rounded-md mb-3 overflow-hidden relative">
          <div v-if="playlist.songCount > 0" class="absolute inset-0 flex items-center justify-center text-4xl">
            🎵
          </div>
          <div v-else class="absolute inset-0 flex items-center justify-center text-4xl text-text-tertiary">
            📀
          </div>
          
          <!-- 播放按钮 -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-12 h-12 text-white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        
        <!-- 信息 -->
        <h3 class="font-medium truncate">{{ playlist.name }}</h3>
        <p class="text-sm text-tertiary">{{ playlist.songCount }} 首歌曲</p>
        
        <!-- 操作按钮 -->
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            class="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            @click.stop="handleEdit(playlist)"
            title="编辑"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            class="p-2 bg-black/50 rounded-full hover:bg-red-500/70 transition-colors ml-1"
            @click.stop="handleDelete(playlist)"
            title="删除"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="text-center text-secondary py-12">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-24 h-24 mx-auto mb-4 opacity-30">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
      <p class="text-lg">还没有歌单</p>
      <p class="text-sm mt-2">点击上方按钮创建第一个歌单</p>
    </div>
    
    <!-- 创建/编辑歌单弹窗 -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="closeModals"
    >
      <div
        class="bg-primary rounded-lg p-6 w-full max-w-md"
        @click.stop
        @keyup.enter="handleSubmit"
      >
        <h2 class="text-xl font-bold mb-4">
          {{ showCreateModal ? '创建歌单' : '编辑歌单' }}
        </h2>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">歌单名称</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="输入歌单名称"
            class="w-full px-4 py-2 bg-secondary rounded-lg border border-border-subtle focus:border-primary focus:outline-none"
            autofocus
          />
        </div>
        
        <div class="mb-4" v-if="showEditModal">
          <label class="block text-sm font-medium mb-2">歌单描述</label>
          <textarea
            v-model="formData.description"
            placeholder="描述一下这个歌单（可选）"
            rows="3"
            class="w-full px-4 py-2 bg-secondary rounded-lg border border-border-subtle focus:border-primary focus:outline-none resize-none"
          ></textarea>
        </div>
        
        <div class="flex justify-end gap-3">
          <Button @click="closeModals" variant="ghost">
            取消
          </Button>
          <Button @click="handleSubmit" variant="primary" :disabled="!formData.name.trim()">
            {{ showCreateModal ? '创建' : '保存' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/common/Button.vue'

interface Playlist {
  id: string
  name: string
  description?: string
  songCount: number
  createdAt: string
  songs: string[] // 歌曲 ID 列表
}

const router = useRouter()

const playlists = ref<Playlist[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingPlaylist = ref<Playlist | null>(null)

const formData = reactive({
  name: '',
  description: '',
})

// 从 localStorage 加载歌单
function loadPlaylists() {
  const saved = localStorage.getItem('playlists')
  if (saved) {
    try {
      playlists.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load playlists:', e)
      playlists.value = []
    }
  }
}

// 保存歌单到 localStorage
function savePlaylists() {
  localStorage.setItem('playlists', JSON.stringify(playlists.value))
}

// 创建歌单
function handleSubmit() {
  if (!formData.name.trim()) return
  
  if (showCreateModal.value) {
    // 创建新歌单
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      songCount: 0,
      createdAt: new Date().toISOString(),
      songs: [],
    }
    playlists.value.push(newPlaylist)
  } else if (showEditModal.value && editingPlaylist.value) {
    // 更新歌单
    editingPlaylist.value.name = formData.name.trim()
    editingPlaylist.value.description = formData.description.trim()
  }
  
  savePlaylists()
  closeModals()
}

// 编辑歌单
function handleEdit(playlist: Playlist) {
  editingPlaylist.value = playlist
  formData.name = playlist.name
  formData.description = playlist.description || ''
  showEditModal.value = true
  showCreateModal.value = false
}

// 删除歌单
function handleDelete(playlist: Playlist) {
  if (confirm(`确定要删除歌单 "${playlist.name}" 吗？`)) {
    playlists.value = playlists.value.filter(p => p.id !== playlist.id)
    savePlaylists()
  }
}

// 关闭弹窗
function closeModals() {
  showCreateModal.value = false
  showEditModal.value = false
  editingPlaylist.value = null
  formData.name = ''
  formData.description = ''
}

// 点击歌单
function handlePlaylistClick(playlist: Playlist) {
  router.push(`/playlist/${playlist.id}`)
}

// 组件挂载时加载歌单
onMounted(() => {
  loadPlaylists()
})
</script>

<style scoped>
.playlists {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}
</style>
