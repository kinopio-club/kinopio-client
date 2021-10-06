// import uniq from 'lodash-es/uniq'

import utils from '@/utils.js'

let items = []

const self = {
  namespaced: true,
  mutations: {
    add: (state, item) => {
      utils.typeCheck({ value: item, type: 'object', origin: 'history add' })
      // ?TODO explicitly allow adding events addcard, removecard, etc. (eg no painting)
      items.push(item)
    },
    clear: (state) => {
      items = []
    }
  },
  actions: {
    playback: (context) => {
      console.log('▶️TEMP', items)
      // let cardIds = []
      // temp disable playback
      // items.forEach(item => {
      //   let origin = `currentSpace/${item.name}`
      //   if (item.origin) {
      //     origin = item.origin
      //   }
      //   context.dispatch(origin, item.body, { root: true })
      //   const isCard = item.name === 'updateCard'
      //   const cardExists = Boolean(document.querySelector(`article [data-card-id="${item.body.id}"]`))
      //   if (isCard && cardExists) {
      //     cardIds.push(item.body.id)
      //   }
      // })
      // cardIds = uniq(cardIds)
      // cardIds.forEach(cardId => {
      //   context.dispatch('currentConnections/updatePaths', { cardId }, { root: true })
      // })
    }
  }
}

export default self
