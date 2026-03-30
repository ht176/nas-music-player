import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SongItem from '../src/components/music/SongItem.vue'

describe('SongItem 组件', () => {
  const mockSong = {
    id: '1',
    name: '测试歌曲',
    artist: '测试歌手',
    album: '测试专辑',
    duration: 240,
    playCount: 1000,
    isFavorite: false,
  }

  it('应该渲染歌曲项', () => {
    const wrapper = mount(SongItem, {
      props: { song: mockSong },
    })

    const songItem = wrapper.find('.song-item')
    expect(songItem.exists()).toBe(true)

    const songName = wrapper.find('.song-name')
    expect(songName.exists()).toBe(true)
    expect(songName.text()).toBe('测试歌曲')
  })

  it('应该渲染歌曲名称', () => {
    const wrapper = mount(SongItem, {
      props: { song: mockSong },
    })

    const songName = wrapper.find('.song-name')
    expect(songName.text()).toBe('测试歌曲')
  })

  it('应该渲染歌手和专辑', () => {
    const wrapper = mount(SongItem, {
      props: { song: mockSong },
    })

    const songArtist = wrapper.find('.song-artist')
    expect(songArtist.text()).toContain('测试歌手')
    expect(songArtist.text()).toContain('测试专辑')
  })

  it('应该渲染序号', () => {
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        index: 5,
      },
    })

    const indexNumber = wrapper.find('.index-number')
    expect(indexNumber.exists()).toBe(true)
    expect(indexNumber.text()).toBe('5')
  })

  it('应该使用默认序号 1', () => {
    const wrapper = mount(SongItem, {
      props: { song: mockSong },
    })

    const indexNumber = wrapper.find('.index-number')
    expect(indexNumber.text()).toBe('1')
  })

  it('应该渲染播放图标当正在播放', () => {
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        playing: true,
      },
    })

    const songItem = wrapper.find('.song-item')
    expect(songItem.classes()).toContain('song-item-playing')

    const playingIcon = wrapper.find('.playing-icon')
    expect(playingIcon.exists()).toBe(true)
  })

  it('应该渲染时长', () => {
    const wrapper = mount(SongItem, {
      props: { song: mockSong },
    })

    const duration = wrapper.find('.song-duration')
    expect(duration.exists()).toBe(true)
    expect(duration.text()).toBe('4:00')
  })

  it('应该格式化时长', () => {
    const testCases = [
      { duration: 60, expected: '1:00' },
      { duration: 120, expected: '2:00' },
      { duration: 185, expected: '3:05' },
      { duration: 3665, expected: '61:05' },
    ]

    testCases.forEach(({ duration, expected }) => {
      const wrapper = mount(SongItem, {
        props: { song: { ...mockSong, duration } },
      })

      const durationEl = wrapper.find('.song-duration')
      expect(durationEl.text()).toBe(expected)
    })
  })

  it('应该渲染收藏按钮', () => {
    const wrapper = mount(SongItem, {
      props: { song: mockSong },
    })

    const favoriteBtn = wrapper.find('.favorite-btn')
    expect(favoriteBtn.exists()).toBe(true)
  })

  it('应该渲染更多按钮', () => {
    const wrapper = mount(SongItem, {
      props: { song: mockSong },
    })

    const moreBtn = wrapper.find('.more-btn')
    expect(moreBtn.exists()).toBe(true)
  })

  it('应该支持显示专辑封面', () => {
    const songWithCover = {
      ...mockSong,
      cover: 'https://example.com/cover.jpg',
    }

    const wrapper = mount(SongItem, {
      props: { 
        song: songWithCover,
        showCover: true,
      },
    })

    const cover = wrapper.find('.song-cover')
    expect(cover.exists()).toBe(true)

    const coverImage = wrapper.find('.cover-image')
    expect(coverImage.exists()).toBe(true)
    expect(coverImage.attributes('src')).toBe('https://example.com/cover.jpg')
  })

  it('默认不应该显示专辑封面', () => {
    const songWithCover = {
      ...mockSong,
      cover: 'https://example.com/cover.jpg',
    }

    const wrapper = mount(SongItem, {
      props: { song: songWithCover },
    })

    const cover = wrapper.find('.song-cover')
    expect(cover.exists()).toBe(false)
  })

  it('应该支持显示播放次数', () => {
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        showPlayCount: true,
      },
    })

    const playCount = wrapper.find('.song-play-count')
    expect(playCount.exists()).toBe(true)
    expect(playCount.text()).toBe('1.0K')
  })

  it('应该格式化播放次数', () => {
    const testCases = [
      { count: 500, expected: '500' },
      { count: 1500, expected: '1.5K' },
      { count: 1500000, expected: '1.5M' },
    ]

    testCases.forEach(({ count, expected }) => {
      const wrapper = mount(SongItem, {
        props: { 
          song: { ...mockSong, playCount: count },
          showPlayCount: true,
        },
      })

      const playCount = wrapper.find('.song-play-count')
      expect(playCount.text()).toBe(expected)
    })
  })

  it('应该支持悬停效果', () => {
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        hoverable: true,
      },
    })

    const songItem = wrapper.find('.song-item')
    expect(songItem.classes()).toContain('song-item-hover')
  })

  it('点击应该触发 click 事件', async () => {
    const onClick = vi.fn()
    
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        onClick,
      },
    })

    await wrapper.find('.song-item').trigger('click')

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledWith(mockSong)
  })

  it('双击应该触发 play 事件', async () => {
    const onPlay = vi.fn()
    
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        onPlay,
      },
    })

    await wrapper.find('.song-item').trigger('dblclick')

    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onPlay).toHaveBeenCalledWith(mockSong)
  })

  it('点击收藏按钮应该触发 favorite 事件', async () => {
    const onFavorite = vi.fn()
    
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        onFavorite,
      },
    })

    await wrapper.find('.favorite-btn').trigger('click')

    expect(onFavorite).toHaveBeenCalledTimes(1)
    expect(onFavorite).toHaveBeenCalledWith(mockSong)
  })

  it('点击更多按钮应该触发 more 事件', async () => {
    const onMore = vi.fn()
    
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        onMore,
      },
    })

    await wrapper.find('.more-btn').trigger('click')

    expect(onMore).toHaveBeenCalledTimes(1)
    expect(onMore).toHaveBeenCalledWith(mockSong)
  })

  it('应该支持收藏状态', () => {
    const favoritedSong = {
      ...mockSong,
      isFavorite: true,
    }

    const wrapper = mount(SongItem, {
      props: { song: favoritedSong },
    })

    const favoriteBtn = wrapper.find('.favorite-btn')
    expect(favoriteBtn.classes()).toContain('is-favorite')
  })

  it('应该应用正确的样式类', () => {
    const wrapper = mount(SongItem, {
      props: { 
        song: mockSong,
        playing: true,
        showCover: true,
      },
    })

    const songItem = wrapper.find('.song-item')
    expect(songItem.classes()).toContain('song-item')
    expect(songItem.classes()).toContain('song-item-playing')
  })
})
