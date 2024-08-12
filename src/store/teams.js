import utils from '@/utils.js'

export default {
  namespaced: true,
  state: {},
  mutations: {
    // update: (state, value) => {
    //   state.color = value
    //   cache.updateUser('color', value)
    // Object.keys(state).forEach(key => {
    //   state[key] = newUser[key] || initialState[key]
    // })
    // },
  },
  actions: {
    // isSystem: (context, value) => {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   context.dispatch('currentUser/update', { themeIsSystem: value }, { root: true })
    //   context.commit('triggerUpdateTheme', null, { root: true })
    // },
  },
  getters: {
    // isThemeDark: (state, getters, rootState) => {
    //   const systemTheme = getters.themeFromSystem
    //   const userTheme = rootState.currentUser.theme
    //   if (systemTheme) {
    //     return systemTheme === 'dark'
    //   } else {
    //     return userTheme === 'dark'
    //   }
    // },
  }
}
