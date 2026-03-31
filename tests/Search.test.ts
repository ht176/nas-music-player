import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Search from '../src/views/Search.vue'
import * as navidrome from '../src/api/navidrome'

// Mock Navidrome API
vi.mock('../src/api/navidrome', () => ({
  search3: vi.fn(),
  getCoverArtUrl: vi.fn((id: string) => `https://example.com/cover/${id}`),
}))

describe('Search 页面', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('应该渲染搜索框', () => {
    const wrapper = mount(Search, {
      global: {
        plugins: [pinia]
      }
    })

    const searchInput = wrapper.find('input[type="text"]')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toBe('搜索歌曲、专辑、艺术家...')
  })

  it('应该显示初始状态提示', () => {
    const wrapper = mount(Search, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.text()).toContain('输入关键词开始搜索')
    expect(wrapper.text()).toContain('支持搜索歌曲、专辑、艺术家')
  })

  it('应该显示加载状态', async () => {
    let resolvePromise: any
    const mockPromise = new Promise<any>(resolve => {
      resolvePromise = resolve
    })

    vi.mocked(navidrome.search3).mockImplementation(async () => {
      await mockPromise
      return { song: [], album: [], artist: [] }
    })

    const wrapper = mount(Search, {
      global: {
        plugins: [pinia]
      }
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('test')
    
    // 等待防抖
    await new Promise(resolve => setTimeout(resolve, 600))
    await flushPromises()

    // 此时应该显示加载中
    expect(wrapper.text()).toContain('搜索中...')
    
    // 完成搜索
    resolvePromise({ song: [], album: [], artist: [] })
    await flushPromises()
  })

  it('应该显示搜索结果', async () => {
    const mockResult = {
      song: [
        { id: '1', title: 'Test Song', album: 'Test Album', artist: 'Test Artist', duration: 180, coverArt: 'cover1' }
      ],
      album: [],
      artist: []
    }

    vi.mocked(navidrome.search3).mockResolvedValue(mockResult as any)

    const wrapper = mount(Search, {
      global: {
        plugins: [pinia]
      }
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('test')
    
    // 等待防抖
    await new Promise(resolve => setTimeout(resolve, 600))
    await flushPromises()

    expect(wrapper.text()).toContain('歌曲')
    expect(wrapper.text()).toContain('Test Song')
    expect(wrapper.text()).toContain('Test Artist')
  })

  it('应该显示无结果提示', async () => {
    vi.mocked(navidrome.search3).mockResolvedValue({ song: [], album: [], artist: [] })

    const wrapper = mount(Search, {
      global: {
        plugins: [pinia]
      }
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('xyz123notfound')
    
    // 等待防抖
    await new Promise(resolve => setTimeout(resolve, 600))
    await flushPromises()

    expect(wrapper.text()).toContain('未找到匹配的结果')
    expect(wrapper.text()).toContain('试试其他关键词吧')
  })

  it('应该清空搜索', async () => {
    const wrapper = mount(Search, {
      global: {
        plugins: [pinia]
      }
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('test')
    
    // 模拟点击清空按钮
    const clearButton = wrapper.find('button')
    if (clearButton.exists()) {
      await clearButton.trigger('click')
    }

    expect(input.element.value).toBe('')
  })

  it('应该支持回车搜索', async () => {
    const mockSearch = vi.mocked(navidrome.search3)
    mockSearch.mockResolvedValue({ song: [], album: [], artist: [] })

    const wrapper = mount(Search, {
      global: {
        plugins: [pinia]
      }
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('test')
    await input.trigger('keyup.enter')
    
    // 等待防抖
    await new Promise(resolve => setTimeout(resolve, 600))
    await flushPromises()

    expect(mockSearch).toHaveBeenCalled()
  })
})
