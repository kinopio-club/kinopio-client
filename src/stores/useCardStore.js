import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'

import debounce from 'lodash/debounce'
import { nanoid } from 'nanoid'

let tallestCardHeight = 0

export const useCardStore = defineStore('cards', {
  state: () => ({
    byId: {},
    allIds: [],
    dirtyCardIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false
  }),

  getters: {
    getCard: (state) => {
      return (id) => state.byId[id]
    },
    getAllCards: (state) => {
      let cards = state.allIds.map(id => state.byId[id])
      cards = cards.filter(card => !card.isRemoved)
      return cards
    },
    getDirtyCards: (state) => {
      return Array.from(state.dirtyCardIds).map(id => state.byId[id])
    },
    getIsCardComment: (state) => {
      return (card) => card.isComment || utils.isNameComment(card.name)
    },
    getVerticallyAlignedCardsBelow: (state) => {
      return (cards, id, deltaHeight = 0) => {
        const card = state.byId[id]
        const parentCard = {
          y: card.y,
          x: card.x,
          height: card.height - deltaHeight
        }
        cards = cards.filter(card => {
          const isAlignedX = card.x === parentCard.x
          // utils.isBetween({
          //   value: card.x,
          //   min: parentCard.x - 10,
          //   max: parentCard.x + 10
          // })
          const isBelow = card.y > parentCard.y
          return isAlignedX && isBelow
        })
        // recursion: match cards alignedY successively
        const alignedCards = []
        let prevAlignedCard
        do {
          const parent = prevAlignedCard || parentCard
          const match = cards.find(card => {
            const isAlignedY = parent.y + parent.height + consts.spaceBetweenCards === card.y
            return isAlignedY
          })
          if (match) {
            prevAlignedCard = match
            alignedCards.push(match)
            cards = cards.filter(card => card.id !== match.id)
          } else {
            prevAlignedCard = null
          }
        } while (prevAlignedCard)
        return alignedCards
      }
    },
    getCardsIsNotLocked: (state) => {
      return (cards) => cards.filter(card => !card.isLocked)
    }
  },

  actions: {

    clear () {
      this.ids = []
      this.allIds = {}
      // state.removedCards = []
      tallestCardHeight = 0
    },
    initializeCards (cards) {
      const byId = {}
      const allIds = []
      cards.forEach(card => {
        byId[card.id] = card
        allIds.push(card.id)
      })
      this.byId = byId
      this.allIds = allIds
      tallestCardHeight = 0
      // console.log('🍍', cards, this.byId, this.allIds)
    },

    // async createCard (updates) {

    // },
    // create: (state, { card, shouldPreventCache }) => {
    //   if (!card.id) {
    //     console.warn('🚑 could not create card', card)
    //     return
    //   }
    //   state.ids.push(card.id)
    //   state.cards[card.id] = card
    //   if (shouldPreventCache) { return }
    //   cache.updateSpace('cards', state.cards, currentSpaceId)

    // server tasks
    // if (!updates.isBroadcast) {
    //   store.dispatch('broadcast/update', { updates, storeName: 'cardStore', actionName: 'updateCards' }, { root: true })
    // }
    // await store.dispatch('api/addToQueue', { name: 'updateMultipleCards', body: { cards: updates } }, { root: true })
    // // TODO history? if unpaused

    // },

    processPendingUpdates () {
      const updatedCards = {}
      this.pendingUpdates.forEach((updates, id) => {
        updatedCards[id] = {
          ...this.byId[id],
          ...updates
        }
      })
      // Batch state update
      this.byId = {
        ...this.byId,
        ...updatedCards
      }
      // Clear queues
      this.pendingUpdates.clear()
      this.dirtyCardIds.clear()
      this.isUpdating = false
    },
    updateCard (update) {
      this.updateCards([update])
    },
    async updateCards (updates) {
      const canEditSpace = store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      updates.forEach(({ id, ...changes }) => {
        this.pendingUpdates.set(id, {
          ...this.pendingUpdates.get(id) || {},
          ...changes
        })
        this.dirtyCardIds.add(id)
      })
      if (!this.isUpdating) {
        requestAnimationFrame(() => this.processPendingUpdates())
        this.isUpdating = true
      }
      // server tasks
      if (!updates.isBroadcast) {
        store.dispatch('broadcast/update', { updates, storeName: 'cardStore', actionName: 'updateCards' }, { root: true })
      }
      await store.dispatch('api/addToQueue', { name: 'updateMultipleCards', body: { cards: updates } }, { root: true })
      // TODO history? if unpaused
      // cache
    },
    async deleteCards (cards) {
      const canEditSpace = store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      for (const card of cards) {
        const idIndex = this.ids.indexOf(card.id)
        this.byId.splice(idIndex, 1)
        delete this.allIds[card.id]
        await store.dispatch('api/addToQueue', { name: 'deleteCard', body: card }, { root: true })
      }
    },

    // Convenience methods

    moveCards ({ ids, endCursor, prevCursor }) {
      if (!endCursor || !prevCursor) { return }
      const delta = {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      const updates = []
      ids.forEach(id => {
        const card = this.getCard(id)
        const update = {
          id,
          x: card.x + delta.x,
          y: card.y + delta.y
        }
        updates.push(update)
      })
      this.updateCards(updates)
    },
    clearAllCardsZ () {
      const cards = this.getAllCards
      const updates = cards.map(card => {
        return {
          id: card.id,
          z: 0
        }
      })
      this.updateCards(updates)
    },
    incrementCardsZ (id) {
      // highest z
      const cards = this.getAllCards
      const maxInt = Number.MAX_SAFE_INTEGER - 1000
      let highestZ = utils.highestItemZ(cards)
      if (highestZ > maxInt) {
        this.clearAllCardsZ()
        highestZ = 1
      }
      // update
      const updates = []
      let ids = store.state.multipleCardsSelectedIds
      if (!ids.length) {
        ids = [id]
      }
      ids.forEach(id => {
        const update = {
          id,
          z: highestZ + 1
        }
        updates.push(update)
      })
      this.updateCards(updates)
    },
    removeCards (ids) {
      const cardsToRemove = []
      const updates = []
      const cardsToDelete = []
      ids.forEach(id => {
        const card = this.getCard(id)
        if (card.name) {
          cardsToRemove.push(card)
        } else {
          cardsToDelete.push(card)
        }
      })
      cardsToRemove.forEach(card => {
        updates.push({
          id: card.id,
          isRemoved: true
        })
      })
      this.updateCards(updates)
      this.deleteCards(cardsToDelete)
      // store.dispatch('history/add', { cards, isRemoved: true }, { root: true })
      // await cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
    },
    showCardDetails (id) {
      this.incrementCardsZ(id)
      store.commit('cardDetailsIsVisibleForCardId', id, { root: true })
      store.commit('parentCardId', id, { root: true })
      store.commit('loadSpaceFocusOnCardId', '', { root: true })
    },
    toggleCardChecked (id, value) {
      const card = this.getCard(id)
      let { name } = card
      const checkbox = utils.checkboxFromString(name)
      name = name.replace(checkbox, '')
      if (value) {
        name = `[x] ${name}`
      } else {
        name = `[] ${name}`
      }
      const update = {
        id,
        name,
        nameUpdatedAt: new Date()
      }
      this.updateCards([update])
    },
    async updateTallestCardHeight (card) {
      await nextTick()
      if (!card.height) {
        card = utils.cardElementDimensions(card)
      }
      const height = card.height
      if (height > tallestCardHeight) {
        tallestCardHeight = Math.ceil(height)
      }
    },

    async distributeCardsVertically (cards) {
      const zoom = store.getters.spaceCounterZoomDecimal
      let prevCard
      let index = 0
      for (const card of cards) {
        if (index === 0) {
          prevCard = card
        } else {
          const prevCardElement = utils.cardElement(prevCard)
          const prevCardRect = prevCardElement.getBoundingClientRect()
          card.y = prevCard.y + (prevCardRect.height * zoom) + consts.spaceBetweenCards
          prevCard = card
        }
        const rect = utils.cardRectFromId(card.id)
        const update = {
          id: card.id,
          y: card.y,
          width: rect.width,
          height: rect.height
        }
        await this.updateCard(update)
        index += 1
      }
    },

    async updateBelowCardsPosition (updates) {
      for (const update of updates) {
        // calc height delta
        const card = this.getCard(update.id)
        if (!card) { return }
        const deltaHeight = update.height - update.prevHeight
        if (deltaHeight === 0) { return }
        // distributeVertically aligned cards below
        const cards = this.getAllCards
        const alignedCards = this.getVerticallyAlignedCardsBelow(cards, card.id, deltaHeight)
        if (!alignedCards.length) { return }
        alignedCards.unshift(card)
        await this.distributeCardsVertically(alignedCards)
        await store.dispatch('currentConnections/updateMultiplePaths', alignedCards, { root: true })
      }
    },

    async updateCardsDimensions (ids) {
      const zoom = store.getters.spaceCounterZoomDecimal
      ids = ids || this.allIds
      const cards = ids.map(id => this.getCard(id))
      await nextTick()
      const updatedCards = []
      store.commit('shouldExplicitlyRenderCardIds', ids, { root: true })
      const updates = []
      cards.forEach(card => {
        card.prevWidth = card.width
        card.prevHeight = card.height
        const element = utils.cardElement(card)
        if (!element) { return }
        const isCardRenderedInDOM = element.dataset.shouldRender === 'true'
        if (isCardRenderedInDOM) {
          const rect = element.getBoundingClientRect()
          card = {
            id: card.id,
            width: Math.round(rect.width * zoom),
            height: Math.round(rect.height * zoom)
          }
        } else {
          card = utils.cardElementDimensions(card)
        }
        const isUnchanged = card.width === card.prevWidth && card.height === card.prevHeight
        const isMissingDimensions = utils.isMissingDimensions(card)
        if (isUnchanged) { return }
        if (isMissingDimensions) { return }
        const body = {
          id: card.id,
          prevWidth: card.prevWidth,
          prevHeight: card.prevHeight,
          width: Math.round(card.width),
          height: Math.round(card.height)
        }
        updates.push(body)
        this.updateTallestCardHeight(card)
      })
      await this.updateCards(updates)
      await this.updateBelowCardsPosition(updates)
    },
    normailzeNewCard (card) {
      const { x, y, z, position, isParentCard, name, id, backgroundColor, width, height } = card
      const cards = this.getAllCards
      const highestCardZ = utils.highestItemZ(cards)
      const defaultBackgroundColor = store.state.currentUser.defaultCardBackgroundColor
      const isComment = store.state.isCommentMode || store.getters['currentUser/canOnlyComment']()
      card.id = id || nanoid()
      card.x = x || position.x
      card.y = y || position.y
      card.z = z || highestCardZ + 1
      card.name = name || ''
      card.frameId = 0
      card.userId = store.state.currentUser.id
      card.urlPreviewIsVisible = true
      card.width = Math.round(width) || consts.emptyCard().width
      card.height = Math.round(height) || consts.emptyCard().height
      card.isLocked = false
      card.backgroundColor = backgroundColor || defaultBackgroundColor
      card.isRemoved = false
      card.headerFontId = store.state.currentUser.prevHeaderFontId || 0
      card.maxWidth = Math.round(card.maxWidth) || store.state.currentUser.cardSettingsMaxCardWidth
      card.spaceId = store.state.currentSpace.id // currentSpaceId
      card.isComment = isComment
      card.shouldShowOtherSpacePreviewImage = true
      return card
    },
    async createCard (card, skipCardDetailsIsVisible) {
      if (store.getters['currentSpace/shouldPreventAddCard']) {
        store.commit('notifyCardsCreatedIsOverLimit', true, { root: true })
        return
      }
      card = this.normailzeNewCard(card)
      // update state
      this.byId[card.id] = card
      this.allIds.push(card.id)

      if (!skipCardDetailsIsVisible) {
        store.commit('cardDetailsIsVisibleForCardId', card.id, { root: true })
      }
      if (card.isParentCard) { store.commit('parentCardId', card.id, { root: true }) }
      store.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        cards: [card]
      }, { root: true })
      store.dispatch('currentSpace/checkIfShouldNotifyCardsCreatedIsNearLimit', null, { root: true })
      store.dispatch('userNotifications/addCardUpdated', { cardId: card.id, type: 'createCard' }, { root: true })
      // server/disk/save tasks TODO dry
      // await cache.updateSpace('editedAt', utils.unixTime(), store.state.currentSpace.id)
      if (!card.isBroadcast) {
        store.dispatch('broadcast/update', { updates: card, storeName: 'cardStore', actionName: 'createCard' }, { root: true })
      }
      await store.dispatch('api/addToQueue', { name: 'createCard', body: card }, { root: true })
    }

  }
})
