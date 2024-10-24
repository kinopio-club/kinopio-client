import utils from '@/utils.js'
import consts from '@/consts.js'

export default {
  namespaced: true,
  actions: {
    send: async (context, body) => {
      if (!context.getters.shouldSend) { return }
      context.dispatch('api/sendAnalyticsEvent', body, { root: true })
      console.log('👻 analytics event:', body.event.name)
    },
    event: (context, eventName) => {
      utils.typeCheck({ value: eventName, type: 'string' })
      const body = {
        event: {
          domain: 'kinopio.club',
          name: eventName,
          url: window.location.href,
          referrer: document.referrer,
          props: {
            isSignedIn: context.rootGetters['currentUser/isSignedIn']
          }
        },
        userAgent: navigator.userAgent
      }
      context.dispatch('send', body)
    }
  },
  getters: {
    shouldSend: (state, getters, rootState) => {
      if (consts.isDevelopment()) { return }
      // if (rootState.currentUser.analyticsIsDisabled) { return }
      if (!rootState.isOnline) { return }
      return true
    }
  }
}
