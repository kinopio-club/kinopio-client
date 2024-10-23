import utils from '@/utils.js'

// only run in prod
// only run if !user.analyticsDisabled (add attr)

// const plausibleApiUrl = https://plausible.io/api/event

// https://plausible.io/docs/events-api

export default {
  namespaced: true
  // actions: {
  // pageView: (context) =>
  //   isSystem: (context, value) => {
  //     utils.typeCheck({ value, type: 'boolean' })
  //     context.dispatch('currentUser/update', { themeIsSystem: value }, { root: true })
  //     context.commit('triggerUpdateTheme', null, { root: true })
  //   },
  // },
}
