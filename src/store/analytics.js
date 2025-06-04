import utils from '@/utils.js'
import consts from '@/consts.js'
import { useUserStore } from '@/stores/useUserStore'
import { useApiStore } from '@/stores/useApiStore'

export default {
  namespaced: true,
  actions: {
    send: async (context, body) => {
      const apiStore = useApiStore()
      if (!context.getters.shouldSend) { return }
      apiStore.sendAnalyticsEvent(body)
      console.info('👻 analytics event:', body.name)
    },
    event: (context, eventName) => {
      const userStore = useUserStore()
      utils.typeCheck({ value: eventName, type: 'string' })
      const body = {
        domain: 'kinopio.club',
        name: eventName,
        url: window.location.href,
        referrer: document.referrer,
        props: {
          isSignedIn: userStore.getUserIsSignedIn
        }
      }
      context.dispatch('send', body)
    }
  },
  getters: {
    shouldSend: (state, getters, rootState) => {
      if (consts.isDevelopment()) { return }
      // if (userStore.analyticsIsDisabled) { return }
      if (!rootState.isOnline) { return }
      return true
    }
  }
}
