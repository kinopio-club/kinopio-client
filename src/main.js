import App from './App.vue'
import router from './router'
import { ViteSSG } from 'vite-ssg'

import { createPinia } from 'pinia'
import { useUserStore } from './stores/useUserStore'

import './assets/main.styl'

export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  router,
  // function to have custom setups
  ({ app, router, isClient, initialState }) => {
    const pinia = createPinia()

    router.push('/')
    app.use(router)
    app.use(pinia)

    if (isClient) {
      router.beforeEach(async (to, from) => {
        const userStore = useUserStore()
        await userStore.initializeUser()
      })
    }
  }
)
