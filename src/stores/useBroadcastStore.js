import { defineStore } from 'pinia'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

let reconnectAttempts = 0
let reconnectTime
const maxTime = 30 * 1000 // 30 seconds

export const useBroadcastStore = defineStore('broadcast', {
  actions: {

    // subscribed to by websocket

    reconnect () {
      setTimeout(() => {
        reconnectAttempts += 1
        reconnectTime = 5000 * reconnectAttempts // 5 seconds * n
      }, Math.min(reconnectTime, maxTime))
    },
    connect () {},
    joinSpaceRoom () {},
    leaveSpaceRoom () {},
    update () {},
    updateUser () {},
    updateStore () {},
    close () {}
  }
})
