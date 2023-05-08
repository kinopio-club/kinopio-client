import { defineConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

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
    },
    https: {
      key: fs.readFileSync('./.cert/key.pem'),
      cert: fs.readFileSync('./.cert/cert.pem')
    }
  }
})
