import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-vue-next')) {
              return 'icons'
            }
            if (id.includes('gsap') || id.includes('canvas-confetti')) {
              return 'anim-vendor'
            }
            if (id.includes('@tauri-apps')) {
              return 'tauri-vendor'
            }
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vue-core'
            }
          }
        },
      },
    },
  },
})
