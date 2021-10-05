import utils from '@/utils.js'
import cache from '@/cache.js'

// import debounce from 'lodash-es/debounce'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636
let currentSpaceId

export default {
  namespaced: true,
  state: {
    ids: [],
    cards: {},
    removedCards: [] // denormalized
  },
  mutations: {
    clear: (state) => {
      state.ids = []
      state.cards = {}
      state.removedCards = []
    },
    update: (state, card) => {
      const keys = Object.keys(card)
      keys.forEach(key => {
        state.cards[card.id][key] = card[key]
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
      cards.forEach(card => {
        state.cards[card.id].x = card.x + delta.x
        state.cards[card.id].y = card.y + delta.y
      })
      cache.updateSpaceCardsDebounced(state.cards, spaceId)
    },
    // add: (state, item) => {
    //   utils.typeCheck({ value: item, type: 'object', origin: 'history add' })
    //   items.push(item)
    // },

    // cards
    remove: (state, cardToRemove) => {
      const card = state.cards[cardToRemove.id]
      state.ids = state.ids.filter(id => id !== card.id)
      // state.cards = state.cards.filter(id => id !== card.id)
      delete state.cards[card.id]
      state.removedCards.unshift(card)
      // const spaceId =
      cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
      const cards = utils.denormalizeCards(state.cards)
      cache.updateSpace('cards', cards, currentSpaceId)
    },
    // removedCards: (state, removedCards) => {
    //   state.removedCards = removedCards
    // },
    removePermanent: (state, cardToRemove) => {
      const card = state.cards[cardToRemove.id]
      state.ids = state.ids.filter(id => id !== card.id)
      delete state.cards[card.id]
      // state.cards = state.cards.filter(id => id !== card.id)
      const isRemoved = state.removedCards.find(removedCard => card.id === removedCard.id)
      if (isRemoved) {
        state.removedCards = state.removedCards.filter(removedCard => card.id !== removedCard.id)
        cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
      } else {
        const cards = utils.denormalizeCards(state.cards)
        cache.updateSpace('cards', cards, currentSpaceId)
      }
    },
    removeAllRemovedPermanent: (state) => {
      state.removedCards = []
      cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
    },
    restoreRemovedCard: (state, cardToRestore) => {
      let card = state.cards[cardToRestore.id]
      const index = state.removedCards.findIndex(removedCard => card.id === removedCard.id)
      // restore
      state.ids.push(card.id)
      card = utils.normalizeCards(card)
      state.cards[card.id] = card
      const cards = utils.denormalizeCards(state.cards)
      cache.updateSpace('cards', cards, currentSpaceId)
      // update removed
      state.removedCards.splice(index, 1)
      cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
    }
  },
  actions: {
    updateSpaceId: (context, spaceId) => {
      currentSpaceId = spaceId
    },
    update: (context, card) => {
      // prevent null position
      const keys = Object.keys(card)
      if (keys.includes('x') || keys.includes('y')) {
        if (!card.x) {
          delete card.x
        }
        if (!card.y) {
          delete card.y
        }
      }
      context.commit('update', card)
      const update = { name: 'updateCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'updateCard' }, { root: true })
      context.commit('undoHistory/add', update, { root: true })
    },
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

      let cards = cardIds.map(id => context.getters.byId(id))

      // console.log('🔵', cardIds, cards)

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
    },

    // z-index

    incrementSelectedZs: (context) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      if (multipleCardsSelectedIds.length) {
        multipleCardsSelectedIds.forEach(id => context.dispatch('incrementZ', id))
      } else {
        context.dispatch('incrementZ', currentDraggingCardId)
      }
    },
    clearAllZs: (context) => {
      // let cards = context.state.cards
      let cards = context.getters.all
      // todo make more efficient w ids array
      cards.forEach(card => {
        const body = { id: card.id, z: 0 }
        const update = { name: 'updateCard', body }
        context.commit('update', body)
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('broadcast/update', { updates: body, type: 'updateCard' }, { root: true })
      })
    },
    incrementZ: (context, id) => {
      const maxInt = Number.MAX_SAFE_INTEGER - 1000
      let cards = context.getters.all
      // console.log('🎑',cards)
      let highestCardZ = utils.highestCardZ(cards)
      if (highestCardZ > maxInt) {
        context.dispatch('clearAllZs')
        highestCardZ = 1
      }
      const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
      const body = { id, z: highestCardZ + 1 }
      context.commit('update', body)
      if (!userCanEdit) { return }
      const update = { name: 'updateCard', body }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: body, type: 'updateCard' }, { root: true })
    },

    // remove

    remove: (context, card) => {
      const cardHasContent = Boolean(card.name)
      if (cardHasContent) {
        context.commit('remove', card)
        const update = { name: 'removeCard', body: card }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('undoHistory/add', update, { root: true })
      } else {
        context.dispatch('removePermanent', card)
      }
      context.commit('broadcast/update', { updates: card, type: 'removeCard' }, { root: true })
      // context.dispatch('removeConnectionsFromCard', card)
      context.commit('triggerUpdatePositionInVisualViewport', null, { root: true })
      const cardIsUpdatedByCurrentUser = card.userId === context.rootState.currentUser.id
      if (cardIsUpdatedByCurrentUser) {
        context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
          delta: -1
        }, { root: true })
      }
      if (!context.rootGetters['currentUser/cardsCreatedIsOverLimit']) {
        context.commit('notifyCardsCreatedIsOverLimit', false, { root: true })
      }
      context.commit('removeFromCardMap', card, { root: true })
    },
    removePermanent: (context, card) => {
      context.commit('removePermanent', card)
      // context.commit('removeTagsFromCard', card)
      context.dispatch('api/addToQueue', { name: 'removeCardPermanent', body: card }, { root: true })
    },
    removeAllRemovedPermanent: (context) => {
      // context.commit('removeTagsFromAllRemovedCardsPermanent')
      context.commit('removeAllRemovedPermanent')
      context.dispatch('api/addToQueue', { name: 'removeAllRemovedCardsPermanentFromSpace', body: {} }, { root: true })
    },
    restoreRemoved: (context, card) => {
      context.commit('restoreRemovedCard', card)
      const update = { name: 'restoreRemovedCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'restoreRemovedCard' }, { root: true })
      context.commit('undoHistory/add', update, { root: true })
      context.commit('addToCardMap', card, { root: true })
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
