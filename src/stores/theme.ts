import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ThemePreset {
  id: string
  name: string
  enName: string
  tagline: string
  description: string
  category: 'dark' | 'light'
  accentName: string
  colors: {
    bg: string
    surface: string
    accent: string
    accentSecondary: string
    border: string
    text: string
    glow: string
    particles: string[]
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'aurora',
    name: '极光深邃',
    enName: 'Aurora Obsidian',
    tagline: '深邃夜空 · 翡翠与青碧极光',
    description: '深空曜石墨底，交织青碧碧翠与微澜靛青，纯正私有云视效',
    category: 'dark',
    accentName: '极光翡翠绿',
    colors: {
      bg: '#0a0c13',
      surface: '#131622',
      accent: '#10b981',
      accentSecondary: '#06b6d4',
      border: 'rgba(255, 255, 255, 0.08)',
      text: '#f8fafc',
      glow: 'rgba(16, 185, 129, 0.38)',
      particles: [
        'rgba(16, 185, 129,',
        'rgba(6, 182, 212,',
        'rgba(52, 211, 153,',
        'rgba(99, 102, 241,',
      ],
    },
  },
  {
    id: 'cyberpunk',
    name: '赛博霓虹',
    enName: 'Cyber Sunset',
    tagline: '电音幻境 · 霓光洋红与晚霞金赤',
    description: '电光暗紫宇宙底色，交织烈艳洋红与落日微芒，沉浸动感律动',
    category: 'dark',
    accentName: '电光紫红',
    colors: {
      bg: '#0d0918',
      surface: '#19112a',
      accent: '#c084fc',
      accentSecondary: '#f43f5e',
      border: 'rgba(192, 132, 252, 0.16)',
      text: '#fdf4ff',
      glow: 'rgba(192, 132, 252, 0.42)',
      particles: [
        'rgba(192, 132, 252,',
        'rgba(244, 63, 94,',
        'rgba(232, 121, 249,',
        'rgba(251, 113, 133,',
      ],
    },
  },
  {
    id: 'vinyl',
    name: '复古黑胶',
    enName: 'Vintage Vinyl',
    tagline: '暖调原木 · 琥珀暖阳与黑胶温润',
    description: '复古唱片工坊，温润胡桃木暖黑沉淀，点缀琥珀金晖与羊皮米黄',
    category: 'dark',
    accentName: '琥珀金橙',
    colors: {
      bg: '#110e0c',
      surface: '#1e1814',
      accent: '#f59e0b',
      accentSecondary: '#ea580c',
      border: 'rgba(245, 158, 11, 0.15)',
      text: '#fef3c7',
      glow: 'rgba(245, 158, 11, 0.38)',
      particles: [
        'rgba(245, 158, 11,',
        'rgba(234, 88, 12,',
        'rgba(251, 191, 36,',
        'rgba(217, 119, 6,',
      ],
    },
  },
  {
    id: 'abyss',
    name: '深海幽蓝',
    enName: 'Abyssal Deep',
    tagline: '蔚蓝深海 · 晶莹海蓝与发光群青',
    description: '沉潜千米宁静海渊，泛着深海荧光蔚蓝与冰晶青碧的海底微光',
    category: 'dark',
    accentName: '深海荧蓝',
    colors: {
      bg: '#070d17',
      surface: '#0f1b2d',
      accent: '#38bdf8',
      accentSecondary: '#6366f1',
      border: 'rgba(56, 189, 248, 0.14)',
      text: '#f0f9ff',
      glow: 'rgba(56, 189, 248, 0.4)',
      particles: [
        'rgba(56, 189, 248,',
        'rgba(14, 165, 233,',
        'rgba(99, 102, 241,',
        'rgba(125, 211, 252,',
      ],
    },
  },
  {
    id: 'glacier',
    name: '皓月霜雪',
    enName: 'Glacier Moonlight',
    tagline: '冰川晨霜 · 纯净通透的高雅浅色',
    description: '高纬度冰川初霁，素雅石板灰底，点缀云杉湖蓝与极简线条',
    category: 'light',
    accentName: '云杉冰蓝',
    colors: {
      bg: '#f1f5f9',
      surface: '#ffffff',
      accent: '#0d9488',
      accentSecondary: '#0284c7',
      border: 'rgba(15, 23, 42, 0.08)',
      text: '#0f172a',
      glow: 'rgba(13, 148, 136, 0.25)',
      particles: [
        'rgba(13, 148, 136,',
        'rgba(2, 132, 199,',
        'rgba(148, 163, 184,',
        'rgba(20, 184, 166,',
      ],
    },
  },
]

const STORAGE_KEY = 'aura_music_theme_preset'

export const useThemeStore = defineStore('theme', () => {
  const currentThemeId = ref<string>('aurora')

  const currentTheme = computed<ThemePreset>(() => {
    return THEME_PRESETS.find((t) => t.id === currentThemeId.value) || THEME_PRESETS[0]
  })

  const isLight = computed(() => currentTheme.value.category === 'light')

  function applyThemeToDOM(themeId: string) {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-theme', themeId)
    if (isLight.value) {
      root.classList.add('theme-light')
      root.classList.remove('theme-dark')
    } else {
      root.classList.add('theme-dark')
      root.classList.remove('theme-light')
    }

    // 更新移动端与浏览器顶栏沉浸色
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', currentTheme.value.colors.bg)
    }
  }

  function setTheme(themeId: string) {
    const exists = THEME_PRESETS.some((t) => t.id === themeId)
    if (!exists) return
    currentThemeId.value = themeId
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // 容错
    }
    applyThemeToDOM(themeId)
  }

  function initTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && THEME_PRESETS.some((t) => t.id === saved)) {
        currentThemeId.value = saved
      }
    } catch {
      // 容错
    }
    applyThemeToDOM(currentThemeId.value)
  }

  return {
    currentThemeId,
    currentTheme,
    isLight,
    presets: THEME_PRESETS,
    setTheme,
    initTheme,
  }
})
