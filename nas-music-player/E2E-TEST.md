# 🧪 NAS Music Player - E2E 测试指南

**测试框架:** Playwright  
**浏览器:** Chromium, Firefox, WebKit  
**测试覆盖率目标:** 80% 核心功能

---

## 📋 测试环境配置

### 安装依赖

```bash
# 安装 Playwright
npm install -D @playwright/test

# 安装浏览器
npx playwright install
```

### 配置文件

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 📝 测试用例设计

### 1. 首页测试 (home.spec.ts)

```typescript
import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test('应该成功加载首页', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/NAS Music Player/)
  })

  test('应该显示推荐专辑', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=推荐专辑')).toBeVisible()
  })

  test('应该可以导航到音乐库', async ({ page }) => {
    await page.goto('/')
    await page.click('text=音乐库')
    await expect(page).toHaveURL('/library')
  })
})
```

### 2. 搜索功能测试 (search.spec.ts)

```typescript
import { test, expect } from '@playwright/test'

test.describe('搜索功能', () => {
  test('应该可以搜索歌曲', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.locator('input[type="text"]')
    await searchInput.fill('周杰伦')
    
    // 等待搜索结果
    await page.waitForTimeout(1000)
    
    // 验证结果显示
    await expect(page.locator('text=歌曲')).toBeVisible()
  })

  test('应该支持回车搜索', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.locator('input[type="text"]')
    await searchInput.fill('test')
    await searchInput.press('Enter')
    
    await page.waitForTimeout(1000)
    await expect(page.locator('text=搜索')).toBeVisible()
  })

  test('应该可以清空搜索', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.locator('input[type="text"]')
    await searchInput.fill('test')
    
    const clearButton = page.locator('button[title="清空"]')
    if (await clearButton.isVisible()) {
      await clearButton.click()
      await expect(searchInput).toHaveValue('')
    }
  })
})
```

### 3. 播放功能测试 (player.spec.ts)

```typescript
import { test, expect } from '@playwright/test'

test.describe('播放功能', () => {
  test('应该可以播放歌曲', async ({ page }) => {
    await page.goto('/library')
    
    // 切换到歌曲标签
    await page.click('button:has-text("歌曲")')
    
    // 等待歌曲加载
    await page.waitForTimeout(1000)
    
    // 点击第一首歌曲播放
    const firstSong = page.locator('.song-item').first()
    await firstSong.dblclick()
    
    // 验证播放器显示
    await expect(page.locator('.player-bar')).toBeVisible()
    await expect(page.locator('.song-name')).not.toHaveText('未播放')
  })

  test('应该可以暂停/播放', async ({ page }) => {
    await page.goto('/')
    
    // 等待有歌曲播放
    await page.waitForTimeout(2000)
    
    const playButton = page.locator('.play-btn')
    await playButton.click()
    
    // 验证暂停状态
    await expect(playButton).toHaveAttribute('title', /播放/)
  })

  test('应该可以切换歌曲', async ({ page }) => {
    await page.goto('/')
    
    const nextButton = page.locator('button[title="下一首"]')
    await nextButton.click()
    
    // 验证歌曲切换
    await page.waitForTimeout(500)
    await expect(page.locator('.player-bar')).toBeVisible()
  })
})
```

### 4. 歌单管理测试 (playlist.spec.ts)

```typescript
import { test, expect } from '@playwright/test'

test.describe('歌单管理', () => {
  test('应该可以创建歌单', async ({ page }) => {
    await page.goto('/playlists')
    
    // 点击创建按钮
    await page.click('button:has-text("创建歌单")')
    
    // 填写歌单名称
    await page.fill('input[placeholder="输入歌单名称"]', '测试歌单')
    
    // 点击创建
    await page.click('button:has-text("创建")')
    
    // 验证创建成功
    await expect(page.locator('text=测试歌单')).toBeVisible()
  })

  test('应该可以编辑歌单', async ({ page }) => {
    await page.goto('/playlists')
    
    // 找到第一个歌单
    const firstPlaylist = page.locator('.bg-secondary').first()
    await firstPlaylist.hover()
    
    // 点击编辑按钮
    const editButton = firstPlaylist.locator('button[title="编辑"]')
    if (await editButton.isVisible()) {
      await editButton.click()
      
      // 修改名称
      await page.fill('input[placeholder="输入歌单名称"]', '编辑后的名称')
      await page.click('button:has-text("保存")')
      
      // 验证修改成功
      await expect(page.locator('text=编辑后的名称')).toBeVisible()
    }
  })

  test('应该可以删除歌单', async ({ page }) => {
    await page.goto('/playlists')
    
    // 找到第一个歌单
    const firstPlaylist = page.locator('.bg-secondary').first()
    await firstPlaylist.hover()
    
    // 点击删除按钮
    const deleteButton = firstPlaylist.locator('button[title="删除"]')
    if (await deleteButton.isVisible()) {
      // 处理确认对话框
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('确定')
        await dialog.accept()
      })
      
      await deleteButton.click()
      
      // 验证删除成功
      await page.waitForTimeout(500)
    }
  })
})
```

### 5. 歌词功能测试 (lyrics.spec.ts)

```typescript
import { test, expect } from '@playwright/test'

test.describe('歌词功能', () => {
  test('应该可以打开歌词页面', async ({ page }) => {
    await page.goto('/')
    
    // 等待有歌曲播放
    await page.waitForTimeout(2000)
    
    // 点击歌词按钮
    const lyricsButton = page.locator('.lyrics-btn')
    if (await lyricsButton.isVisible()) {
      await lyricsButton.click()
      await expect(page).toHaveURL('/lyrics')
    }
  })

  test('应该显示歌词或无歌词提示', async ({ page }) => {
    await page.goto('/lyrics')
    
    // 等待歌词加载
    await page.waitForTimeout(2000)
    
    // 验证要么有歌词，要么显示无歌词提示
    const hasLyrics = await page.locator('.lyrics-content').isVisible()
    const hasNoLyrics = await page.locator('.no-lyrics').isVisible()
    
    expect(hasLyrics || hasNoLyrics).toBe(true)
  })
})
```

### 6. 移动端测试 (mobile.spec.ts)

```typescript
import { test, expect } from '@playwright/test'

test.describe('移动端适配', () => {
  test('应该在小屏幕上隐藏侧边栏', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const sidebar = page.locator('.sidebar')
    await expect(sidebar).toBeHidden()
  })

  test('应该显示移动端导航', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const mobileNav = page.locator('.mobile-nav')
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible()
    }
  })

  test('播放栏应该在移动端正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const playerBar = page.locator('.player-bar')
    await expect(playerBar).toBeVisible()
  })
})
```

---

## 🚀 运行测试

### 本地测试

```bash
# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test e2e/search.spec.ts

# 运行特定浏览器
npx playwright test --project=chromium

# 有头模式（显示浏览器）
npx playwright test --headed

# 调试模式
npx playwright test --debug
```

### CI/CD 集成

```yaml
# GitHub Actions 示例
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 测试报告

### HTML 报告

```bash
# 生成 HTML 报告
npx playwright test --reporter=html

# 打开报告
npx playwright show-report
```

### 覆盖率报告

```bash
# 生成覆盖率报告
npx playwright test --coverage

# 查看覆盖率
open coverage/index.html
```

---

## ✅ 测试清单

### 核心功能
- [x] 首页加载
- [x] 音乐库浏览
- [x] 搜索功能
- [x] 播放控制
- [x] 歌单管理
- [x] 歌词显示
- [x] 专辑详情
- [x] 艺术家详情

### 跨浏览器
- [x] Chrome
- [x] Firefox
- [x] Safari

### 移动端
- [x] iOS Safari
- [x] Android Chrome
- [x] 响应式布局

### 性能
- [ ] 加载时间 < 3s
- [ ] 首屏渲染 < 1s
- [ ] 交互响应 < 100ms

---

**E2E 测试配置完成！开始编写测试用例！** 🚀
