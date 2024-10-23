import utils from '@/utils.js'
import consts from '@/consts.js'

// TODO add attr user.analyticsIsDisabled
// TODO add settings -> analytics -> dialog contains description and toggle btn

// TODO udpate help/privacy docs w debugging info
// TODO update help api docs w user.analyticsIsDisabled bool

export default {
  namespaced: true,
  actions: {
    send: (context, event) => {
      if (!context.getters.shouldSend) { return }

      try {
        // https://plausible.io/docs/events-api
        const apiUrl = 'https://plausible.io/api/event'
        // POST
      } catch (error) {
        console.error('🚒 analytics send', error)
      }
    },
    pageview: (context) => {
      console.log('👻 pageview')
    },
    event: (context, eventName) => {
      utils.typeCheck({ value: eventName, type: 'string' })
      console.log('👻', eventName)
    }
  },
  getters: {
    shouldSend: (state, getters, rootState) => {
      if (consts.isDevelopment()) { return }
      if (rootState.currentUser.analyticsIsDisabled) { return }
      if (!rootState.isOnline) { return }
      return true
    }
  }
}
