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
    }
  },
  actions: {
    playback: (context) => {
      let cardIds = []
      context.state.items.forEach(item => {
        context.dispatch(`currentSpace/${item.name}`, item.body, { root: true })
        const isCard = item.name === 'updateCard'
        const cardExists = Boolean(document.querySelector(`article [data-card-id="${item.body.id}"]`))
        if (isCard && cardExists) {
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
