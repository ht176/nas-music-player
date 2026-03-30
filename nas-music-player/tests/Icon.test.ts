import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from '../src/components/common/Icon.vue'

describe('Icon 组件', () => {
  it('应该渲染图标', () => {
    const wrapper = mount(Icon, {
      props: { name: 'play' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.exists()).toBe(true)
  })

  it('应该使用默认 size (24px)', () => {
    const wrapper = mount(Icon, {
      props: { name: 'play' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.attributes('style')).toContain('width: 24px')
    expect(icon.attributes('style')).toContain('height: 24px')
  })

  it('应该支持自定义 size', () => {
    const wrapper = mount(Icon, {
      props: { name: 'play', size: '32px' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.attributes('style')).toContain('width: 32px')
    expect(icon.attributes('style')).toContain('height: 32px')
  })

  it('应该支持预设尺寸类', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    
    sizes.forEach(size => {
      const wrapper = mount(Icon, {
        props: { name: 'play', size: `${size}` as any },
      })

      const icon = wrapper.find('.icon')
      expect(icon.classes()).toContain(`icon-${size}`)
    })
  })

  it('应该使用默认颜色 (default)', () => {
    const wrapper = mount(Icon, {
      props: { name: 'play' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.classes()).toContain('icon-default')
  })

  it('应该支持不同的颜色', () => {
    const colors = ['default', 'primary', 'secondary', 'success', 'error', 'warning']
    
    colors.forEach(color => {
      const wrapper = mount(Icon, {
        props: { name: 'play', color: color as any },
      })

      const icon = wrapper.find('.icon')
      expect(icon.classes()).toContain(`icon-${color}`)
    })
  })

  it('应该渲染播放图标', () => {
    const wrapper = mount(Icon, {
      props: { name: 'play' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.html()).toContain('M8 5v14l11-7z')
  })

  it('应该渲染暂停图标', () => {
    const wrapper = mount(Icon, {
      props: { name: 'pause' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.html()).toContain('M6 4h4v16H6z')
  })

  it('应该渲染收藏图标', () => {
    const wrapper = mount(Icon, {
      props: { name: 'heart' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.html()).toContain('M20.84 4.61a5.5 5.5 0 0 0-7.78 0')
  })

  it('应该渲染搜索图标', () => {
    const wrapper = mount(Icon, {
      props: { name: 'search' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.html()).toContain('M11 11a8 8 0 1 0 0-16')
  })

  it('应该支持自定义插槽内容', () => {
    const wrapper = mount(Icon, {
      props: { name: 'custom' },
      slots: {
        default: '<path d="M12 2L2 22h20L12 2z"/>',
      },
    })

    const icon = wrapper.find('.icon')
    expect(icon.html()).toContain('M12 2L2 22h20L12 2z')
  })

  it('应该应用正确的 viewBox', () => {
    const wrapper = mount(Icon, {
      props: { name: 'play' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.attributes('viewBox')).toBe('0 0 24 24')
  })

  it('应该设置正确的 stroke 属性', () => {
    const wrapper = mount(Icon, {
      props: { name: 'play' },
    })

    const icon = wrapper.find('.icon')
    expect(icon.attributes('stroke')).toBe('currentColor')
    expect(icon.attributes('stroke-width')).toBe('2')
  })

  it('应该支持所有预设图标', () => {
    const iconNames = [
      'play', 'pause', 'stop', 'skipBack', 'skipForward',
      'shuffle', 'repeat', 'volume', 'music', 'heart',
      'search', 'home', 'settings', 'close', 'plus',
    ]

    iconNames.forEach(name => {
      const wrapper = mount(Icon, {
        props: { name },
      })

      const icon = wrapper.find('.icon')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain(`icon-${name}`)
    })
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(Icon, {
      props: { 
        name: 'play',
        size: 'lg',
        color: 'primary',
      },
    })

    const icon = wrapper.find('.icon')
    expect(icon.classes()).toContain('icon')
    expect(icon.classes()).toContain('icon-play')
    expect(icon.classes()).toContain('icon-lg')
    expect(icon.classes()).toContain('icon-primary')
  })
})
