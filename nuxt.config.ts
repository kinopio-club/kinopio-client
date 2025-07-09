export default defineNuxtConfig({
  compatibilityDate: '2025-07-09',
  srcDir: 'src',
  ssr: false,
  modules: [
    '@pinia/nuxt',
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
})
