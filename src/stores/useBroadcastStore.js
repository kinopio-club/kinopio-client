import { defineStore } from 'pinia'

import { useGlobalStore } from '@/stores/useGlobalStore'

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
    connect () {
      // console.info('🌻 broadcast connect')
    },
    joinSpaceRoom () {
      // console.info('🌻 broadcast joinSpaceRoom')
    },
    leaveSpaceRoom () {},
    update () {},
    updateUser () {},
    updateStore () {},
    close () {}
  }
})
