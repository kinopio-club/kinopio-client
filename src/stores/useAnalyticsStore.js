import { nextTick } from 'vue'
import { defineStore } from 'pinia'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useApiStore } from '@/stores/useApiStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

export const useAnalyticsStore = defineStore('analytics', {
  getters: {
    shouldSend () {
      const globalStore = useGlobalStore()
      if (consts.isDevelopment()) { return }
      // if (userStore.analyticsIsDisabled) { return }
      if (!globalStore.isOnline) { return }
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
