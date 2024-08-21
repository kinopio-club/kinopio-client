import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Sitemap from 'vite-plugin-sitemap'
import path from 'path'
import fs from 'fs'

const yearTime = 60 * 60 * 24 * 365 // 365 days

const isDevelopment = process.env.NODE_ENV === 'development'
const exploreSpaces = async () => {
  try {
    if (isDevelopment) { return }
    const apiHost = 'https://api.kinopio.club'
    const response = await fetch(`${apiHost}/space/explore-spaces`)
    const data = await response.json()
    let paths = data.map(space => space.url)
    return paths.map(path => `/${path}`)
  } catch (error) {
    console.error('🚒 exploreSpaceUrls', error)
  }
}

export default defineConfig(async ({ command, mode }) => {
  const routes = [
    '/kinopio-roadmap-6TRE21gchHI7alHLuwzd5',
    '/-kinopio-what-s-new-6lsytK8ZfOtMl2oqG05Rj'
  ]
  const exploreSpaceRoutes = await exploreSpaces() || []
  const dynamicRoutes = routes.concat(exploreSpaceRoutes)
  console.log('🌺', routes)

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
      Sitemap({
        hostname: 'http://kinopio.club',
        dynamicRoutes,
        readable: true,
        generateRobotsTxt: false
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
