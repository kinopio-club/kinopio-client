import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import sitemap from 'vite-plugin-sitemap'
import path from 'path'
import fs from 'fs'

const yearTime = 60 * 60 * 24 * 365 // 365 days

export default defineConfig(async ({ command, mode }) => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    plugins: [
      // .vue support
      createVuePlugin(),
      // offline support
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
      }),
      // sitemap
      sitemap({
        hostname: 'https://kinopio.club',
        routes: async () => {
          const lastmod = new Date().toISOString()
          const urls = [
            { url: '/', lastmod },
            { url: 'https://help.kinopio.club', lastmod },
            { url: 'https://blog.kinopio.club', lastmod },
            { url: 'https://kinopio.club/kinopio-roadmap-6TRE21gchHI7alHLuwzd5', lastmod },
            { url: 'https://kinopio.club/-kinopio-what-s-new-6lsytK8ZfOtMl2oqG05Rj', lastmod },
            { url: 'https://club.kinopio.club', lastmod }
          ]
          console.log('🌺 Sitemap URLs:', urls)
          return urls
        },
        outDir: 'dist',
        filename: 'sitemap.xml'
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
  }
})
