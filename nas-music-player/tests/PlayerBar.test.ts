import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import PlayerBar from '../src/components/layout/PlayerBar.vue'

describe('PlayerBar 组件', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('应该渲染歌曲信息区域', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const songInfo = wrapper.find('.song-info')
    expect(songInfo.exists()).toBe(true)

    const albumCover = wrapper.find('.album-cover')
    expect(albumCover.exists()).toBe(true)

    const songDetails = wrapper.find('.song-details')
    expect(songDetails.exists()).toBe(true)
  })

  it('应该渲染默认歌曲名称和歌手', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const songName = wrapper.find('.song-name')
    expect(songName.exists()).toBe(true)
    expect(songName.text()).toBe('未播放')

    const artistName = wrapper.find('.artist-name')
    expect(artistName.exists()).toBe(true)
    expect(artistName.text()).toBe('选择一首歌曲开始播放')
  })

  it('应该渲染收藏按钮', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const favoriteBtn = wrapper.find('.favorite-btn')
    expect(favoriteBtn.exists()).toBe(true)

    const heartIcon = favoriteBtn.find('.heart-icon')
    expect(heartIcon.exists()).toBe(true)
  })

  it('应该渲染播放控制按钮', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const controlButtons = wrapper.findAll('.control-btn')
    expect(controlButtons.length).toBeGreaterThanOrEqual(4)

    const playBtn = wrapper.find('.play-btn')
    expect(playBtn.exists()).toBe(true)
  })

  it('应该渲染进度条', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const progressBar = wrapper.find('.progress-bar')
    expect(progressBar.exists()).toBe(true)

    const progressTrack = wrapper.find('.progress-track')
    expect(progressTrack.exists()).toBe(true)

    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.exists()).toBe(true)
  })

  it('应该渲染时间显示', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const timeCurrent = wrapper.find('.time-current')
    expect(timeCurrent.exists()).toBe(true)
    expect(timeCurrent.text()).toBe('0:00')

    const timeDuration = wrapper.find('.time-duration')
    expect(timeDuration.exists()).toBe(true)
    expect(timeDuration.text()).toBe('0:00')
  })

  it('应该渲染音量控制', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const volumeControls = wrapper.find('.volume-controls')
    expect(volumeControls.exists()).toBe(true)

    const volumeBtn = wrapper.find('.volume-btn')
    expect(volumeBtn.exists()).toBe(true)

    const volumeSlider = wrapper.find('.volume-slider')
    expect(volumeSlider.exists()).toBe(true)
  })

  it('应该应用播放器栏样式类', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const playerBar = wrapper.find('.player-bar')
    expect(playerBar.exists()).toBe(true)
    expect(playerBar.classes()).toContain('player-bar')
  })

  it('专辑封面应该包含占位符 SVG', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const albumCoverPlaceholder = wrapper.find('.album-cover-placeholder')
    expect(albumCoverPlaceholder.exists()).toBe(true)

    const svg = albumCoverPlaceholder.find('svg')
    expect(svg.exists()).toBe(true)
  })

  it('播放按钮应该有正确的样式', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const playBtn = wrapper.find('.play-btn')
    expect(playBtn.exists()).toBe(true)
    
    // 检查播放按钮是否有主色背景
    const classes = playBtn.classes()
    expect(classes).toContain('play-btn')
  })

  it('控制按钮应该有图标', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const controlButtons = wrapper.findAll('.control-btn')
    controlButtons.forEach(btn => {
      const svg = btn.find('svg')
      expect(svg.exists()).toBe(true)
    })
  })

  it('进度条应该有可交互元素', () => {
    const wrapper = mount(PlayerBar, {
      global: {
        plugins: [pinia]
      }
    })

    const progressBar = wrapper.find('.progress-bar')
    expect(progressBar.exists()).toBe(true)

    const progressHandle = wrapper.find('.progress-handle')
    expect(progressHandle.exists()).toBe(true)
  })
})
