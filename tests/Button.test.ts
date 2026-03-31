import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../src/components/common/Button.vue'

describe('Button 组件', () => {
  it('应该渲染按钮', () => {
    const wrapper = mount(Button, {
      slots: {
        default: '点击我',
      },
    })

    const button = wrapper.find('.btn')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('点击我')
  })

  it('应该使用默认 variant (primary)', () => {
    const wrapper = mount(Button, {
      slots: { default: '按钮' },
    })

    const button = wrapper.find('.btn')
    expect(button.classes()).toContain('btn-primary')
  })

  it('应该支持不同的 variant', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger']
    
    variants.forEach(variant => {
      const wrapper = mount(Button, {
        props: { variant: variant as any },
        slots: { default: '按钮' },
      })

      const button = wrapper.find('.btn')
      expect(button.classes()).toContain(`btn-${variant}`)
    })
  })

  it('应该使用默认 size (md)', () => {
    const wrapper = mount(Button, {
      slots: { default: '按钮' },
    })

    const button = wrapper.find('.btn')
    expect(button.classes()).toContain('btn-md')
  })

  it('应该支持不同的 size', () => {
    const sizes = ['sm', 'md', 'lg']
    
    sizes.forEach(size => {
      const wrapper = mount(Button, {
        props: { size: size as any },
        slots: { default: '按钮' },
      })

      const button = wrapper.find('.btn')
      expect(button.classes()).toContain(`btn-${size}`)
    })
  })

  it('应该支持禁用状态', () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: '按钮' },
    })

    const button = wrapper.find('.btn')
    expect(button.classes()).toContain('btn-disabled')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('应该支持加载状态', () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: '按钮' },
    })

    const button = wrapper.find('.btn')
    expect(button.classes()).toContain('btn-loading')
    expect(button.attributes('disabled')).toBeDefined()

    const loadingIcon = wrapper.find('.btn-loading-icon')
    expect(loadingIcon.exists()).toBe(true)
  })

  it('应该支持图标按钮模式', () => {
    const wrapper = mount(Button, {
      props: { iconOnly: true },
      slots: {
        default: '文字',
        icon: '<svg class="test-icon"></svg>',
      },
    })

    const button = wrapper.find('.btn')
    expect(button.classes()).toContain('btn-icon')

    // 图标按钮不应该显示文字
    const btnText = wrapper.find('.btn-text')
    expect(btnText.exists()).toBe(false)

    // 应该显示图标
    const icon = wrapper.find('.test-icon')
    expect(icon.exists()).toBe(true)
  })

  it('应该支持自定义 type', () => {
    const types = ['button', 'submit', 'reset']
    
    types.forEach(type => {
      const wrapper = mount(Button, {
        props: { type: type as any },
        slots: { default: '按钮' },
      })

      const button = wrapper.find('.btn')
      expect(button.attributes('type')).toBe(type)
    })
  })

  it('应该在点击时触发事件', async () => {
    const onClick = vi.fn()
    
    const wrapper = mount(Button, {
      slots: { default: '按钮' },
      props: { onClick },
    })

    await wrapper.find('.btn').trigger('click')

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('在禁用状态下不应该触发点击事件', async () => {
    const onClick = vi.fn()
    
    const wrapper = mount(Button, {
      props: { disabled: true, onClick },
      slots: { default: '按钮' },
    })

    await wrapper.find('.btn').trigger('click')

    expect(onClick).not.toHaveBeenCalled()
  })

  it('在加载状态下不应该触发点击事件', async () => {
    const onClick = vi.fn()
    
    const wrapper = mount(Button, {
      props: { loading: true, onClick },
      slots: { default: '按钮' },
    })

    await wrapper.find('.btn').trigger('click')

    expect(onClick).not.toHaveBeenCalled()
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
        size: 'lg',
      },
      slots: { default: '按钮' },
    })

    const button = wrapper.find('.btn')
    expect(button.classes()).toContain('btn')
    expect(button.classes()).toContain('btn-primary')
    expect(button.classes()).toContain('btn-lg')
  })

  it('图标按钮应该应用圆形边框', () => {
    const wrapper = mount(Button, {
      props: { iconOnly: true },
      slots: { default: '图标' },
    })

    const button = wrapper.find('.btn')
    // 图标按钮的 border-radius 应该是 50% (在样式中定义)
    expect(button.classes()).toContain('btn-icon')
  })
})
