import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [createVuePlugin()], // .vue support
  server: {
    port: 8080,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  }
})
