const yearTime = 60 * 60 * 24 * 365 // 365 days

export default defineNuxtConfig({
  compatibilityDate: '2025-07-09',
  srcDir: 'src',
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxtjs/sitemap', '@nuxtjs/robots', '@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    strategies: 'generateSW',
    manifest: {
      name: 'Kinopio',
      short_name: 'Kinopio',
    },
    workbox: {
      navigateFallbackDenylist: [
        // Exclude exact route only
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
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: 'Kinopio',
      meta: [
        // https://github.com/netlify/prerender
        { name: 'fragment', content: '!' },
        // mobile
        { name: 'viewport', content: 'width=device-width, initial-scale=1, minimum-scale=0.2, maximum-scale=3.0, user-scalable=yes' },
        { name: 'apple-mobile-web-app-title', content: 'Kinopio' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'msapplication-TileColor', content: '#00aba9' },
        // meta tags updated in page-meta
        // title
        { property: 'og:title', content: 'Kinopio – Thinking Canvas' },
        { property: 'og:type', content: 'website' },
        // preview image
        { property: 'og:image', content: 'https://updates.kinopio.club/og-image.png' },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        // description
        { property: 'og:description', content: 'Kinopio is a spatial note taking tool for visually collecting and connecting your thoughts, ideas, and feelings.' },
        { name: 'description', content: 'Kinopio is a spatial note taking tool for visually collecting and connecting your thoughts, ideas, and feelings.' },
        { name: 'theme-color', content: '#ffffff' },
        { property: 'og:site_name', content: 'Kinopio' },
        { name: 'twitter:site', content: '@KinopioClub' },
        { name: 'twitter:card', content: 'summary' }
      ],
      link: [
        // favicon
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#21e4e4' },
        // offline cache - specified in vite.config.js runtimeCaching
        { rel: 'dns-prefetch', href: 'https://cdn.kinopio.club' },
        { rel: 'dns-prefetch', href: 'https://bk.kinopio.club' },
        { rel: 'dns-prefetch', href: 'https://images.are.na' },
        { rel: 'dns-prefetch', href: 'https://d2w9rnfcy7mm78.cloudfront.net' },
        { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://cdn.kinopio.club' },
        { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://bk.kinopio.club' },
        { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://images.are.na' },
        { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://d2w9rnfcy7mm78.cloudfront.net' }
      ],
      script: [
        // json-ld
        { type: 'application/ld+json' },
        // polyfills
        { type: 'module', src: '/src/polyfills/path-data-polyfill.js', tagPosition: 'bodyClose' }
      ],
      noscript: [
        { children: 'I\'m sorry but Kinopio doesn\'t work properly without JavaScript enabled. Please enable it to continue.', tagPosition: 'bodyOpen' }
      ]
    }
  },
  devServer: {
    https: {
      key: './.cert/key.pem',
      cert: './.cert/cert.pem'
    },
    port: 8080,
  },
  devtools: {
    enabled: true,
  },
  postcss: {
    plugins: {
      autoprefixer: {}
    }
  },
  // Sitemap
  sitemap: {
    urls: async () => {
      const apiHost = 'https://api.kinopio.club'
      const response = await fetch(`${apiHost}/space/explore-spaces`)
      const data = await response.json()
      const paths = data.map(space => space.url)
      const routes = [
        '/about',
        '/api',
        '/blog',
        '/changelog',
        '/discord',
        '/forum',
        '/help',
        '/roadmap',
        '/survey'
      ]
      const exploreSpaces = paths.map(path => `/${path}`)
      return [...exploreSpaces, ...routes]
    }
  },
  site: {
    url: 'https://kinopio.club',
    name: 'Kinopio'
  }
})
