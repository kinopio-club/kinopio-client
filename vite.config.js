import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import Sitemap from 'vite-plugin-sitemap'
import path from 'path'
import fs from 'fs'

const isDevelopment = process.env.NODE_ENV === 'development'
const exploreSpaces = async () => {
  try {
    if (isDevelopment) { return }
    const apiHost = 'https://api.kinopio.club'
    const response = await fetch(`${apiHost}/space/explore-spaces`)
    const data = await response.json()
    if (!data) { return }
    const paths = data.map(space => space.url)
    return paths.map(path => `/${path}`)
  } catch (error) {
    console.error('🚒 exploreSpaceUrls', error)
  }
}

const createCache = (name, pattern) => {
  const yearTime = 60 * 60 * 24 * 365 // 365 days
  return {
    urlPattern: pattern,
    handler: 'CacheFirst',
    options: {
      cacheName: name,
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: yearTime
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  }
}

// Custom plugin to create SPA version of app.html
const createSPAPlugin = () => {
  return {
    name: 'create-spa-app',
    apply: 'build',
    closeBundle () {
      const indexPath = path.resolve(__dirname, 'dist/index.html')
      const appPath = path.resolve(__dirname, 'dist/app.html')
      fs.copyFileSync(indexPath, appPath)
      console.log('✓ Created SPA version at dist/app.html')
    }
  }
}

export default defineConfig(async ({ command, mode }) => {
  // sitemap routes
  const routes = [
    '/about',
    '/api',
    '/blog',
    '/changelog',
    '/discord',
    '/forum',
    '/help',
    '/roadmap'
  ]
  // TODO
  // pascal sitemap rec: get all public spaces with content, mark each as user generated
  // update once a day (maybe not at the build stage, but in netlify functions)
  const exploreSpaceRoutes = await exploreSpaces() || []
  const dynamicRoutes = routes.concat(exploreSpaceRoutes)
  // config
  return {
    ssgOptions: {
      entry: 'src/main.js',
      includedRoutes (paths, routes) {
        return ['/', '/about']
      }
    },
    test: {
      environment: 'jsdom'
    },
    optimizeDeps: {
      include: ['pinia']
    },
    ssr: {
      noExternal: ['macrolight']
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    plugins: [
      // .vue support
      vue({
        // Disable SSR warnings
        ssr: false
      }),
      // Create SPA version of app.html
      createSPAPlugin(),
      // offline support
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        manifest: {
          start_url: '/app'
        },
        workbox: {
          navigateFallback: '/app.html',
          navigateFallbackDenylist: [
            // Exclude exact route only
            /^\/security\.txt$/,
            /^\/robots\.txt$/,
            /^\/sitemap\.xml$/,
            /^\/changelog$/,
            /^\/roadmap$/,
            /^\/discord$/,
            /^\/survey$/,
            // Exclude '/route' and all subpaths (e.g. /route/post)
            /^\/help(?:\/.*)?$/,
            /^\/about(?:\/.*)?$/,
            /^\/api(?:\/.*)?$/,
            /^\/blog(?:\/.*)?$/,
            /^\/forum(?:\/.*)?$/,
            /^\/blog(?:\/.*)?$/
          ],
          globPatterns: ['**/*.{js,css,html,svg,png,gif,woff2,ico,jpg,jpeg,webp}'],
          runtimeCaching: [
            createCache('cdn-cache', /^https:\/\/cdn\.kinopio\.club\/(?!.*?\.mp(3|4)\b).*$/i), // match all except mp3/mp4
            createCache('img-cache', /^https:\/\/img\.kinopio\.club\/.*/i),
            createCache('bk-cache', /^https:\/\/bk\.kinopio\.club\/.*/i),
            createCache('files-cache', /^https:\/\/files\.kinopio\.club\/.*/i),
            createCache('are-na-cache', /^https:\/\/images\.are\.na\/.*/i),
            createCache('are-na-cache', /^https:\/\/d2w9rnfcy7mm78\.cloudfront\.net\/.*/i) // are.na cdn
          ]
        }
      }),
      // sitemap
      Sitemap({
        hostname: 'https://kinopio.club',
        dynamicRoutes,
        readable: true,
        externalSitemaps: ['https://kinopio.club/help/sitemap.xml', 'https://kinopio.club/blog/sitemap.xml']
      })
    ],
    preview: {
      host: '0.0.0.0' // accept connections from https://kinopio.local
    },
    server: {
      port: 8080,
      host: '0.0.0.0',
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..']
      },
      https: {
        key: fs.readFileSync('./.cert/key.pem'),
        cert: fs.readFileSync('./.cert/cert.pem')
      }
    },
    build: {
      // skip non-important build warnings
      rollupOptions: {
        onwarn (warning, warn) {
          if (
            warning.message.includes('onUnmounted') ||
            warning.message.includes('/*#__PURE__*/')
          ) {
            return
          }
          warn(warning)
        }
      }
    }

  }
})
