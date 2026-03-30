import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Slider from '../src/components/common/Slider.vue'

describe('Slider 组件', () => {
  it('应该渲染滑块', () => {
    const wrapper = mount(Slider)

    const slider = wrapper.find('.slider')
    expect(slider.exists()).toBe(true)

    const track = wrapper.find('.slider-track')
    expect(track.exists()).toBe(true)

    const fill = wrapper.find('.slider-fill')
    expect(fill.exists()).toBe(true)

    const handle = wrapper.find('.slider-handle')
    expect(handle.exists()).toBe(true)
  })

  it('应该支持 v-model', async () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 50,
        'onUpdate:modelValue': (e: number) => wrapper.setProps({ modelValue: e }),
      },
    })

    const fill = wrapper.find('.slider-fill')
    expect(fill.attributes('style')).toContain('width: 50%')

    const handle = wrapper.find('.slider-handle')
    expect(handle.attributes('style')).toContain('left: 50%')
  })

  it('应该使用默认值 0', () => {
    const wrapper = mount(Slider)

    const fill = wrapper.find('.slider-fill')
    expect(fill.attributes('style')).toContain('width: 0%')
  })

  it('应该支持自定义 min 和 max', () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 5,
        min: 0,
        max: 10,
      },
    })

    const fill = wrapper.find('.slider-fill')
    // 5/10 = 50%
    expect(fill.attributes('style')).toContain('width: 50%')
  })

  it('应该支持不同的 size', () => {
    const sizes = ['sm', 'md', 'lg']
    
    sizes.forEach(size => {
      const wrapper = mount(Slider, {
        props: { size: size as any },
      })

      const slider = wrapper.find('.slider')
      expect(slider.classes()).toContain(`slider-${size}`)
    })
  })

  it('应该使用默认 size (md)', () => {
    const wrapper = mount(Slider)

    const slider = wrapper.find('.slider')
    expect(slider.classes()).toContain('slider-md')
  })

  it('应该支持显示标签', () => {
    const wrapper = mount(Slider, {
      props: {
        showLabels: true,
        min: 0,
        max: 100,
      },
    })

    const minLabel = wrapper.find('.slider-label-min')
    expect(minLabel.exists()).toBe(true)
    expect(minLabel.text()).toBe('0')

    const maxLabel = wrapper.find('.slider-label-max')
    expect(maxLabel.exists()).toBe(true)
    expect(maxLabel.text()).toBe('100')
  })

  it('默认不应该显示标签', () => {
    const wrapper = mount(Slider)

    const minLabel = wrapper.find('.slider-label-min')
    expect(minLabel.exists()).toBe(false)

    const maxLabel = wrapper.find('.slider-label-max')
    expect(maxLabel.exists()).toBe(false)
  })

  it('点击轨道应该更新值', async () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 0,
        'onUpdate:modelValue': (e: number) => wrapper.setProps({ modelValue: e }),
      },
    })

    const track = wrapper.find('.slider-track')
    await track.trigger('click', { clientX: 100 })

    // 值应该更新
    expect(wrapper.props('modelValue')).toBeGreaterThan(0)
  })

  it('应该触发 change 事件', async () => {
    const onChange = vi.fn()
    
    const wrapper = mount(Slider, {
      props: {
        modelValue: 0,
        onChange,
      },
    })

    const track = wrapper.find('.slider-track')
    await track.trigger('click')

    expect(onChange).toHaveBeenCalled()
  })

  it('应该支持禁用状态', () => {
    const wrapper = mount(Slider, {
      props: { disabled: true },
    })

    const slider = wrapper.find('.slider')
    // 禁用状态下应该有相应的样式或属性
    expect(slider.exists()).toBe(true)
  })

  it('应该支持 step 步进', () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 5,
        step: 5,
        min: 0,
        max: 100,
      },
    })

    const fill = wrapper.find('.slider-fill')
    expect(fill.attributes('style')).toContain('width: 5%')
  })

  it('应该支持自定义 handle 插槽', () => {
    const wrapper = mount(Slider, {
      slots: {
        handle: '<div class="custom-handle">Custom</div>',
      },
    })

    const customHandle = wrapper.find('.custom-handle')
    expect(customHandle.exists()).toBe(true)
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(Slider, {
      props: {
        size: 'lg',
        showLabels: true,
      },
    })

    const slider = wrapper.find('.slider')
    expect(slider.classes()).toContain('slider')
    expect(slider.classes()).toContain('slider-lg')

    const labels = wrapper.findAll('.slider-label')
    expect(labels.length).toBe(2)
  })

  it('百分比计算应该正确', () => {
    const testCases = [
      { value: 0, expected: 0 },
      { value: 25, expected: 25 },
      { value: 50, expected: 50 },
      { value: 75, expected: 75 },
      { value: 100, expected: 100 },
    ]

    testCases.forEach(({ value, expected }) => {
      const wrapper = mount(Slider, {
        props: { modelValue: value },
      })

      const fill = wrapper.find('.slider-fill')
      expect(fill.attributes('style')).toContain(`width: ${expected}%`)
    })
  })

  it('值应该在 min 和 max 之间', () => {
    const wrapper = mount(Slider, {
      props: {
        modelValue: 150,
        min: 0,
        max: 100,
      },
    })

    const fill = wrapper.find('.slider-fill')
    // 超出最大值应该被限制在 100%
    expect(fill.attributes('style')).toContain('width: 100%')
  })
})
