import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    createVuePlugin(), // .vue support
    VitePWA({
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kinopio',
        icons: [
          {
            src: 'android-chrome-192x192',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 8080,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  }
})
