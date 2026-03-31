import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Sidebar from '../src/components/layout/Sidebar.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/library', name: 'library', component: { template: '<div>Library</div>' } },
    { path: '/search', name: 'search', component: { template: '<div>Search</div>' } },
    { path: '/playlist/favorites', name: 'favorites', component: { template: '<div>Favorites</div>' } },
    { path: '/playlist/history', name: 'history', component: { template: '<div>History</div>' } },
  ],
})

describe('Sidebar 组件', () => {
  it('应该渲染主导航区域', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const navSections = wrapper.findAll('.nav-section')
    expect(navSections.length).toBeGreaterThanOrEqual(1)

    // 检查主导航标题
    const sectionTitles = wrapper.findAll('.nav-section-title')
    expect(sectionTitles.length).toBeGreaterThanOrEqual(1)
  })

  it('应该渲染首页导航项', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const homeLink = wrapper.find('a[href="/"]')
    expect(homeLink.exists()).toBe(true)

    const homeIcon = homeLink.find('.nav-icon')
    expect(homeIcon.exists()).toBe(true)

    const homeText = homeLink.find('.nav-text')
    expect(homeText.text()).toBe('首页')
  })

  it('应该渲染音乐库导航项', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const libraryLink = wrapper.find('a[href="/library"]')
    expect(libraryLink.exists()).toBe(true)

    const libraryText = libraryLink.find('.nav-text')
    expect(libraryText.text()).toBe('音乐库')
  })

  it('应该渲染搜索导航项', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const searchLink = wrapper.find('a[href="/search"]')
    expect(searchLink.exists()).toBe(true)

    const searchText = searchLink.find('.nav-text')
    expect(searchText.text()).toBe('搜索')
  })

  it('应该渲染我喜欢导航项', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const favoritesLink = wrapper.find('a[href="/playlist/favorites"]')
    expect(favoritesLink.exists()).toBe(true)

    const favoritesText = favoritesLink.find('.nav-text')
    expect(favoritesText.text()).toBe('我喜欢')
  })

  it('应该渲染最近播放导航项', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const historyLink = wrapper.find('a[href="/playlist/history"]')
    expect(historyLink.exists()).toBe(true)

    const historyText = historyLink.find('.nav-text')
    expect(historyText.text()).toBe('最近播放')
  })

  it('应该渲染创建歌单按钮', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const createBtn = wrapper.find('.create-playlist-btn')
    expect(createBtn.exists()).toBe(true)

    const iconPlus = createBtn.find('.icon-plus')
    expect(iconPlus.exists()).toBe(true)
  })

  it('导航项应该有正确的图标', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const navItems = wrapper.findAll('.nav-item')
    navItems.forEach(item => {
      const icon = item.find('.nav-icon')
      expect(icon.exists()).toBe(true)
    })
  })

  it('应该应用侧边栏样式类', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const sidebar = wrapper.find('.sidebar')
    expect(sidebar.exists()).toBe(true)
    expect(sidebar.classes()).toContain('sidebar')
  })

  it('导航列表应该是无序列表', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    const navLists = wrapper.findAll('.nav-list')
    expect(navLists.length).toBeGreaterThan(0)
    
    navLists.forEach(list => {
      expect(list.element.tagName).toBe('UL')
    })
  })
})
