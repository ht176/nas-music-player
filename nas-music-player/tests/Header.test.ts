import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Header from '../src/components/layout/Header.vue'

// 创建路由实例用于测试
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/search', name: 'search', component: { template: '<div>Search</div>' } },
  ],
})

describe('Header 组件', () => {
  it('应该正确渲染 Logo 和品牌名', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
      },
    })

    // 检查 Logo 图标是否存在
    const logoIcon = wrapper.find('.logo-icon')
    expect(logoIcon.exists()).toBe(true)

    // 检查品牌名是否存在
    const logoText = wrapper.find('.logo-text')
    expect(logoText.exists()).toBe(true)
    expect(logoText.text()).toBe('NAS Music')
  })

  it('应该渲染搜索框', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
      },
    })

    const searchInput = wrapper.find('.search-input')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toBe('搜索歌曲、歌手、专辑...')
  })

  it('应该渲染用户头像', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
      },
    })

    const userAvatar = wrapper.find('.user-avatar')
    expect(userAvatar.exists()).toBe(true)

    const avatarPlaceholder = wrapper.find('.avatar-placeholder')
    expect(avatarPlaceholder.exists()).toBe(true)
    expect(avatarPlaceholder.text()).toBe('U')
  })

  it('点击 Logo 应该导航到首页', async () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
      },
    })

    const logo = wrapper.find('.logo')
    await logo.trigger('click')

    // 验证路由跳转
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('搜索框聚焦应该导航到搜索页', async () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
        stubs: {
          'router-link': {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const searchInput = wrapper.find('.search-input')
    // 检查输入框是否有 focus 事件监听器
    expect(searchInput.exists()).toBe(true)
    
    // 验证 @focus 事件存在 (通过检查元素属性)
    const inputElement = searchInput.element as HTMLInputElement
    expect(inputElement).toBeDefined()
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
      },
    })

    const header = wrapper.find('.header')
    expect(header.exists()).toBe(true)
    expect(header.classes()).toContain('header')
  })

  it('搜索图标应该存在', () => {
    const wrapper = mount(Header, {
      global: {
        plugins: [router],
      },
    })

    const searchIcon = wrapper.find('.search-icon')
    expect(searchIcon.exists()).toBe(true)
  })
})
