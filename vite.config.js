import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

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
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,gif,woff2,ico,jpg,jpeg,webp,avif}'],
        runtimeCaching: [
          {
            // https://regexr.com/7q06m
            // matches files in a kinopio subdomain (cdn, bk, etc.)
            urlPattern: /(^https:\/\/.+\.kinopio\.club\/.+\.(jpg|jpeg|png|gif|webp|avif))/gim,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'media',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 365 * 2 // 2 years
              },
              cacheableResponse: {
                statuses: [200]
              },
              rangeRequests: true
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
