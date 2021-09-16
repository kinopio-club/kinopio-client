import Vue from 'vue'
import App from './App.vue'

import router from './router'
import store from './store/store'

// import devtools from '@vue/devtools'

// if (import.meta.env.NODE_ENV === 'development') {
//   devtools.connect()
// }

// import { h } from 'vue'

// const app = Vue.createApp({
//   router,
//   store,
//   render(h) {
//     return h(App)
//   }
// })

// somehow app elevated to global?
new Vue({
  router,
  store,
  render: function (h) { return h(App) }
}).$mount('#app')
