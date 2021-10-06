// import uniq from 'lodash-es/uniq'

import utils from '@/utils.js'

let items = []

const self = {
  namespaced: true,
  mutations: {
    add: (state, item) => {
      utils.typeCheck({ value: item, type: 'object', origin: 'history add' })
      // {action} is a websocket broadcast directive to other clients
      // for undo: maybe each broadcast has a {undoAction} attr? or maybe that's better defined here?

      // -> to use actions: because on undo you want to broadcast change too
      // but then it'll add itself back into the undo stack .. which might be what i want?

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
