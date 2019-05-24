import Vue from 'vue'
import Router from 'vue-router'
import Space from './views/Space.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'space',
      component: Space
    },
    {
      path: '/teaser',
      name: 'teaser',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "newsletter" */ './views/Teaser.vue')
    }
  ]
})
