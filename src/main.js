import App from './App.vue'
import router from './router'
import { ViteSSG } from 'vite-ssg'

import { createPinia } from 'pinia'
import webSocketPlugin from './stores/plugins/webSocketPlugin'
import { useUserStore } from './stores/useUserStore'

import './assets/main.styl'

export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  router,
  // function to have custom setups
  async ({ app, router, isClient, initialState }) => {
    const pinia = createPinia()
    pinia.use(webSocketPlugin())

    router.push('/')
    app.use(router)
    app.use(pinia)

    if (isClient) {
      const userStore = useUserStore()
      await userStore.initializeUser()
    }
  }
)
