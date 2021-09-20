import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      vue: '@vue/compat',
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [createVuePlugin()],
  server: {
    port: 8080
  }
})
