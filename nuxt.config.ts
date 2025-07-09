export default defineNuxtConfig({
  compatibilityDate: '2025-07-09',
  srcDir: 'src',
  ssr: false,
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],
  devServer: {
    https: {
      key: './.cert/key.pem',
      cert: './.cert/cert.pem'
    }
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
