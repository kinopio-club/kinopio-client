import { defineNuxtPlugin } from '#app'

import webSocketPlugin from '../stores/plugins/webSocketPlugin'

export default defineNuxtPlugin(({ $pinia }) => {
  $pinia.use(webSocketPlugin())
})
