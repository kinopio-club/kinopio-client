import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'unplugin-vue-markdown/vite'
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

// Help pages, prerendered from src/help/*.md
// Frontmatter (title, description, category) is parsed here at build time and
// served to Help.vue as the 'virtual:help-pages' module, so post metadata can be
// listed without statically importing the md files (which would merge their
// lazy-loaded chunks into the Help chunk)

const helpDir = './src/help'
const parseFrontmatter = (markdown) => {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/)
  if (!match) { return {} }
  const data = {}
  match[1].split('\n').forEach(line => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) { return }
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    data[key] = value
  })
  return data
}
const helpPages = () => {
  return fs.readdirSync(helpDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .map(file => {
      const markdown = fs.readFileSync(path.join(helpDir, file), 'utf8')
      const slug = file.replace('.md', '')
      return { slug, ...parseFrontmatter(markdown) }
    })
}
const helpPagesPlugin = () => {
  const virtualId = 'virtual:help-pages'
  const resolvedVirtualId = '\0' + virtualId
  return {
    name: 'help-pages',
    resolveId (id) {
      if (id === virtualId) { return resolvedVirtualId }
    },
    load (id) {
      if (id !== resolvedVirtualId) { return }
      return `export default ${JSON.stringify(helpPages())}`
    },
    // reload when frontmatter changes during dev
    handleHotUpdate ({ file, server }) {
      if (!file.includes('/src/help/')) { return }
      const module = server.moduleGraph.getModuleById(resolvedVirtualId)
      if (module) { server.moduleGraph.invalidateModule(module) }
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
  // sitemap routes
  const routes = [
    '/about',
    '/api',
    '/blog',
    '/changelog',
    '/discord',
    '/forum',
    '/roadmap'
  ].concat(helpRoutes)
  // TODO
  // pascal sitemap rec: get all public spaces with content, mark each as user generated
  // update once a day (maybe not at the build stage, but in netlify functions)
  const exploreSpaceRoutes = await exploreSpaces() || []
  const dynamicRoutes = routes.concat(exploreSpaceRoutes)
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
        return ['/', '/about', '/api'].concat(helpRoutes)
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
      https: httpsConfig
    },
    build: {
      // generates and deploys .map files
      sourcemap: true,
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
