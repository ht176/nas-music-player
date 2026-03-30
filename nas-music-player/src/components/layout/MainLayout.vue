<template>
  <div class="app-layout">
    <!-- 顶部导航 -->
    <Header />
    
    <div class="main-container">
      <!-- 侧边栏 (桌面端) -->
      <Sidebar />
      
      <!-- 主内容区 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 底部播放栏 -->
    <PlayerBar />
    
    <!-- 移动端底部导航 -->
    <MobileNav />
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
import PlayerBar from './PlayerBar.vue'
import MobileNav from './MobileNav.vue'
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  margin-top: 64px; /* Header 高度 */
  margin-bottom: 96px; /* PlayerBar 高度 */
}

.main-content {
  flex: 1;
  margin-left: 240px; /* Sidebar 宽度 */
  overflow-y: auto;
  background: var(--bg-primary);
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-container {
    margin-bottom: 64px; /* 移动端 PlayerBar 高度 */
  }

  .main-content {
    margin-left: 0;
  }
}
</style>
