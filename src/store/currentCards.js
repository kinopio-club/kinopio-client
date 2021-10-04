// import utils from '@/utils.js'
import cache from '@/cache.js'

// import debounce from 'lodash-es/debounce'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

export default {
  namespaced: true,
  state: {
    ids: [],
    cards: {}
  },
  mutations: {
    clear: (state) => {
      state.ids = []
      state.cards = {}
    },
    update: (state, card) => {
      const keys = Object.keys(card)
      keys.forEach(key => {
        state.cards[card.id] = card[key]
      })
      // debounce ls?
    },
    restore: (state, cards) => {
      let cardIds = []
      cards.forEach(card => {
        cardIds.push(card.id)
        state.cards[card.id] = card
      })
      state.ids = state.ids.concat(cardIds)
      // console.log('🍅',state.cards, state.ids)

      // [{id, name, blah}]

      // [id,id2,id3]
      // {

      // id: {
      //   name, blah
      // },
      // id: {
      //   name, blah
      // },

      // }
    },
    move: (state, { cards, delta, spaceId }) => {
      // cards = utils.clone(cards)
      cards.forEach(card => {
        state.cards[card.id].x = card.x + delta.x
        state.cards[card.id].y = card.y + delta.y
        // state.cards[id] = card
        // const index = state.cards.findIndex(stateCard => stateCard.id === card.id)
        // state.cards[index] = card
      })
      // const spaceId =
      cache.updateSpaceCardsDebounced(state.cards, spaceId)
    }

    // add: (state, item) => {
    //   utils.typeCheck({ value: item, type: 'object', origin: 'history add' })
    //   items.push(item)
    // },
  },
  actions: {
    drag: (context, { endCursor, prevCursor, delta }) => {
      const spaceId = context.rootState.currentSpace.id
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const zoom = context.rootGetters.spaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      endCursor = {
        x: endCursor.x * zoom,
        y: endCursor.y * zoom
      }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      let cardIds
      // let connections = []
      if (multipleCardsSelectedIds.length) {
        cardIds = multipleCardsSelectedIds
      } else {
        cardIds = [currentDraggingCardId]
      }
      console.log('🔵', cardIds)

      let cards = cardIds.map(id => context.getters.byId(id))

      // prevent cards bunching up at 0
      cards.forEach(card => {
        if (card.x === 0) { delta.x = Math.max(0, delta.x) }
        if (card.y === 0) { delta.y = Math.max(0, delta.y) }
        // connections = connections.concat(context.getters.cardConnections(card.id))
        // context.commit('updateCardInCardMap', card, { root: true })
      })
      // connections = uniqBy(connections, 'id')
      context.commit('move', { cards, delta, spaceId })
      context.commit('cardsWereDragged', true, { root: true })
      // context.commit('updateConnectionPaths', connections)
      context.commit('broadcast/update', { updates: { cards, delta }, type: 'moveCards' }, { root: true })
      // context.commit('broadcast/update', { updates: { connections }, type: 'updateConnectionPaths' }, { root: true })
      // connections.forEach(connection => {
      //   context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
      // })
    }
  },
  getters: {
    byId: (state) => (id) => {
      return state.cards[id]
    },
    all: (state) => {
      return state.ids.map(id => state.cards[id])
    }
  }
}
