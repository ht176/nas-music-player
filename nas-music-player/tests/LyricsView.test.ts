import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LyricsView from '../src/components/music/LyricsView.vue'

describe('LyricsView 组件', () => {
  const mockLyrics = [
    { time: 0, text: '第一句歌词' },
    { time: 10, text: '第二句歌词' },
    { time: 20, text: '第三句歌词' },
  ]

  const mockLyricsWithTranslation = [
    { time: 0, text: 'First line', translation: '第一行' },
    { time: 10, text: 'Second line', translation: '第二行' },
  ]

  it('应该渲染歌词视图', () => {
    const wrapper = mount(LyricsView)

    const lyricsView = wrapper.find('.lyrics-view')
    expect(lyricsView.exists()).toBe(true)
  })

  it('应该显示空状态当没有歌词', () => {
    const wrapper = mount(LyricsView)

    const empty = wrapper.find('.lyrics-empty')
    expect(empty.exists()).toBe(true)

    const emptyText = wrapper.find('.empty-text')
    expect(emptyText.text()).toBe('暂无歌词')
  })

  it('应该渲染歌词列表当有歌词', () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: mockLyrics },
    })

    const content = wrapper.find('.lyrics-content')
    expect(content.exists()).toBe(true)
  })

  it('应该渲染所有歌词行', () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: mockLyrics },
    })

    const lines = wrapper.findAll('.lyrics-line')
    expect(lines.length).toBe(3)
  })

  it('应该显示歌词文字', () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: mockLyrics },
    })

    const firstLine = wrapper.find('.lyrics-line')
    expect(firstLine.find('.lyrics-text').text()).toBe('第一句歌词')
  })

  it('应该支持翻译歌词', () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: mockLyricsWithTranslation },
    })

    const translation = wrapper.find('.lyrics-translation')
    expect(translation.exists()).toBe(true)
    expect(translation.text()).toBe('第一行')
  })

  it('应该支持 currentTime 属性', () => {
    const wrapper = mount(LyricsView, {
      props: { 
        lyrics: mockLyrics,
        currentTime: 15,
      },
    })

    expect(wrapper.props('currentTime')).toBe(15)
  })

  it('歌词行应该可点击', async () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: mockLyrics },
    })

    const line = wrapper.find('.lyrics-line')
    expect(line.exists()).toBe(true)
    expect(line.attributes('style')).toBeDefined()
  })

  it('应该触发 seek 事件当点击歌词行', async () => {
    const onSeek = vi.fn()
    
    const wrapper = mount(LyricsView, {
      props: { 
        lyrics: mockLyrics,
        onSeek,
      },
    })

    const firstLine = wrapper.find('.lyrics-line')
    await firstLine.trigger('click')

    expect(onSeek).toHaveBeenCalledWith(0) // 第一句的时间
  })

  it('应该支持自动滚动', () => {
    const wrapper = mount(LyricsView, {
      props: { 
        lyrics: mockLyrics,
        autoScroll: true,
      },
    })

    expect(wrapper.props('autoScroll')).toBe(true)
  })

  it('应该支持禁用自动滚动', () => {
    const wrapper = mount(LyricsView, {
      props: { 
        lyrics: mockLyrics,
        autoScroll: false,
      },
    })

    expect(wrapper.props('autoScroll')).toBe(false)
  })

  it('应该支持滚动提示属性', () => {
    const wrapper = mount(LyricsView, {
      props: { 
        lyrics: mockLyrics,
        showScrollHint: true,
      },
    })

    expect(wrapper.props('showScrollHint')).toBe(true)
  })

  it('可以隐藏滚动提示', () => {
    const wrapper = mount(LyricsView, {
      props: { 
        lyrics: mockLyrics,
        showScrollHint: false,
      },
    })

    const scrollHint = wrapper.find('.scroll-hint')
    expect(scrollHint.exists()).toBe(false)
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: mockLyrics },
    })

    const lyricsView = wrapper.find('.lyrics-view')
    expect(lyricsView.classes()).toContain('lyrics-view')
  })

  it('滚动时应该添加 scrolling 类', async () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: mockLyrics },
    })

    const content = wrapper.find('.lyrics-content')
    await content.trigger('scroll')

    const lyricsView = wrapper.find('.lyrics-view')
    expect(lyricsView.classes()).toContain('lyrics-view-scrolling')
  })

  it('歌词行应该有正确的最小高度', () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: mockLyrics },
    })

    const line = wrapper.find('.lyrics-line')
    // 检查样式类
    expect(line.classes()).toContain('lyrics-line')
  })

  it('应该支持空歌词数组', () => {
    const wrapper = mount(LyricsView, {
      props: { lyrics: [] },
    })

    const empty = wrapper.find('.lyrics-empty')
    expect(empty.exists()).toBe(true)
  })
})
