import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'
import sortBy from 'lodash-es/sortBy'
import { nextTick } from 'vue'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

let currentSpaceId
let prevMoveDelta = { x: 0, y: 0 }
let tallestCardHeight = 0
let canBeSelectedSortedByY = {}

const currentCards = {
  namespaced: true,
  state: {
    ids: [],
    cards: {}, // {id, {card}}
    removedCards: [], // denormalized
    tallestCardHeight: 0
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
      })
      state.ids = state.ids.concat(cardIds)
    },

    // create

    create: (state, { card, shouldPreventCache }) => {
      if (!card.id) {
        console.warn('🚑 could not create card', card)
        return
      }
      state.ids.push(card.id)
      state.cards[card.id] = card
      if (shouldPreventCache) { return }
      cache.updateSpace('cards', state.cards, currentSpaceId)
    },

    // update

    update: (state, card) => {
      if (!utils.objectHasKeys(card)) { return }
      if (!card.id) {
        console.warn('🚑 could not update card', card)
        return
      }
      delete card.userId
      if (card.x) {
        card.x = Math.round(card.x)
      }
      if (card.y) {
        card.y = Math.round(card.y)
      }
      const keys = Object.keys(card)
      const prevCard = state.cards[card.id]
      if (!prevCard) { return }
      let updatedCard = utils.clone(prevCard)
      keys.forEach(key => {
        updatedCard[key] = card[key]
      })
      state.cards[card.id] = updatedCard
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
      const idIndex = state.ids.indexOf(card.id)
      state.ids.splice(idIndex, 1)
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
        const idIndex = state.ids.indexOf(card.id)
        state.ids.splice(idIndex, 1)
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
    moveWhileDragging: (state, { cards }) => {
      cards.forEach(card => {
        const element = document.querySelector(`article[data-card-id="${card.id}"]`)
        if (!element) { return }
        if (element.dataset.isVisibleInViewport === 'false') { return }
        element.style.left = card.x + 'px'
        element.style.top = card.y + 'px'
      })
    },

    // broadcast

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

    add: (context, { x, y, position, isParentCard, name, id, backgroundColor, width, height, shouldUpdateUrlPreview }) => {
      utils.typeCheck({ value: position, type: 'object', allowUndefined: true })
      if (context.rootGetters['currentSpace/shouldPreventAddCard']) {
        context.commit('notifyCardsCreatedIsOverLimit', true, { root: true })
        return
      }
      let cards = context.getters.all
      const highestCardZ = utils.highestCardZ(cards)
      const defaultBackgroundColor = context.rootState.currentUser.defaultCardBackgroundColor
      const isComment = context.rootState.isCommentMode || context.rootGetters['currentUser/canOnlyComment']()
      let card = {
        id: id || nanoid(),
        x: x || position.x,
        y: y || position.y,
        z: highestCardZ + 1,
        name: name || '',
        frameId: 0,
        userId: context.rootState.currentUser.id,
        urlPreviewIsVisible: true,
        width: width || utils.emptyCard().width,
        height: height || utils.emptyCard().height,
        isLocked: false,
        backgroundColor: backgroundColor || defaultBackgroundColor,
        isRemoved: false,
        shouldUpdateUrlPreview,
        headerFontId: context.rootState.currentUser.prevHeaderFontId || 0,
        maxWidth: context.rootState.currentUser.cardSettingsMaxCardWidth,
        isComment
      }
      context.commit('cardDetailsIsVisibleForCardId', card.id, { root: true })
      card.spaceId = currentSpaceId
      context.dispatch('api/addToQueue', { name: 'createCard', body: card }, { root: true })
      context.dispatch('broadcast/update', { updates: { card }, type: 'createCard', handler: 'currentCards/create' }, { root: true })
      context.commit('create', { card })
      if (isParentCard) { context.commit('parentCardId', card.id, { root: true }) }
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        cards: [card]
      }, { root: true })
      context.dispatch('currentSpace/checkIfShouldNotifyCardsCreatedIsNearLimit', null, { root: true })
      context.dispatch('userNotifications/addCardUpdated', { cardId: card.id, type: 'createCard' }, { root: true })
    },
    addMultiple: (context, { cards, shouldOffsetPosition }) => {
      const spaceId = context.rootState.currentSpace.id
      cards = cards.map(card => {
        let x = card.x
        let y = card.y
        if (shouldOffsetPosition) {
          const offset = 100
          x += offset
          y += offset
        }
        return {
          id: card.id || nanoid(),
          x,
          y,
          z: card.z || context.state.ids.length + 1,
          name: card.name,
          frameId: card.frameId || 0,
          width: card.width,
          height: card.height,
          userId: context.rootState.currentUser.id,
          backgroundColor: card.backgroundColor,
          shouldUpdateUrlPreview: true,
          urlPreviewIsVisible: true,
          urlPreviewDescription: card.urlPreviewDescription,
          urlPreviewFavicon: card.urlPreviewFavicon,
          urlPreviewImage: card.urlPreviewImage,
          urlPreviewTitle: card.urlPreviewTitle,
          urlPreviewUrl: card.urlPreviewUrl,
          maxWidth: card.maxWidth || context.rootState.currentUser.cardSettingsMaxCardWidth
        }
      })
      cards.forEach(card => {
        context.dispatch('broadcast/update', { updates: { card }, type: 'createCard', handler: 'currentCards/create' }, { root: true })
        context.commit('create', { card })
      })
      context.dispatch('api/addToQueue', { name: 'createMultipleCards', body: { cards, spaceId } }, { root: true })
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        cards
      }, { root: true })
    },
    paste: (context, { card, cardId }) => {
      utils.typeCheck({ value: card, type: 'object' })
      card.id = cardId || nanoid()
      card.spaceId = currentSpaceId
      card.isCreatedThroughPublicApi = false
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
      context.dispatch('broadcast/update', { updates: { card }, type: 'createCard', handler: 'currentCards/create' }, { root: true })
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        cards: [card]
      }, { root: true })
      context.dispatch('history/add', { cards: [card] }, { root: true })
      context.commit('create', { card })
    },

    // update

    update: (context, { card, shouldPreventUpdateDimensionsAndPaths }) => {
      if (!card) { return }
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
      delete card.userId
      context.dispatch('api/addToQueue', { name: 'updateCard', body: card }, { root: true })
      context.dispatch('broadcast/update', { updates: card, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
      context.dispatch('history/add', { cards: [card] }, { root: true })
      context.commit('update', card)
      if (card.name) {
        context.commit('updateCardNameInOtherItems', card, { root: true })
        context.commit('triggerUpdateOtherCard', card.id, { root: true })
      }
      cache.updateSpace('editedByUserId', context.rootState.currentUser.id, currentSpaceId)
      if (shouldPreventUpdateDimensionsAndPaths) { return }
      context.commit('triggerUpdateCardDimensionsAndPaths', card.id, { root: true })
    },
    updateMultiple: (context, cards) => {
      const spaceId = context.rootState.currentSpace.id
      let updates = {
        cards,
        spaceId: context.rootState.currentSpace.id
      }
      context.dispatch('api/addToQueue', { name: 'updateMultipleCards', body: updates }, { root: true })
      context.dispatch('history/add', { cards }, { root: true })
      cards.forEach(card => {
        context.dispatch('broadcast/update', { updates: card, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
        context.commit('update', card)
        if (card.name) {
          context.commit('updateCardNameInOtherItems', card, { root: true })
          context.commit('triggerUpdateOtherCard', card.id, { root: true })
        }
        cache.updateSpace('editedByUserId', context.rootState.currentUser.id, currentSpaceId)
      })
    },
    updateCounter: (context, { card, shouldIncrement, shouldDecrement }) => {
      const isSignedIn = context.rootGetters['currentUser/isSignedIn']
      context.commit('update', card)
      context.dispatch('api/addToQueue', { name: 'updateCardCounter', body: card }, { root: true })
      context.dispatch('broadcast/update', { updates: card, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
      if (!isSignedIn) {
        const body = {
          cardId: card.id,
          shouldIncrement,
          shouldDecrement
        }
        context.dispatch('api/updateCardCounter', body, { root: true })
      }
    },
    updateName (context, { card, newName }) {
      const canEditCard = context.rootGetters['currentUser/canEditCard'](card)
      if (!canEditCard) { return }
      const update = {
        id: card.id,
        name: newName
      }
      context.dispatch('update', { card: update })
      context.dispatch('updateDimensions', { cards: [card] })
    },
    toggleChecked (context, { cardId, value }) {
      utils.typeCheck({ value, type: 'boolean' })
      utils.typeCheck({ value: cardId, type: 'string' })
      const card = context.getters.byId(cardId)
      let name = card.name
      const checkbox = utils.checkboxFromString(name)
      name = name.replace(checkbox, '')
      if (value) {
        name = `[x] ${name}`
      } else {
        name = `[] ${name}`
      }
      const update = {
        id: cardId,
        name,
        nameUpdatedAt: new Date()
      }
      context.dispatch('update', { card: update })
    },
    removeChecked: (context, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      const card = context.getters.byId(cardId)
      let name = card.name
      name = name.replace('[x]', '').trim()
      const update = {
        id: cardId,
        name,
        nameUpdatedAt: new Date()
      }
      context.dispatch('update', { card: update })
      nextTick(() => {
        context.dispatch('updateDimensions', { cards: [card] })
      })
    },
    updateURLQueryStrings: (context, { cardId }) => {
      setTimeout(() => {
        const card = context.getters.byId(cardId)
        const urls = utils.urlsFromString(card.name)
        if (!urls) { return }
        let name = card.name
        name = utils.removeTrackingQueryStringsFromURLs(name)
        name = utils.removeTrailingSlash(name)
        const update = {
          id: cardId,
          name
        }
        context.dispatch('update', { card: update })
      }, 100)
    },

    // dimensions

    updateDimensions: (context, { cards }) => {
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      if (!cards) {
        cards = context.getters.all
      }
      nextTick(() => {
        let updates = {
          cards: [],
          spaceId: context.rootState.currentSpace.id
        }
        let cardIds = cards.map(newCard => newCard.id)
        cardIds = cardIds.filter(cardId => Boolean(cardId))
        if (!cardIds) { return }
        context.commit('shouldExplicitlyRenderCardIds', cardIds, { root: true })
        const updatedCards = cards.filter(card => Boolean(card))
        updatedCards.forEach(card => {
          const prevDimensions = {
            width: card.width,
            height: card.height
          }
          const element = document.querySelector(`article#card[data-card-id="${card.id}"]`)
          if (!element) { return }
          const isCardRenderedInDOM = element.dataset.shouldRender === 'true'
          if (isCardRenderedInDOM) {
            const rect = element.getBoundingClientRect()
            card = {
              id: card.id,
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            }
          } else {
            card = utils.cardElementDimensions(card)
          }
          if (!card) { return }
          const dimensionsChanged = card.width !== prevDimensions.width || card.height !== prevDimensions.height
          const isMissingDimensions = utils.isMissingDimensions(card)
          if (!dimensionsChanged) { return }
          if (isMissingDimensions) { return }
          const body = {
            id: card.id,
            width: card.width,
            height: card.height,
            userId: context.rootState.currentUser.id
          }
          context.commit('update', body)
          context.dispatch('updateTallestCardHeight', card)
          context.dispatch('broadcast/update', { updates: body, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
          updates.cards.push(body)
        })
        if (canEditSpace) {
          context.dispatch('api/addToQueue', { name: 'updateMultipleCards', body: updates }, { root: true })
        }
      })
    },
    resetDimensions: (context, { cardIds, cardId }) => {
      if (cardId) {
        context.dispatch('removeResize', { cardIds: [cardId] })
      } else if (cardIds) {
        context.dispatch('removeResize', { cardIds: cardIds })
      }
    },
    updateTallestCardHeight: (context, card) => {
      nextTick(() => {
        if (!card.height) {
          card = utils.cardElementDimensions(card)
        }
        const height = card.height
        if (height > tallestCardHeight) {
          tallestCardHeight = Math.ceil(height)
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
        context.dispatch('update', { card: updates })
        context.dispatch('broadcast/update', { updates, type: 'resizeCard', handler: 'currentCards/update' }, { root: true })
        context.dispatch('currentConnections/updateMultiplePaths', [card], { root: true })
      })
    },
    removeResize: (context, { cardIds, shouldRemoveResizeWidth }) => {
      let updates = []
      cardIds.forEach(cardId => {
        let body = { id: cardId, width: null }
        if (shouldRemoveResizeWidth) {
          body.resizeWidth = null
        }
        updates.push(body)
        utils.removeAllCardDimensions({ id: cardId })
      })
      context.dispatch('updateMultiple', updates)
      const cards = cardIds.map(cardId => {
        return { id: cardId }
      })
      context.dispatch('updateDimensions', { cards })
      nextTick(() => {
        nextTick(() => {
          let connections = context.rootGetters['currentConnections/byMultipleItemIds'](cardIds)
          connections = utils.clone(connections)
          context.dispatch('currentConnections/updatePaths', { connections }, { root: true })
        })
      })
    },

    // tilt

    tilt: (context, { cardIds, delta }) => {
      const maxDegrees = 25
      cardIds.forEach(cardId => {
        const card = context.getters.byId(cardId)
        let tilt = card.tilt || 0
        tilt = tilt + delta
        tilt = Math.min(maxDegrees, tilt)
        tilt = Math.max(-maxDegrees, tilt)
        const updates = { id: cardId, tilt }
        context.dispatch('update', { card: updates })
        context.dispatch('broadcast/update', { updates, type: 'tiltCard', handler: 'currentCards/update' }, { root: true })
        const connections = context.rootGetters['currentConnections/byItemId'](cardId)
        context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
      })
    },
    removeTilt: (context, { cardIds }) => {
      cardIds.forEach(cardId => {
        const body = { id: cardId, tilt: 0 }
        context.dispatch('update', { card: body })
        utils.removeAllCardDimensions({ id: cardId })
        const cards = [{ id: cardId }]
        context.dispatch('updateDimensions', { cards })
      })
    },

    // move

    move: (context, { endCursor, prevCursor, delta }) => {
      const spaceId = context.rootState.currentSpace.id
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
      cards = cards.filter(card => Boolean(card))
      if (!cards.length) { return }
      cards = cards.filter(card => context.rootGetters['currentUser/canEditCard'](card))
      // prevent cards bunching up at 0
      cards.forEach(card => {
        if (!card) { return }
        if (card.x === 0) { delta.x = Math.max(0, delta.x) }
        if (card.y === 0) { delta.y = Math.max(0, delta.y) }
        connections = connections.concat(context.rootGetters['currentConnections/byItemId'](card.id))
      })
      cards = cards.filter(card => Boolean(card))
      // update card position
      cards = utils.clone(cards)
      prevMoveDelta = {
        x: prevMoveDelta.x + delta.x,
        y: prevMoveDelta.y + delta.y
      }
      cards = cards.map(card => {
        let position
        // x
        const isNoX = card.x === undefined || card.x === null
        if (isNoX) {
          delete card.x
        } else {
          card.x = Math.max(0, card.x + prevMoveDelta.x)
          context.dispatch('checkIfShouldIncreasePageWidthWhileDragging', card)
        }
        // y
        const isNoY = card.y === undefined || card.y === null
        if (isNoY) {
          delete card.y
        } else {
          card.y = Math.max(consts.defaultCardHeight, card.y + prevMoveDelta.y)
          context.dispatch('checkIfShouldIncreasePageHeightWhileDragging', card)
        }
        card = {
          x: Math.round(card.x),
          y: Math.round(card.y),
          z: card.z,
          id: card.id,
          width: card.width,
          height: card.height
        }
        utils.updateCardDimensionsDataWhileDragging(card)
        return card
      })
      // update
      context.commit('moveWhileDragging', { cards })
      connections = uniqBy(connections, 'id')
      context.commit('cardsWereDragged', true, { root: true })
      context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
      context.dispatch('broadcast/update', { updates: { cards }, type: 'moveCards', handler: 'currentCards/moveWhileDragging' }, { root: true })
    },
    checkIfShouldIncreasePageWidthWhileDragging: (context, card) => {
      const cardEnd = card.x + card.width
      if (cardEnd >= context.rootState.pageWidth) {
        context.commit('pageWidth', cardEnd, { root: true })
      }
    },
    checkIfShouldIncreasePageHeightWhileDragging: (context, card) => {
      const cardEnd = card.y + card.height
      if (cardEnd >= context.rootState.pageHeight) {
        context.commit('pageHeight', cardEnd, { root: true })
      }
    },
    afterMove: (context) => {
      const spaceId = context.rootState.currentSpace.id
      // update cards
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const currentDraggingCard = context.getters.byId(currentDraggingCardId)
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      let cards
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
        const { x, y, z } = card
        return { id, x, y, z }
      })
      cards = cards.filter(card => Boolean(card))
      cards = cards.map(card => {
        card.x = Math.max(card.x + prevMoveDelta.x, 0)
        card.x = Math.round(card.x)
        card.y = Math.max(card.y + prevMoveDelta.y, 0)
        card.y = Math.round(card.y)
        card.userId = context.rootState.currentUser.id
        return card
      })
      context.dispatch('incrementSelectedZs')
      context.commit('move', { cards, spaceId })
      cards = cards.filter(card => card)
      context.dispatch('api/addToQueue', {
        name: 'updateMultipleCards',
        body: { cards, spaceId }
      }, { root: true })
      // update connections
      const cardIds = cards.map(card => card.id)
      // broadcast changes
      context.dispatch('broadcast/update', { updates: { cards }, type: 'moveCards', handler: 'currentCards/moveBroadcast' }, { root: true })
      context.commit('broadcast/updateStore', { updates: { userId: context.rootState.currentUser.id }, type: 'clearRemoteCardsDragging' }, { root: true })
      // ..
      nextTick(() => {
        context.dispatch('currentConnections/updateMultiplePaths', cards, { root: true })
        context.dispatch('history/resume', null, { root: true })
        context.dispatch('history/add', { cards, useSnapshot: true }, { root: true })
        context.dispatch('updatePageSizes', null, { root: true })
        prevMoveDelta = { x: 0, y: 0 }
      })
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
          card = utils.cardElementDimensions(card)
          card = {
            name: card.name,
            id: card.id,
            y: card.y,
            width: card.width,
            height: card.height
          }
          context.dispatch('update', { card })
        })
      })
    },

    // z-index

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
      const cards = context.getters.all
      const maxInt = Number.MAX_SAFE_INTEGER - 1000
      let highestCardZ = utils.highestCardZ(cards)
      if (highestCardZ > maxInt) {
        context.dispatch('clearAllZs')
        highestCardZ = 1
      }
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      const body = { id, z: highestCardZ + 1 }
      context.commit('update', body)
      if (!canEditSpace) { return }
      context.dispatch('api/addToQueue', { name: 'updateCard', body }, { root: true })
      context.dispatch('broadcast/update', { updates: body, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
    },
    incrementSelectedZs: (context) => {
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      if (multipleCardsSelectedIds.length) {
        // calculate the highest z once
        let cards = context.getters.all
        const maxInt = Number.MAX_SAFE_INTEGER - 1000
        let highestCardZ = utils.highestCardZ(cards)
        if (highestCardZ > maxInt) {
          context.dispatch('clearAllZs')
          highestCardZ = 1
        }
        const newHighestCardZ = highestCardZ + 1
        // update all selected
        const spaceId = context.rootState.currentSpace.id
        cards = multipleCardsSelectedIds.map(cardId => {
          return {
            id: cardId,
            z: newHighestCardZ,
            spaceId
          }
        })
        context.dispatch('api/addToQueue', {
          name: 'updateMultipleCards',
          body: { cards, spaceId }
        }, { root: true })
        // broadcast
        multipleCardsSelectedIds.forEach(id => {
          const body = { id, z: newHighestCardZ }
          if (!canEditSpace) { return }
          context.dispatch('broadcast/update', { updates: body, type: 'updateCard', handler: 'currentCards/update' }, { root: true })
        })
      } else {
        context.dispatch('incrementZ', currentDraggingCardId)
      }
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
      context.dispatch('currentConnections/removeFromItem', card, { root: true })
      context.commit('triggerUpdateHeaderAndFooterPosition', null, { root: true })
      const cardIsUpdatedByCurrentUser = card.userId === context.rootState.currentUser.id
      if (cardIsUpdatedByCurrentUser) {
        context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
          cards: [card],
          shouldDecrement: true
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

    // select

    updateCanBeSelectedSortedByY: (context) => {
      // remove unselectable
      const commentsAreHidden = context.state.filterComments
      let cards = context.getters.all
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
      canBeSelectedSortedByY = result
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
      context.dispatch('closeAllDialogs', null, { root: true })
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
        const startItemId = cards[index - 1].id
        const endItemId = cards[index].id
        connections.push({
          id: nanoid(),
          startItemId,
          endItemId,
          path: this.$store.getters['currentConnections/connectionPathBetweenItems']({ startItemId, endItemId })
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
      const cards = getters.all
      return cards.filter(card => !card.isLocked)
    },
    isLocked: (state, getters) => {
      const cards = getters.all
      return cards.filter(card => card.isLocked)
    },
    isComment: (state, getters) => (card) => {
      return card.isComment || utils.isNameComment(card.name)
    },
    isBelowY: (state, getters) => (y, zoom) => {
      zoom = zoom || 1
      const cards = getters.all
      return cards.filter(card => (card.y * zoom) > y)
    },
    isRightOfX: (state, getters) => (x, zoom) => {
      zoom = zoom || 1
      const cards = getters.all
      return cards.filter(card => (card.x * zoom) > x)
    },
    canBeSelectedSortedByY: (state, getters) => {
      return canBeSelectedSortedByY
    },
    isSelectableInViewport: (state, getters, rootState, rootGetters) => () => {
      const elements = document.querySelectorAll(`article#card`)
      let cards = []
      elements.forEach(element => {
        if (element.dataset.isVisibleInViewport === 'false') { return }
        if (element.dataset.isLocked === 'true') { return }
        const cardData = getters.byId(element.dataset.cardId)
        const rect = element.getBoundingClientRect()
        const card = {
          id: cardData.id,
          x: cardData.x,
          y: cardData.y,
          width: Math.round(rect.width || cardData.width),
          height: Math.round(rect.height || cardData.height),
          tilt: cardData.tilt
        }
        cards.push(card)
      })
      return cards
    },
    isSelectable: (state, getters, rootState) => (position) => {
      const threshold = tallestCardHeight
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
      if (!yIndex) { return [] }
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
    isSelectedIds: (state, getters) => {
      let cards = getters.isSelected
      cards = cards.filter(card => Boolean(card))
      const cardIds = cards.map(card => card.id)
      return cardIds
    },
    linkedItems: (state, getters) => {
      let cardIds = []
      let spaceIds = []
      let invites = []
      const cards = getters.all
      cards.forEach(card => {
        const cardIdIsValid = utils.idIsValid(card.linkToCardId)
        const collaboratorKeyIsValid = utils.idIsValid(card.linkToSpaceCollaboratorKey)
        const spaceIdIsValid = utils.idIsValid(card.linkToSpaceId)
        if (collaboratorKeyIsValid && spaceIdIsValid) {
          invites.push({ spaceId: card.linkToSpaceId, collaboratorKey: card.linkToSpaceCollaboratorKey })
        } else if (cardIdIsValid) {
          cardIds.push(card.linkToCardId)
        } else if (spaceIdIsValid) {
          spaceIds.push(card.linkToSpaceId)
        }
      })
      return { cardIds, spaceIds, invites }
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
    otherContributors: (state, getters, rootState, rootGetters) => {
      const currentUserId = state.id
      let items = getters.users
      items = items.filter(user => Boolean(user))
      // remove currentUser
      items = items.filter(user => user.id !== currentUserId)
      // remove collaborators
      const members = rootGetters['currentSpace/members']()
      items = items.filter(item => {
        const member = members.find(user => {
          return user.id === item.id
        })
        return !member
      })
      return items
    },
    colors: (state, getters) => {
      const cards = getters.all
      let colors = cards.map(card => card.backgroundColor)
      colors = colors.filter(color => Boolean(color))
      return uniq(colors)
    },
    nameSegments: (state, getters) => (card) => {
      let name = card.name
      let url = utils.urlFromString(name)
      let imageUrl
      if (utils.urlIsImage(url)) {
        imageUrl = url
        name = name.replace(url, '')
      }
      let segments = utils.cardNameSegments(name)
      if (imageUrl) {
        segments.unshift({
          isImage: true,
          url: imageUrl
        })
      }
      card.nameSegments = segments.map(segment => {
        if (!segment.isTag) { return segment }
        segment.color = getters.segmentTagColor(segment)
        return segment
      })
      return card
    },
    segmentTagColor: (state, getters, rootState, rootGetters) => (segment) => {
      const spaceTag = rootGetters['currentSpace/tagByName'](segment.name)
      const cachedTag = cache.tagByName(segment.name)
      if (spaceTag) {
        return spaceTag.color
      } else if (cachedTag) {
        return cachedTag.color
      } else {
        return rootState.currentUser.color
      }
    },
    selectedCardsPositions: (state, getters) => () => {
      const cardIds = getters.isSelectedIds
      let cards = cardIds.map(id => {
        const element = document.querySelector(`article[data-card-id="${id}"]`)
        if (!element) { return }
        const x = parseInt(element.style.left)
        const y = parseInt(element.style.top)
        return { id, x, y }
      })
      cards = cards.filter(card => Boolean(card))
      return cards
    }
  }
}

export default currentCards
