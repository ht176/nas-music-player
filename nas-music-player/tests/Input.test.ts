import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Input from '../src/components/common/Input.vue'

describe('Input 组件', () => {
  it('应该渲染输入框', () => {
    const wrapper = mount(Input)

    const input = wrapper.find('.input')
    expect(input.exists()).toBe(true)
    expect(input.element.tagName).toBe('INPUT')
  })

  it('应该支持 v-model', async () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: '测试值',
        'onUpdate:modelValue': (e: string) => wrapper.setProps({ modelValue: e }),
      },
    })

    const input = wrapper.find('.input')
    expect(input.element.value).toBe('测试值')

    await input.setValue('新值')
    expect(wrapper.props('modelValue')).toBe('新值')
  })

  it('应该支持不同的 type', () => {
    const types = ['text', 'password', 'email', 'number', 'search', 'tel', 'url']
    
    types.forEach(type => {
      const wrapper = mount(Input, {
        props: { type: type as any },
      })

      const input = wrapper.find('.input')
      expect(input.attributes('type')).toBe(type)
    })
  })

  it('应该支持 placeholder', () => {
    const placeholder = '请输入...'
    
    const wrapper = mount(Input, {
      props: { placeholder },
    })

    const input = wrapper.find('.input')
    expect(input.attributes('placeholder')).toBe(placeholder)
  })

  it('应该支持禁用状态', () => {
    const wrapper = mount(Input, {
      props: { disabled: true },
    })

    const input = wrapper.find('.input')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('应该支持只读状态', () => {
    const wrapper = mount(Input, {
      props: { readonly: true },
    })

    const input = wrapper.find('.input')
    expect(input.attributes('readonly')).toBeDefined()
  })

  it('应该支持 maxlength', () => {
    const wrapper = mount(Input, {
      props: { maxlength: 10 },
    })

    const input = wrapper.find('.input')
    expect(input.attributes('maxlength')).toBe('10')
  })

  it('应该支持不同的 size', () => {
    const sizes = ['sm', 'md', 'lg']
    
    sizes.forEach(size => {
      const wrapper = mount(Input, {
        props: { size: size as any },
      })

      const wrapperClass = wrapper.find('.input-wrapper')
      expect(wrapperClass.classes()).toContain(`input-wrapper-${size}`)
    })
  })

  it('应该使用默认 size (md)', () => {
    const wrapper = mount(Input)

    const wrapperClass = wrapper.find('.input-wrapper')
    expect(wrapperClass.classes()).toContain('input-wrapper-md')
  })

  it('应该支持错误状态', () => {
    const errorMessage = '这是错误提示'
    
    const wrapper = mount(Input, {
      props: { error: errorMessage },
    })

    const input = wrapper.find('.input')
    expect(input.classes()).toContain('input-error')

    const errorElement = wrapper.find('.input-error-message')
    expect(errorElement.exists()).toBe(true)
    expect(errorElement.text()).toBe(errorMessage)
  })

  it('应该支持可清空功能', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: '测试值',
        clearable: true,
      },
    })

    const clearBtn = wrapper.find('.input-clear-btn')
    expect(clearBtn.exists()).toBe(true)
  })

  it('没有值时不应该显示清空按钮', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: '',
        clearable: true,
      },
    })

    const clearBtn = wrapper.find('.input-clear-btn')
    expect(clearBtn.exists()).toBe(false)
  })

  it('禁用状态下不应该显示清空按钮', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: '测试值',
        clearable: true,
        disabled: true,
      },
    })

    const clearBtn = wrapper.find('.input-clear-btn')
    expect(clearBtn.exists()).toBe(false)
  })

  it('点击清空按钮应该清空值', async () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: '测试值',
        clearable: true,
        'onUpdate:modelValue': (e: string) => wrapper.setProps({ modelValue: e }),
      },
    })

    const clearBtn = wrapper.find('.input-clear-btn')
    await clearBtn.trigger('click')

    expect(wrapper.props('modelValue')).toBe('')
  })

  it('应该触发 focus 事件', async () => {
    const onFocus = vi.fn()
    
    const wrapper = mount(Input, {
      props: {
        onFocus,
      },
    })

    const input = wrapper.find('.input')
    await input.trigger('focus')

    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('应该触发 blur 事件', async () => {
    const onBlur = vi.fn()
    
    const wrapper = mount(Input, {
      props: {
        onBlur,
      },
    })

    const input = wrapper.find('.input')
    await input.trigger('blur')

    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('应该触发 clear 事件', async () => {
    const onClear = vi.fn()
    
    const wrapper = mount(Input, {
      props: {
        modelValue: '测试值',
        clearable: true,
        onClear,
      },
    })

    const clearBtn = wrapper.find('.input-clear-btn')
    await clearBtn.trigger('click')

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('应该支持前置插槽', () => {
    const wrapper = mount(Input, {
      slots: {
        prefix: '<span class="test-prefix">前置</span>',
      },
    })

    const prefix = wrapper.find('.input-prefix')
    expect(prefix.exists()).toBe(true)
    expect(wrapper.find('.test-prefix').exists()).toBe(true)
  })

  it('应该支持后置插槽', () => {
    const wrapper = mount(Input, {
      slots: {
        suffix: '<span class="test-suffix">后置</span>',
      },
    })

    const suffix = wrapper.find('.input-suffix')
    expect(suffix.exists()).toBe(true)
    expect(wrapper.find('.test-suffix').exists()).toBe(true)
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(Input, {
      props: {
        size: 'lg',
        error: '错误',
      },
    })

    const input = wrapper.find('.input')
    expect(input.classes()).toContain('input')
    expect(input.classes()).toContain('input-error')
  })

  it('聚焦时应该添加 focus 类', async () => {
    const wrapper = mount(Input)

    const input = wrapper.find('.input')
    expect(input.classes()).not.toContain('input-focus')

    await input.trigger('focus')
    expect(input.classes()).toContain('input-focus')
  })

  it('失焦时应该移除 focus 类', async () => {
    const wrapper = mount(Input)

    const input = wrapper.find('.input')
    
    await input.trigger('focus')
    expect(input.classes()).toContain('input-focus')

    await input.trigger('blur')
    expect(input.classes()).not.toContain('input-focus')
  })
})
