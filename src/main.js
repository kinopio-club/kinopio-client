import { createApp, h } from 'vue'
import App from './App.vue'

import router from './router'
import store from './store/store'

// Create global app instance
const app = createApp({
  router,
  render () {
    return h(App)
  }
})

app.use(store)
app.mount('#app')
