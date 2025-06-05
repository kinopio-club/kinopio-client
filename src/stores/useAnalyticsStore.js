import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useApiStore } from '@/stores/useApiStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

import store from '@/store/store.js' // TEMP Import Vuex store

export const useAnalyticsStore = defineStore('analytics', {
  getters: {
    shouldSend () {
      if (consts.isDevelopment()) { return }
      // if (userStore.analyticsIsDisabled) { return }
      if (!store.state.isOnline) { return }
      return true
    }
  },

  actions: {
    async send (body) {
      const apiStore = useApiStore()
      if (!this.shouldSend) { return }
      apiStore.sendAnalyticsEvent(body)
      console.info('👻 analytics event:', body.name)
    },
    event (eventName) {
      const userStore = useUserStore()
      const body = {
        domain: 'kinopio.club',
        name: eventName,
        url: window.location.href,
        referrer: document.referrer,
        props: {
          isSignedIn: userStore.getUserIsSignedIn
        }
      }
      this.send(body)
    }

  }
})
