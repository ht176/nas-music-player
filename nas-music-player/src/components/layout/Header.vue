<template>
  <header class="header">
    <div class="header-left">
      <!-- Logo -->
      <div class="logo" @click="$router.push('/')">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <span class="logo-text">NAS Music</span>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="header-center">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          type="text" 
          placeholder="搜索歌曲、歌手、专辑..." 
          class="search-input"
          @focus="$router.push('/search')"
        />
      </div>
    </div>

    <!-- 用户头像 -->
    <div class="header-right">
      <button class="user-avatar">
        <div class="avatar-placeholder">U</div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
// Header 组件
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(var(--glass-blur));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--primary);
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.header-center {
  flex: 1;
  max-width: 600px;
  margin: 0 24px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 40px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  background: var(--bg-elevated);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.user-avatar:hover {
  border-color: var(--primary);
  transform: scale(1.05);
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: var(--text-inverse);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }

  .logo-text {
    display: none;
  }

  .header-center {
    margin: 0 16px;
  }

  .search-input {
    height: 36px;
  }
}
</style>
