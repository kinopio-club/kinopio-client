import utils from '@/utils.js'
import consts from '@/consts.js'
import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()

export default {
  namespaced: true,
  actions: {
    send: async (context, body) => {
      if (!context.getters.shouldSend) { return }
      context.dispatch('api/sendAnalyticsEvent', body, { root: true })
      console.info('👻 analytics event:', body.name)
    },
    event: (context, eventName) => {
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
