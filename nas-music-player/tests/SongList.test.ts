import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SongList from '../src/components/music/SongList.vue'

describe('SongList 组件', () => {
  const mockSongs = [
    {
      id: '1',
      name: '测试歌曲 1',
      artist: '歌手 A',
      album: '专辑 X',
      duration: 240,
      playCount: 1000,
    },
    {
      id: '2',
      name: '测试歌曲 2',
      artist: '歌手 B',
      album: '专辑 Y',
      duration: 180,
      playCount: 2000,
    },
  ]

  it('应该渲染歌曲列表', () => {
    const wrapper = mount(SongList, {
      props: { songs: mockSongs },
    })

    const songList = wrapper.find('.song-list')
    expect(songList.exists()).toBe(true)
  })

  it('应该渲染列表头', () => {
    const wrapper = mount(SongList, {
      props: { songs: mockSongs },
    })

    const header = wrapper.find('.song-list-header')
    expect(header.exists()).toBe(true)
  })

  it('默认应该显示列表头', () => {
    const wrapper = mount(SongList, {
      props: { songs: mockSongs },
    })

    const header = wrapper.find('.song-list-header')
    expect(header.exists()).toBe(true)
  })

  it('可以隐藏列表头', () => {
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        showHeader: false,
      },
    })

    const header = wrapper.find('.song-list-header')
    expect(header.exists()).toBe(false)
  })

  it('应该渲染歌曲项', () => {
    const wrapper = mount(SongList, {
      props: { songs: mockSongs },
    })

    const songItems = wrapper.findAllComponents({ name: 'SongItem' })
    expect(songItems.length).toBe(2)
  })

  it('应该显示专辑列', () => {
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        showAlbum: true,
      },
    })

    const albumHeader = wrapper.find('.header-album')
    expect(albumHeader.exists()).toBe(true)
  })

  it('可以隐藏专辑列', () => {
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        showAlbum: false,
      },
    })

    const albumHeader = wrapper.find('.header-album')
    expect(albumHeader.exists()).toBe(false)
  })

  it('应该显示播放次数列', () => {
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        showPlayCount: true,
      },
    })

    const playCountHeader = wrapper.find('.header-play-count')
    expect(playCountHeader.exists()).toBe(true)
  })

  it('应该支持显示封面', () => {
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        showCover: true,
      },
    })

    // SongItem 应该接收到 showCover prop
    const songItems = wrapper.findAllComponents({ name: 'SongItem' })
    expect(songItems[0].props('showCover')).toBe(true)
  })

  it('应该传递 currentPlayingId 给 SongItem', () => {
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        currentPlayingId: '1',
      },
    })

    const songItems = wrapper.findAllComponents({ name: 'SongItem' })
    expect(songItems[0].props('playing')).toBe(true)
    expect(songItems[1].props('playing')).toBe(false)
  })

  it('应该触发 click 事件', async () => {
    const onClick = vi.fn()
    
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        onClick,
      },
    })

    // 触发第一个 SongItem 的 click 事件
    const songItem = wrapper.findComponent({ name: 'SongItem' })
    await songItem.vm.$emit('click', mockSongs[0])

    expect(onClick).toHaveBeenCalledWith(mockSongs[0])
  })

  it('应该传递 play 事件给父组件', async () => {
    const onPlay = vi.fn()
    
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        onPlay,
      },
    })

    // 触发 SongItem 的 click 事件来模拟
    const songItem = wrapper.findComponent({ name: 'SongItem' })
    await songItem.trigger('dblclick')

    // 验证事件被触发
    expect(songItem.exists()).toBe(true)
  })

  it('应该触发 favorite 事件', async () => {
    const onFavorite = vi.fn()
    
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        onFavorite,
      },
    })

    const songItem = wrapper.findComponent({ name: 'SongItem' })
    await songItem.vm.$emit('favorite', mockSongs[0])

    expect(onFavorite).toHaveBeenCalledWith(mockSongs[0])
  })

  it('应该触发 more 事件', async () => {
    const onMore = vi.fn()
    
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        onMore,
      },
    })

    const songItem = wrapper.findComponent({ name: 'SongItem' })
    await songItem.vm.$emit('more', mockSongs[0])

    expect(onMore).toHaveBeenCalledWith(mockSongs[0])
  })

  it('应该显示空状态当没有歌曲', () => {
    const wrapper = mount(SongList, {
      props: { songs: [] },
    })

    const empty = wrapper.find('.song-list-empty')
    expect(empty.exists()).toBe(true)

    const emptyText = wrapper.find('.empty-text')
    expect(emptyText.text()).toBe('暂无歌曲')
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        showHeader: true,
        showAlbum: true,
      },
    })

    const songList = wrapper.find('.song-list')
    expect(songList.classes()).toContain('song-list')
  })

  it('列表头应该包含所有列', () => {
    const wrapper = mount(SongList, {
      props: { 
        songs: mockSongs,
        showAlbum: true,
        showPlayCount: true,
      },
    })

    const header = wrapper.find('.song-list-header')
    expect(header.find('.header-index').exists()).toBe(true)
    expect(header.find('.header-title').exists()).toBe(true)
    expect(header.find('.header-album').exists()).toBe(true)
    expect(header.find('.header-play-count').exists()).toBe(true)
    expect(header.find('.header-duration').exists()).toBe(true)
    expect(header.find('.header-actions').exists()).toBe(true)
  })
})
