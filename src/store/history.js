import uniq from 'lodash-es/uniq'

import utils from '@/utils.js'

const self = {
  namespaced: true,
  state: {
    items: []
  },
  mutations: {
    add: (state, item) => {
      utils.typeCheck(item, 'object')
      state.items.push(item)
    },
    clear: (state) => {
      state.items = []
    },
  },
  actions: {
    playback: (context) => {
      let cardIds = []
      context.state.items.forEach(item => {
        context.dispatch(`currentSpace/${item.name}`, item.body, { root: true })
        if (item.name === 'updateCard' || item.name === 'updateCard') {
          cardIds.push(item.body.id)
        }
      })
      cardIds = uniq(cardIds)
      cardIds.forEach(cardId => {
        context.dispatch('currentSpace/updateCardConnectionPaths', { cardId }, { root: true })
      })
    }
  }
}

export default self
