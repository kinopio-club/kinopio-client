import Vue from 'vue'
import App from './App.vue'

import router from './router'
import store from './store/store'

// import devtools from '@vue/devtools'

// if (process.env.NODE_ENV === 'development') {
//   devtools.connect()
// }

// import { h } from 'vue'
// render() {
//     return h(App)
//   }

// const app = Vue.createApp({...})
// somehow app elevated to global?
new Vue({
  router,
  store,
  render: function (h) { return h(App) }
}).$mount('#app')
