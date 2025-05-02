import App from './App.vue'
import router from './router'
import store from './store/store'

import { createPinia } from 'pinia'
import { createApp, h } from 'vue'

// Create global app instance
const app = createApp({
  render () {
    return h(App)
  }
})
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(store) // vuex store
app.mount('#app')
