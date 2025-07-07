export default defineNuxtConfig({
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
