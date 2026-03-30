import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Skeleton from '../src/components/common/Skeleton.vue'

describe('Skeleton 骨架屏组件', () => {
  it('应该渲染文本骨架屏', () => {
    const wrapper = mount(Skeleton, {
      props: {
        type: 'text',
        width: '200px',
        height: '16px',
      },
    })

    expect(wrapper.find('.skeleton-text').exists()).toBe(true)
    expect(wrapper.find('.skeleton-text').attributes('style')).toContain('width: 200px')
  })

  it('应该渲染圆形骨架屏', () => {
    const wrapper = mount(Skeleton, {
      props: {
        type: 'circle',
        size: '50px',
      },
    })

    expect(wrapper.find('.skeleton-circle').exists()).toBe(true)
    expect(wrapper.find('.skeleton-circle').attributes('style')).toContain('width: 50px')
    expect(wrapper.find('.skeleton-circle').attributes('style')).toContain('height: 50px')
  })

  it('应该渲染矩形骨架屏', () => {
    const wrapper = mount(Skeleton, {
      props: {
        type: 'rect',
        width: '100px',
        height: '100px',
      },
    })

    expect(wrapper.find('.skeleton-rect').exists()).toBe(true)
  })

  it('应该渲染歌曲项骨架屏', () => {
    const wrapper = mount(Skeleton, {
      props: {
        type: 'song-item',
      },
    })

    expect(wrapper.find('.skeleton-song-item').exists()).toBe(true)
    expect(wrapper.find('.skeleton-song-index').exists()).toBe(true)
    expect(wrapper.find('.skeleton-song-cover').exists()).toBe(true)
    expect(wrapper.find('.skeleton-song-title').exists()).toBe(true)
    expect(wrapper.find('.skeleton-song-artist').exists()).toBe(true)
  })

  it('应该渲染专辑卡片骨架屏', () => {
    const wrapper = mount(Skeleton, {
      props: {
        type: 'album-card',
      },
    })

    expect(wrapper.find('.skeleton-album-card').exists()).toBe(true)
    expect(wrapper.find('.skeleton-album-cover').exists()).toBe(true)
    expect(wrapper.find('.skeleton-album-title').exists()).toBe(true)
  })

  it('应该支持动画效果', () => {
    const wrapper = mount(Skeleton, {
      props: {
        type: 'text',
        animated: true,
      },
    })

    expect(wrapper.classes()).toContain('skeleton--animated')
  })

  it('应该禁用动画效果', () => {
    const wrapper = mount(Skeleton, {
      props: {
        type: 'text',
        animated: false,
      },
    })

    expect(wrapper.classes()).not.toContain('skeleton--animated')
  })
})
