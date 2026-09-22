import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
import { VitePWA } from 'vite-plugin-pwa'
import Sitemap from 'vite-plugin-sitemap'
import path from 'path'
import fs from 'fs'
import { helpPages, blogPosts, helpPagesPlugin, blogPostsPlugin, blogFeedsPlugin } from './build/pages.js'

const sitemapSpaces = [
  // example spaces, also linked from llms.txt
  '/project-issue-tracker-p56fqtZUlNtFJ6td-uovI',
  '/weekly-planner-tZgYERhi-QFX2LmlVNOAb',
  '/time-tracking--ou2kHxO40-rDFZymIn1A',
  '/business-plan-286llONI_DEmGoIa1sCtj',
  '/personal-dashboard-I4x2de1LCW2P25d_21Tsy',
  '/moodboard-GgDOqKvEEzTA93EYmAZrn',
  // kinopio spaces
  '/changelog-6lsytK8ZfOtMl2oqG05Rj',
  '/-roadmap-3CBHtivu7X7nTzrcaTFQV'
]

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
    enforce: 'post',
    generateBundle (options, bundle) {
      const indexHtml = bundle['index.html']
      if (!indexHtml) { return }
      this.emitFile({
        type: 'asset',
        fileName: 'app.html',
        source: indexHtml.source
      })
      console.log('✓ Created SPA version at dist/app.html')
    }
  }
}

export default defineConfig(async ({ command, mode }) => {
  const helpRoutes = ['/help'].concat(helpPages().map(page => `/help/${page.slug}`))
  const blogRoutes = ['/blog'].concat(blogPosts().map(post => `/blog/${post.slug}`))
  // sitemap routes
  const routes = [
    '/about',
    '/api',
    '/explore'
  ].concat(helpRoutes, blogRoutes)
  const dynamicRoutes = routes.concat(sitemapSpaces)
  // dev https certs (optional, local only)
  const certKeyPath = './.cert/key.pem'
  const certPath = './.cert/cert.pem'
  let httpsConfig
  if (command === 'serve' && fs.existsSync(certKeyPath) && fs.existsSync(certPath)) {
    httpsConfig = {
      key: fs.readFileSync(certKeyPath),
      cert: fs.readFileSync(certPath)
    }
  }
  // config
  return {
    ssgOptions: {
      entry: 'src/main.js',
      includedRoutes (paths, routes) {
        return ['/', '/about', '/api', '/explore'].concat(helpRoutes, blogRoutes)
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
        include: [/\.vue$/, /\.md$/],
        // Disable SSR warnings
        ssr: false
      }),
      Markdown({
        markdownItOptions: { html: true }
      }),
      // help page metadata for Help.vue
      helpPagesPlugin(),
      // blog post metadata for Blog.vue
      blogPostsPlugin(),
      // /blog/feed.xml and /blog/feed.json
      blogFeedsPlugin(),
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
            /^\/llms\.txt$/,
            /^\/sitemap\.xml$/,
            /^\/changelog$/,
            /^\/roadmap$/,
            /^\/discord$/,
            /^\/survey$/,
            // Exclude '/route' and all subpaths (e.g. /route/post)
            /^\/help(?:\/.*)?$/,
            /^\/about(?:\/.*)?$/,
            /^\/affiliates(?:\/.*)?$/,
            /^\/api(?:\/.*)?$/,
            /^\/blog(?:\/.*)?$/,
            /^\/forum(?:\/.*)?$/,
            /^\/explore(?:\/.*)?$/
          ],
          globPatterns: ['**/*.{js,css,html,svg,png,gif,woff2,ico,jpg,jpeg,webp}'],
          // help pages and their media are online-only, keep them out of the app precache
          globIgnores: ['help.html', 'help/**', 'blog.html', 'blog/**'],
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
        generateRobotsTxt: false
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
      https: httpsConfig
    },
    build: {
      // generates and deploys .map files
      sourcemap: true,
      // skip non-important build warnings
      rollupOptions: {
        output: {
          // emit help page and blog post chunks into help/ and blog/ so the
          // service worker globIgnores above can exclude them from the app precache
          chunkFileNames (chunkInfo) {
            if (chunkInfo.facadeModuleId?.includes('/src/help/')) {
              return 'help/assets/[name]-[hash].js'
            }
            if (chunkInfo.facadeModuleId?.includes('/src/blog/')) {
              return 'blog/assets/[name]-[hash].js'
            }
            return 'assets/[name]-[hash].js'
          }
        },
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
