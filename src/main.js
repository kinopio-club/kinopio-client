import Vue from 'vue'
import App from './App.vue'
import Meta from 'vue-meta'

import router from './router'
import store from './store/store'
Vue.use(Meta)

// import devtools from '@vue/devtools'

// if (process.env.NODE_ENV === 'development') {
//   devtools.connect()
// }

new Vue({
  router,
  store,
  render: function (h) { return h(App) }
}).$mount('#app')
