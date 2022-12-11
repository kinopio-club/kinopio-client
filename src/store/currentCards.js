import utils from '@/utils.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'
import sortBy from 'lodash-es/sortBy'
import { nextTick } from 'vue'
import qs from '@aguezz/qs-parse'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

let currentSpaceId
let prevMovePositions = {}
let tallestCardHeight = 0

const updateTallestCardHeight = (height) => {
  if (height > tallestCardHeight) {
    tallestCardHeight = Math.ceil(height)
  }
}

const currentCards = {
  namespaced: true,
  state: {
    ids: [],
    cards: {}, // {id, {card}}
    removedCards: [] // denormalized
  },
  mutations: {

    // init

    clear: (state) => {
      state.ids = []
      state.cards = {}
      state.removedCards = []
      tallestCardHeight = 0
    },
    restore: (state, cards) => {
      let cardIds = []
      cards.forEach(card => {
        cardIds.push(card.id)
        card.x = card.x || 100
        card.y = card.y || 100
        state.cards[card.id] = card
        updateTallestCardHeight(card.height)
      })
      state.ids = state.ids.concat(cardIds)
    },

    // create

    create: (state, card) => {
      if (!card.id) {
        console.warn('🚑 could not create card', card)
        return
      }
      state.ids.push(card.id)
      state.cards[card.id] = card
      cache.updateSpace('cards', state.cards, currentSpaceId)
    },

    // update

    update: (state, card) => {
      if (!utils.objectHasKeys(card)) { return }
      if (!card.id) {
        console.warn('🚑 could not update card', card)
        return
      }
      if (card.x) {
        card.x = Math.round(card.x)
      }
      if (card.y) {
        card.y = Math.round(card.y)
      }
      const keys = Object.keys(card)
      keys.forEach(key => {
        state.cards[card.id][key] = card[key]
      })
      cache.updateSpaceCardsDebounced(state.cards, currentSpaceId)
    },
    move: (state, { cards, spaceId }) => {
      cards.forEach(card => {
        state.cards[card.id].x = card.x
        state.cards[card.id].y = card.y
      })
      cache.updateSpaceCardsDebounced(state.cards, currentSpaceId)
    },
    remove: (state, cardToRemove) => {
      if (!cardToRemove) { return }
      const card = state.cards[cardToRemove.id]
      state.ids = state.ids.filter(id => id !== card.id)
      delete state.cards[card.id]
      state.removedCards.unshift(card)
      cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
      cache.updateSpace('cards', state.cards, currentSpaceId)
    },
    removedCards: (state, removedCards) => {
      state.removedCards = removedCards
    },
    deleteCard: (state, cardToDelete) => {
      if (!cardToDelete) { return }
      const card = state.cards[cardToDelete.id]
      if (card) {
        state.ids = state.ids.filter(id => id !== card.id)
        delete state.cards[card.id]
      }
      const shouldDelete = state.removedCards.find(removedCard => cardToDelete.id === removedCard.id)
      if (shouldDelete) {
        state.removedCards = state.removedCards.filter(removedCard => cardToDelete.id !== removedCard.id)
        cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
      } else {
        cache.updateSpace('cards', state.cards, currentSpaceId)
      }
    },
    restoreRemoved: (state, card) => {
      // restore
      const cardId = card.id
      state.ids.push(cardId)
      state.cards[cardId] = card
      cache.updateSpace('cards', state.cards, currentSpaceId)
      // update removed
      state.removedCards = state.removedCards.filter(removedCard => removedCard.id !== cardId)
      cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
    },

    // broadcast

    moveWhileDraggingBroadcast: (state, { cards }) => {
      cards.forEach(card => {
        const element = document.querySelector(`article[data-card-id="${card.id}"]`)
        element.style.left = card.x + 'px'
        element.style.top = card.y + 'px'
      })
    },
    moveBroadcast: (state, { cards }) => {
      cards.forEach(updated => {
        const card = state.cards[updated.id]
        if (!card) { return }
        card.x = updated.x
        card.y = updated.y
      })
      cache.updateSpaceCardsDebounced(state.cards, currentSpaceId)
    },

    // dimensions

    tallestCardHeight: (state, value) => {
      state.tallestCardHeight = value
    },
    filteredWidths: (state, value) => {
      const cards = state.ids.map(id => state.cards[id])
      if (value) {
        cards.forEach(card => {
          const element = document.querySelector(`article [data-card-id="${card.id}"]`)
          if (!element) { return }
          const rect = element.getBoundingClientRect()
          card.filteredWidth = Math.round(rect.width)
        })
      }
    }
  },
  actions: {

    // init

    updateSpaceId: (context, spaceId) => {
      currentSpaceId = spaceId
    },
    mergeUnique: (context, newCards) => {
      newCards.forEach(newCard => {
        let shouldUpdate
        let prevCard = context.getters.byId(newCard.id)
        let card = { id: newCard.id }
        let keys = Object.keys(newCard)
        keys = keys.filter(key => key !== 'id')
        keys.forEach(key => {
          if (prevCard[key] !== newCard[key]) {
            card[key] = newCard[key]
            shouldUpdate = true
          }
        })
        if (!shouldUpdate) { return }
        context.commit('update', card)
      })
    },
    mergeRemove: (context, removeCards) => {
      removeCards.forEach(card => {
        context.commit('remove', card)
      })
    },

    // create

    add: (context, { position, isParentCard, name, id, backgroundColor }) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'addCard' })
      if (context.rootGetters['currentSpace/shouldPreventAddCard']) {
        context.commit('notifyCardsCreatedIsOverLimit', true, { root: true })
        return
      }
      let cards = context.getters.all
      const highestCardZ = utils.highestCardZ(cards)
      const defaultBackgroundColor = context.rootState.currentUser.defaultCardBackgroundColor
      let card = {
        id: id || nanoid(),
        x: position.x,
        y: position.y,
        z: highestCardZ + 1,
        name: name || '',
        frameId: 0,
        userId: context.rootState.currentUser.id,
        urlPreviewIsVisible: true,
        commentIsVisible: true,
        width: utils.emptyCard().width,
        height: utils.emptyCard().height,
        isLocked: false,
        backgroundColor: backgroundColor || defaultBackgroundColor
      }
      context.commit('cardDetailsIsVisibleForCardId', card.id, { root: true })
      card.spaceId = currentSpaceId
      context.dispatch('api/addToQueue', { name: 'createCard', body: card }, { root: true })
      context.dispatch('broadcast/update', { updates: card, type: 'createCard', handler: 'currentCards/create' }, { root: true })
      context.commit('create', card)
      if (isParentCard) { context.commit('parentCardId', card.id, { root: true }) }
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: 1
      }, { root: true })
      context.dispatch('currentSpace/checkIfShouldNotifyCardsCreatedIsNearLimit', null, { root: true })
      context.dispatch('currentSpace/notifyCollaboratorsCardUpdated', { cardId: card.id, type: 'createCard' }, { root: true })
      context.dispatch('currentUser/checkIfShouldUnlockStickyCards', null, { root: true })
    },
    addMultiple: (context, newCards) => {
      newCards.forEach(card => {
        card = {
          id: card.id || nanoid(),
          x: card.x,
          y: card.y,
          z: card.z || context.state.ids.length + 1,
          name: card.name,
          frameId: card.frameId || 0,
          width: card.width || utils.emptyCard().width,
          height: card.height || utils.emptyCard().height,
          userId: context.rootState.currentUser.id,
          backgroundColor: card.backgroundColor,
          shouldUpdateUrlPreview: true,
          urlPreviewIsVisible: true
        }
        context.dispatch('api/addToQueue', { name: 'createCard', body: card }, { root: true })
        context.dispatch('broadcast/update', { updates: card, type: 'createCard', handler: 'currentCards/create' }, { root: true })
        context.commit('create', card)
      })
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: newCards.length
      }, { root: true })
    },
    paste: (context, { card, cardId }) => {
      utils.typeCheck({ value: card, type: 'object', origin: 'pasteCard' })
      card.id = cardId || nanoid()
      card.spaceId = currentSpaceId
      const prevCards = context.getters.all
      utils.uniqueCardPosition(card, prevCards)
      const tags = utils.tagsFromStringWithoutBrackets(card.name)
      if (tags) {
        tags.forEach(tag => {
          tag = utils.newTag({
            name: tag,
            defaultColor: context.rootState.currentUser.color,
            cardId: card.id,
            spaceId: context.state.id
          })
          context.dispatch('currentSpace/addTag', tag, { root: true }) // TODO to tag module?
        })
      }
      context.dispatch('api/addToQueue', { name: 'createCard', body: card }, { root: true })
      context.dispatch('broadcast/update', { updates: card, type: 'createCard', handler: 'currentCards/create' }, { root: true })
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: 1
      }, { root: true })
      context.dispatch('history/add', { cards: [card] }, { root: true })
      context.commit('create', card)
    },

    // update

    update: (context, card) => {
      // prevent null position
      const keys = Object.keys(card)
      if (keys.includes('x') || keys.includes('y')) {
        if (card.x === undefined || card.x === null) {
          delete card.x
        }
        if (card.y === undefined || card.y === null) {
          delete card.y
        }
      }
      context.dispatch('api/addToQueue', { name: 'updateCard', body: card }, { root: true })
      context.dispatch('broadcast/update', { updates: card, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
      context.dispatch('history/add', { cards: [card] }, { root: true })
      context.commit('update', card)
      if (card.name) {
        context.dispatch('updateDimensions', { cards: [card] })
      }
      cache.updateSpace('editedByUserId', context.rootState.currentUser.id, currentSpaceId)
    },
    updateName (context, { card, newName }) {
      const canEditCard = context.rootGetters['currentUser/canEditCard'](card)
      if (!canEditCard) { return }
      context.dispatch('update', {
        id: card.id,
        name: newName
      })
      context.dispatch('updateDimensions', { cards: [card] })
    },
    toggleChecked (context, { cardId, value }) {
      utils.typeCheck({ value, type: 'boolean', origin: 'toggleChecked' })
      utils.typeCheck({ value: cardId, type: 'string', origin: 'toggleChecked' })
      const card = context.getters.byId(cardId)
      let name = card.name
      const checkbox = utils.checkboxFromString(name)
      name = name.replace(checkbox, '')
      if (value) {
        name = `[x] ${name}`
      } else {
        name = `[] ${name}`
      }
      context.dispatch('update', {
        id: cardId,
        name,
        nameUpdatedAt: new Date()
      })
    },
    removeChecked: (context, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'removeChecked' })
      const card = context.getters.byId(cardId)
      let name = card.name
      name = name.replace('[x]', '').trim()
      context.dispatch('update', {
        id: cardId,
        name,
        nameUpdatedAt: new Date()
      })
    },
    commentIsVisible: (context, { cardId, value }) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'commentIsVisible' })
      context.dispatch('update', {
        id: cardId,
        commentIsVisible: value
      })
      const card = context.getters.byId(cardId)
      context.dispatch('updateDimensions', { cards: [card] })
    },
    removeTrackingQueryStrings: (context, { cardId }) => {
      setTimeout(() => {
        const card = context.getters.byId(cardId)
        const urls = utils.urlsFromString(card.name)
        if (!urls) { return }
        // https://www.bleepingcomputer.com/PoC/qs.html
        // https://www.bleepingcomputer.com/news/security/new-firefox-privacy-feature-strips-urls-of-tracking-parameters
        const trackingKeys = ['is_copy_url', 'is_from_webapp', 'utm_', 'oly_enc_id', 'oly_anon_id', '__s', 'vero_id', '_hsenc', 'mkt_tok', 'fbclid', 'mc_eid', 'pf_', 'pd_']
        urls.forEach(url => {
          url = url.trim()
          url = utils.removeTrailingSlash(url)
          const queryString = utils.queryString(url)
          const domain = utils.urlWithoutQueryString(url)
          if (!queryString) { return }
          let queryObject = qs.decode(queryString)
          let keys = Object.keys(queryObject)
          let keysToRemove = []
          trackingKeys.forEach(trackingKey => {
            keys.forEach(key => {
              if (key.startsWith(trackingKey)) {
                keysToRemove.push(key)
              }
            })
          })
          if (!keysToRemove.length) { return }
          console.log('🫧 trackingKeysToRemove', keysToRemove)
          keysToRemove.forEach(key => delete queryObject[key])
          const newUrl = qs.encode(domain, queryObject)
          const newName = card.name.replace(url, newUrl)
          context.dispatch('update', {
            id: card.id,
            name: newName
          })
        })
      }, 100)
    },

    // dimensions

    updateDimensions: (context, { cards, cardId }) => {
      let newCards = []
      if (cards) {
        utils.typeCheck({ value: cards, type: 'array', origin: 'updateDimensions cards' })
        newCards = cards
      } else if (cardId) {
        utils.typeCheck({ value: cardId, type: 'string', origin: 'updateDimensions cardId' })
        const card = context.getters.byId(cardId)
        if (!card) { return }
        newCards.push(card)
      } else {
        newCards = context.getters.all
      }
      newCards = utils.clone(newCards)
      newCards = newCards.filter(card => Boolean(card))
      newCards.forEach(card => {
        const prevDimensions = {
          width: card.width,
          height: card.height
        }
        nextTick(() => {
          card = utils.updateCardDimensions(card)
          const dimensionsChanged = card.width !== prevDimensions.width || card.height !== prevDimensions.height
          if (!dimensionsChanged) { return }
          const body = {
            id: card.id,
            width: Math.ceil(card.width),
            height: Math.ceil(card.height)
          }
          context.dispatch('api/addToQueue', { name: 'updateCard', body }, { root: true })
          context.dispatch('broadcast/update', { updates: body, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
          context.commit('update', body)
          context.dispatch('currentConnections/updatePaths', { cardId: card.id, shouldUpdateApi: true }, { root: true })
          updateTallestCardHeight(card.height)
          context.dispatch('updateFilteredWidths')
        })
      })
    },
    updateFilteredWidths: (context) => {
      const currentUser = context.rootState.currentUser
      const isFiltersActive = currentUser.filterShowUsers || currentUser.filterShowDateUpdated
      nextTick(() => {
        if (isFiltersActive) {
          context.commit('filteredWidths', true)
        }
      })
    },

    // resize

    resize: (context, { cardIds, deltaX }) => {
      const minImageWidth = 64
      cardIds.forEach(cardId => {
        const card = context.getters.byId(cardId)
        let width = card.resizeWidth || card.width
        width = width + deltaX
        width = Math.max(minImageWidth, width)
        const updates = { id: cardId, resizeWidth: width }
        context.dispatch('update', updates)
        context.dispatch('broadcast/update', { updates, type: 'resizeCard', handler: 'currentCards/update' }, { root: true })
        context.dispatch('updateDimensions', { cards: [card] })
      })
    },
    removeResize: (context, { cardIds }) => {
      cardIds.forEach(cardId => {
        const updates = { id: cardId, resizeWidth: null }
        context.dispatch('update', updates)
        context.dispatch('broadcast/update', { updates, type: 'resizeCard', handler: 'currentCards/update' }, { root: true })
        const card = context.getters.byId(cardId)
        context.dispatch('updateDimensions', { cards: [card] })
      })
    },

    // move

    moveWhileDragging: (state, cards) => {
      cards.forEach(card => {
        const element = document.querySelector(`article[data-card-id="${card.id}"]`)
        element.style.left = card.x + 'px'
        element.style.top = card.y + 'px'
      })
    },

    move: (context, { endCursor, prevCursor, delta }) => {
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
      let connections = []
      let cards = context.getters.isSelected
      // prevent cards bunching up at 0
      cards.forEach(card => {
        if (!card) { return }
        if (card.x === 0) { delta.x = Math.max(0, delta.x) }
        if (card.y === 0) { delta.y = Math.max(0, delta.y) }
        connections = connections.concat(context.rootGetters['currentConnections/byCardId'](card.id))
      })
      cards = cards.filter(card => Boolean(card))
      // prevent cards with null or negative positions
      cards = utils.clone(cards)
      cards = cards.map(card => {
        let position
        if (prevMovePositions[card.id]) {
          position = prevMovePositions[card.id]
        } else {
          position = utils.cardPositionFromElement(card.id)
        }
        card.x = position.x
        card.y = position.y
        // x
        if (card.x === undefined || card.x === null) {
          delete card.x
        } else {
          card.x = Math.max(0, card.x + delta.x)
          card.x = Math.round(card.x)
        }
        // y
        if (card.y === undefined || card.y === null) {
          delete card.y
        } else {
          card.y = Math.max(0, card.y + delta.y)
          card.y = Math.round(card.y)
        }
        card = {
          x: card.x,
          y: card.y,
          z: card.z,
          id: card.id
        }
        prevMovePositions[card.id] = card
        return card
      })
      // update
      context.dispatch('moveWhileDragging', cards)
      connections = uniqBy(connections, 'id')
      context.commit('cardsWereDragged', true, { root: true })
      context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
      context.dispatch('broadcast/update', { updates: { cards }, type: 'moveCards', handler: 'currentCards/moveWhileDraggingBroadcast' }, { root: true })
      context.dispatch('broadcast/update', { updates: { connections }, type: 'updateConnectionPaths', handler: 'currentConnections/updatePathsWhileDraggingBroadcast' }, { root: true })
      connections.forEach(connection => {
        context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
      })
    },
    afterMove: (context) => {
      prevMovePositions = {}
      const spaceId = context.rootState.currentSpace.id
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const currentDraggingCard = context.getters.byId(currentDraggingCardId)
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      let cards
      let connections = []
      if (multipleCardsSelectedIds.length) {
        cards = multipleCardsSelectedIds
      } else {
        cards = [currentDraggingCardId]
      }
      cards = cards.filter(card => card)
      if (!cards.length) { return }
      cards = cards.map(id => {
        let card = context.getters.byId(id)
        if (!card) { return }
        card = utils.clone(card)
        if (!card) { return }
        const position = utils.cardPositionFromElement(id)
        card.x = position.x
        card.y = position.y
        const { x, y, z, commentIsVisible } = card
        return { id, x, y, z, commentIsVisible }
      })
      cards = cards.filter(card => Boolean(card))
      context.commit('move', { cards, spaceId })
      cards = cards.filter(card => card)
      cards.forEach(card => {
        context.dispatch('api/addToQueue', {
          name: 'updateCard',
          body: card
        }, { root: true })
        connections = connections.concat(context.rootGetters['currentConnections/byCardId'](card.id))
      })
      context.dispatch('broadcast/update', { updates: { cards }, type: 'moveCards', handler: 'currentCards/moveBroadcast' }, { root: true })
      connections = uniqBy(connections, 'id')
      context.dispatch('currentConnections/updatePaths', { connections }, { root: true })
      context.dispatch('broadcast/update', { updates: { connections }, type: 'updateConnectionPaths', handler: 'currentConnections/updatePathsBroadcast' }, { root: true })
      context.dispatch('history/resume', null, { root: true })
      context.dispatch('history/add', { cards, useSnapshot: true }, { root: true })
      context.dispatch('checkIfItemShouldIncreasePageSize', currentDraggingCard, { root: true })
    },

    // distribute position

    distributeVertically: (context, cards) => {
      cards = utils.clone(cards)
      nextTick(() => {
        const spaceBetweenCards = 12
        const zoom = context.rootGetters.spaceCounterZoomDecimal
        let prevCard
        cards.forEach((card, index) => {
          if (index === 0) {
            prevCard = card
          } else {
            const prevCardElement = document.querySelector(`article [data-card-id="${prevCard.id}"]`)
            const prevCardRect = prevCardElement.getBoundingClientRect()
            card.y = prevCard.y + (prevCardRect.height * zoom) + spaceBetweenCards
            prevCard = card
          }
          card = utils.updateCardDimensions(card)
          context.dispatch('update', {
            name: card.name,
            id: card.id,
            y: card.y,
            width: card.width,
            height: card.height
          })
        })
      })
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
      let cards = context.getters.all
      cards.forEach(card => {
        const body = { id: card.id, z: 0 }
        context.commit('update', body)
        context.dispatch('api/addToQueue', { name: 'updateCard', body }, { root: true })
        context.dispatch('broadcast/update', { updates: body, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
      })
    },
    incrementZ: (context, id) => {
      const card = context.getters.byId(id)
      if (!card) { return }
      if (card.isLocked) { return }
      const maxInt = Number.MAX_SAFE_INTEGER - 1000
      let cards = context.getters.all
      let highestCardZ = utils.highestCardZ(cards)
      if (highestCardZ > maxInt) {
        context.dispatch('clearAllZs')
        highestCardZ = 1
      }
      const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
      const body = { id, z: highestCardZ + 1 }
      context.commit('update', body)
      if (!userCanEdit) { return }
      context.dispatch('api/addToQueue', { name: 'updateCard', body }, { root: true })
      context.dispatch('broadcast/update', { updates: body, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
    },

    // remove

    remove: (context, card) => {
      if (!card) { return }
      card = context.getters.byId(card.id)
      const cardHasContent = Boolean(card.name)
      if (cardHasContent) {
        card = utils.clone(card)
        card.isRemoved = true
        context.dispatch('history/add', { cards: [card], isRemoved: true }, { root: true })
        context.commit('remove', card)
        context.dispatch('api/addToQueue', { name: 'removeCard', body: card }, { root: true })
      } else {
        context.dispatch('deleteCard', card)
      }
      context.dispatch('broadcast/update', { updates: card, type: 'removeCard', handler: 'currentCards/remove' }, { root: true })
      context.dispatch('currentConnections/removeFromCard', card, { root: true })
      const cardIsUpdatedByCurrentUser = card.userId === context.rootState.currentUser.id
      if (cardIsUpdatedByCurrentUser) {
        context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
          delta: -1
        }, { root: true })
      }
      if (!context.rootGetters['currentUser/cardsCreatedIsOverLimit']) {
        context.commit('notifyCardsCreatedIsOverLimit', false, { root: true })
      }
    },
    deleteCard: (context, card) => {
      context.commit('deleteCard', card)
      context.dispatch('api/addToQueue', { name: 'deleteCard', body: card }, { root: true })
    },
    deleteAllRemoved: (context) => {
      const spaceId = context.rootState.currentSpace.id
      const userId = context.rootState.currentUser.id
      const removedCards = context.state.removedCards
      removedCards.forEach(card => context.commit('deleteCard', card))
      context.dispatch('api/addToQueue', { name: 'deleteAllRemovedCards', body: { userId, spaceId } }, { root: true })
    },
    restoreRemoved: (context, card) => {
      context.commit('restoreRemoved', card)
      context.dispatch('api/addToQueue', { name: 'restoreRemovedCard', body: card }, { root: true })
      context.dispatch('broadcast/update', { updates: card, type: 'restoreRemovedCard', handler: 'currentCards/restoreRemoved' }, { root: true })
    },

    // card details

    showCardDetails: (context, cardId) => {
      context.dispatch('incrementZ', cardId)
      context.commit('cardDetailsIsVisibleForCardId', cardId, { root: true })
      context.commit('parentCardId', cardId, { root: true })
      context.commit('loadSpaceShowDetailsForCardId', '', { root: true })
    },

    // tweet cards

    checkIfShouldUpdateNewTweetCards: (context) => {
      const newCards = context.rootState.newTweetCards
      if (!newCards.length) { return }
      const cards = utils.clone(newCards)
      context.commit('clearNewTweetCards', null, { root: true })
      context.commit('isLoadingSpace', true, { root: true })
      console.log('🕊 addTweetCards', cards)
      context.dispatch('addTweetCardsComplete', cards)
    },
    addTweetCardsComplete: (context, cards) => {
      context.dispatch('history/pause', null, { root: true })
      context.dispatch('closeAllDialogs', 'addTweetCardsComplete', { root: true })
      // position cards
      context.dispatch('currentCards/distributeVertically', cards, { root: true })
      nextTick(() => {
        nextTick(() => {
          context.dispatch('addAndSelectConnectionsBetweenTweetCards', cards)
          // select cards
          const cardIds = cards.map(card => card.id)
          context.commit('multipleCardsSelectedIds', cardIds, { root: true })
          // ⏺ history
          cards = cardIds.map(cardId => context.getters.byId(cardId))
          context.dispatch('history/resume', null, { root: true })
          context.dispatch('history/add', { cards, useSnapshot: true }, { root: true })
          // wait for images to load
          setTimeout(() => {
            context.dispatch('currentCards/distributeVertically', cards, { root: true })
            context.commit('isLoadingSpace', false, { root: true })
            context.dispatch('updatePageSizes', null, { root: true })
            console.log('🕊 addTweetCardsComplete', cards)
          }, 1000)
        })
      })
    },
    addAndSelectConnectionsBetweenTweetCards: (context, cards) => {
      const type = context.rootGetters['currentConnections/typeForNewConnections']
      if (!type) {
        context.dispatch('currentConnections/addType', null, { root: true })
      }
      let connections = []
      cards.forEach((card, index) => {
        if (index === 0) { return }
        const startCardId = cards[index - 1].id
        const endCardId = cards[index].id
        connections.push({
          id: nanoid(),
          startCardId,
          endCardId,
          path: this.$store.getters['currentConnections/connectionBetweenCards'](startCardId, endCardId)
        })
      })
      connections.forEach(connection => {
        context.dispatch('currentConnections/add', { connection, type, shouldNotRecordHistory: true }, { root: true })
        context.dispatch('addToMultipleConnectionsSelected', connection.id, { root: true })
      })
    }
  },
  getters: {
    byId: (state) => (id) => {
      return state.cards[id]
    },
    all: (state) => {
      return state.ids.map(id => state.cards[id])
    },
    isNotLocked: (state, getters) => {
      let cards = getters.all
      return cards.filter(card => !card.isLocked)
    },
    isLocked: (state, getters) => {
      let cards = getters.all
      return cards.filter(card => card.isLocked)
    },
    canBeSelectedSortedByY: (state, getters) => {
      // remove unselectable
      const commentsAreHidden = state.filterComments
      let cards = getters.all
      cards = cards.filter(card => !card.isLocked)
      if (commentsAreHidden) {
        cards = cards.filter(card => !card.isComment)
      }
      // result
      cards = sortBy(cards, ['y'])
      let yIndex = []
      cards.forEach(card => yIndex.push(card.y))
      const result = {
        cards,
        yIndex
      }
      return result
    },
    isSelectable: (state, getters, rootState) => (position) => {
      const threshold = tallestCardHeight
      const canBeSelectedSortedByY = getters.canBeSelectedSortedByY
      let yIndex = canBeSelectedSortedByY.yIndex
      let cards = canBeSelectedSortedByY.cards
      // ┌─────────────────────────────────┐
      // │Viewport                         │
      // ├─────────────────────────────────┤
      // │- Threshold /////////////////////│
      // │/////////////////////////////////│
      // │//////////////█████//////////////│
      // ├──────────────█ y █──────────────┤
      // │//////////////█████//////////////│
      // │/////////////////////////////////│
      // │+ Threshold /////////////////////│
      // ├─────────────────────────────────┤
      // │Viewport                         │
      // └─────────────────────────────────┘
      // cards within y range
      yIndex = yIndex.map(y => parseInt(y))
      const min = Math.max(position.y - threshold, 0)
      const max = min + threshold
      let minIndex = yIndex.findIndex(y => y >= min)
      let maxIndex = yIndex.findIndex(y => y >= max)
      if (minIndex === -1) { return }
      if (maxIndex === -1) {
        maxIndex = yIndex.length
      }
      cards = cards.slice(minIndex, maxIndex)
      return cards
    },
    isSelected: (state, getters, rootState) => {
      const currentDraggingCardId = rootState.currentDraggingCardId
      const multipleCardsSelectedIds = rootState.multipleCardsSelectedIds
      let cardIds
      if (multipleCardsSelectedIds.length) {
        cardIds = multipleCardsSelectedIds
      } else {
        cardIds = [currentDraggingCardId]
      }
      const cards = cardIds.map(id => getters.byId(id))
      return cards
    },
    withSpaceLinks: (state, getters) => {
      let cards = getters.all
      return cards.filter(card => utils.idIsValid(card.linkToSpaceId))
    },
    withTagName: (state, getters) => (tagName) => {
      let cards = getters.all
      return cards.filter(card => {
        const tags = utils.tagsFromStringWithoutBrackets(card.name)
        if (tags) {
          return tags.includes(tagName)
        }
      })
    },
    userIds: (state, getters) => {
      const cards = getters.all
      let users = []
      cards.forEach(card => {
        users.push(card.userId)
        users.push(card.nameUpdatedByUserId)
      })
      users = users.filter(user => Boolean(user))
      users = uniq(users)
      return users
    },
    users: (state, getters, rootState, rootGetters) => {
      return getters.userIds.map(id => rootGetters['currentSpace/userById'](id))
    },
    colors: (state, getters) => {
      const cards = getters.all
      let colors = cards.map(card => card.backgroundColor)
      colors = colors.filter(color => Boolean(color))
      return uniq(colors)
    }
  }
}

export default currentCards
