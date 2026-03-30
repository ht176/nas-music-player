import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AlbumCover from '../src/components/music/AlbumCover.vue'

describe('AlbumCover 组件', () => {
  it('应该渲染专辑封面', () => {
    const wrapper = mount(AlbumCover)

    const albumCover = wrapper.find('.album-cover')
    expect(albumCover.exists()).toBe(true)
  })

  it('应该使用默认尺寸 (md)', () => {
    const wrapper = mount(AlbumCover)

    const albumCover = wrapper.find('.album-cover')
    expect(albumCover.classes()).toContain('album-cover-md')
  })

  it('应该支持不同的尺寸', () => {
    const sizes = ['sm', 'md', 'lg', 'xl']
    
    sizes.forEach(size => {
      const wrapper = mount(AlbumCover, {
        props: { size: size as any },
      })

      const albumCover = wrapper.find('.album-cover')
      expect(albumCover.classes()).toContain(`album-cover-${size}`)
    })
  })

  it('应该渲染封面容器', () => {
    const wrapper = mount(AlbumCover)

    const coverWrapper = wrapper.find('.cover-wrapper')
    expect(coverWrapper.exists()).toBe(true)
  })

  it('应该显示加载状态', async () => {
    const wrapper = mount(AlbumCover, {
      props: { src: 'test.jpg' },
    })

    // 初始状态应该是加载中
    const loading = wrapper.find('.cover-loading')
    expect(loading.exists()).toBe(true)
  })

  it('应该显示错误状态当图片加载失败', async () => {
    const wrapper = mount(AlbumCover, {
      props: { src: 'invalid.jpg' },
    })

    // 触发 error 事件
    const img = wrapper.find('.cover-image')
    await img.trigger('error')

    const error = wrapper.find('.cover-error')
    expect(error.exists()).toBe(true)
  })

  it('应该隐藏加载状态当图片加载完成', async () => {
    const wrapper = mount(AlbumCover, {
      props: { src: 'test.jpg' },
    })

    // 触发 load 事件
    const img = wrapper.find('.cover-image')
    await img.trigger('load')

    const loading = wrapper.find('.cover-loading')
    expect(loading.exists()).toBe(false)
  })

  it('应该支持播放状态', () => {
    const wrapper = mount(AlbumCover, {
      props: { playing: true },
    })

    const albumCover = wrapper.find('.album-cover')
    expect(albumCover.classes()).toContain('album-cover-playing')
  })

  it('应该显示播放遮罩', () => {
    const wrapper = mount(AlbumCover, {
      props: { 
        playing: true,
        showOverlay: true,
      },
    })

    const overlay = wrapper.find('.cover-overlay')
    expect(overlay.exists()).toBe(true)
  })

  it('可以隐藏播放遮罩', () => {
    const wrapper = mount(AlbumCover, {
      props: { 
        playing: true,
        showOverlay: false,
      },
    })

    const overlay = wrapper.find('.cover-overlay')
    expect(overlay.exists()).toBe(false)
  })

  it('应该支持动画效果', () => {
    const wrapper = mount(AlbumCover, {
      props: { animate: true },
    })

    const albumCover = wrapper.find('.album-cover')
    expect(albumCover.classes()).toContain('album-cover-animating')
  })

  it('应该支持显示专辑信息', () => {
    const wrapper = mount(AlbumCover, {
      props: { 
        showInfo: true,
        title: '测试专辑',
        subtitle: '测试歌手',
      },
    })

    const coverInfo = wrapper.find('.cover-info')
    expect(coverInfo.exists()).toBe(true)

    const infoTitle = wrapper.find('.info-title')
    expect(infoTitle.text()).toBe('测试专辑')

    const infoSubtitle = wrapper.find('.info-subtitle')
    expect(infoSubtitle.text()).toBe('测试歌手')
  })

  it('默认不应该显示专辑信息', () => {
    const wrapper = mount(AlbumCover)

    const coverInfo = wrapper.find('.cover-info')
    expect(coverInfo.exists()).toBe(false)
  })

  it('应该支持 alt 属性', () => {
    const wrapper = mount(AlbumCover, {
      props: { 
        src: 'test.jpg',
        alt: '自定义描述',
      },
    })

    const img = wrapper.find('.cover-image')
    expect(img.attributes('alt')).toBe('自定义描述')
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(AlbumCover, {
      props: { 
        size: 'lg',
        playing: true,
        animate: true,
      },
    })

    const albumCover = wrapper.find('.album-cover')
    expect(albumCover.classes()).toContain('album-cover')
    expect(albumCover.classes()).toContain('album-cover-lg')
    expect(albumCover.classes()).toContain('album-cover-playing')
    expect(albumCover.classes()).toContain('album-cover-animating')
  })

  it('封面容器应该有正确的样式', () => {
    const wrapper = mount(AlbumCover)

    const coverWrapper = wrapper.find('.cover-wrapper')
    expect(coverWrapper.exists()).toBe(true)
  })
})
