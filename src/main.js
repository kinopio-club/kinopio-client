import App from './App.vue'
import router from './router'
import { ViteSSG } from 'vite-ssg'

import { createPinia } from 'pinia'
import webSocketPlugin from './stores/plugins/webSocketPlugin'
// import { createApp, h } from 'vue'

// Create global app instance
// const app = createApp({
//   render () {
//     return h(App)
//   }
// })
// const pinia = createPinia()
// pinia.use(webSocketPlugin())

// app.use(router)
// app.use(pinia)
// app.mount('#app')
//

export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  router,
  // { routes },
  // function to have custom setups
  ({ app, router, isClient, initialState }) => {
    const pinia = createPinia()
    pinia.use(webSocketPlugin())

    router.push('/')
    app.use(router)
    app.use(pinia)

    // router.beforeEach(async (to, from) => {
    //   const userStore = useUserStore()
    //   await userStore.initializeUser()
    // })
  }
)
