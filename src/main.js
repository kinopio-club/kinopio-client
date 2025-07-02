import App from './App.vue'
import router from './router'

import { createPinia } from 'pinia'
import webSocketPlugin from './stores/plugins/webSocketPlugin'
import { createApp, h } from 'vue'

// Create global app instance
const app = createApp({
  render () {
    return h(App)
  }
})
const pinia = createPinia()
pinia.use(webSocketPlugin())

app.use(router)
app.use(pinia)
app.mount('#app')
