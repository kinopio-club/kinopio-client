import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

const yearTime = 60 * 60 * 24 * 365 // 365 days

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    createVuePlugin(), // .vue support
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,gif,woff2,ico,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.kinopio\.club\/(?!.*?\.mp(3|4)\b).*$/i, // match all except mp3/mp4
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: yearTime
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/bk\.kinopio\.club\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bk-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: yearTime
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/images\.are\.na\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'are-na-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: yearTime
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/d2w9rnfcy7mm78\.cloudfront\.net\/.*/i, // are.na cdn
            handler: 'CacheFirst',
            options: {
              cacheName: 'are-na-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: yearTime
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
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
    },
    https: {
      key: fs.readFileSync('./.cert/key.pem'),
      cert: fs.readFileSync('./.cert/cert.pem')
    }
  }
})
