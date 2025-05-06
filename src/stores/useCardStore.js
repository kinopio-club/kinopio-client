import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import debounce from 'lodash/debounce'
import uniq from 'lodash/uniq'
import sortBy from 'lodash-es/sortBy'

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
    getCardsSelectableByY: (state) => {
      let cards = state.allIds.map(id => state.byId[id])
      // filter
      cards = cards.filter(card => {
        if (card.isLocked) { return }
        if (card.isRemoved) { return }
        if (store.state.filterComments && card.isComment) { return }
        return true
      })
      // sort by y
      cards = sortBy(cards, ['y'])
      const yIndex = []
      cards.forEach(card => yIndex.push(card.y))
      return {
        cards,
        yIndex
      }
    },
    getCardsSelectableInViewport: (state) => {
      const elements = document.querySelectorAll('.card-wrap')
      const cards = []
      elements.forEach(element => {
        if (element.dataset.isVisibleInViewport === 'false') { return }
        if (element.dataset.isLocked === 'true') { return }
        const id = element.dataset.cardId
        const data = state.byId[id]
        const rect = element.getBoundingClientRect()
        const card = {
          id: data.id,
          x: data.x,
          y: data.y,
          width: Math.round(rect.width || data.width),
          height: Math.round(rect.height || data.height),
          tilt: data.tilt
        }
        cards.push(card)
      })
      return cards
    },
    getCardsIsLocked: (state) => {
      const cards = state.allIds.map(id => state.byId[id])
      return cards.filter(card => card.isLocked && !card.isRemoved)
    },
    getCardsIsNotLocked: (state) => {
      const cards = state.allIds.map(id => state.byId[id])
      return cards.filter(card => !card.isLocked && !card.isRemoved)
    },
    getCardsBelowY: (state) => {
      return (y, zoom = 1, cards) => cards.filter(card => (card.y * zoom) > y)
    },
    getCardsAboveY: (state) => {
      return (y, zoom = 1, cards) => cards.filter(card => (card.y * zoom) < y)
    },
    getCardsRightOfX: (state) => {
      return (x, zoom = 1, cards) => cards.filter(card => (card.x * zoom) > x)
    },
    getCardsLeftOfX: (state) => {
      return (x, zoom = 1, cards) => cards.filter(card => (card.x * zoom) > x)
    },
    getCardsSelected: (state) => {
      let ids = store.state.multipleCardsSelectedIds
      if (!ids.length) {
        ids = [store.state.currentDraggingCardId]
      }
      ids = ids.filter(id => Boolean(id))
      const cards = ids.map(id => state.byId[id])
      return cards
    },
    getCardCommenters: (state) => {
      let users = []
      let cards = state.allIds.map(id => state.byId[id])
      cards = cards.filter(card => !card.isRemoved)
      cards.forEach(card => {
        users.push(card.userId)
        users.push(card.nameUpdatedByUserId)
      })
      users = uniq(users)
      users = users.map(id => store['currentSpace/userById'](id))
      users = users.filter(user => Boolean(user))
      return users
    }
  },

  actions: {

    // init

    clear () {
      this.byId = []
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
    },

    // create

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
    },
    async createCards (cards, shouldOffsetPosition) {
      cards = cards.map(card => {
        let x = card.x
        let y = card.y
        if (shouldOffsetPosition) {
          const offset = 100
          x += offset
          y += offset
        }
        card = this.normailzeNewCard(card)
        card.shouldUpdateUrlPreview = true
        card.urlPreviewIsVisible = true
      })
      cards.forEach(card => {
        this.createCard(card)
      })
    },

    // update

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
      updates = updates.filter(update => store.getters['currentUser/canEditCard'](update))
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

    // delete

    async deleteCards (cards) {
      const canEditSpace = store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      for (const card of cards) {
        const idIndex = this.allIds.indexOf(card.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[card.id]
        await store.dispatch('api/addToQueue', { name: 'deleteCard', body: card }, { root: true })
      }
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
    removeCard (id) {
      this.removeCards([id])
    },

    // position

    moveCards ({ endCursor, prevCursor, delta }) {
      if (!endCursor || !prevCursor) { return }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      const cards = this.getCardsSelected
      const updates = []
      cards.forEach(card => {
        const update = {
          id: card.id,
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
      let cards = ids.map(id => this.getCard(id))
      cards = cards.filter(card => Boolean(card))
      if (!cards.length) { return }
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
    async updateCardDimensions (id) {
      this.updateCardsDimensions([id])
    },

    // card details

    showCardDetails (id) {
      this.incrementCardsZ(id)
      store.commit('cardDetailsIsVisibleForCardId', id, { root: true })
      store.commit('parentCardId', id, { root: true })
      store.commit('loadSpaceFocusOnCardId', '', { root: true })
    },

    // checked

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
      this.updateCard(update)
    },
    removeCardChecked (id) {
      const card = this.getCard(id)
      let name = card.name
      name = name.replace('[x]', '').trim()
      const update = {
        id,
        name,
        nameUpdatedAt: new Date()
      }
      this.updateCard(update)
      this.updateCardDimensions(id)
    },

    // tilt

    tiltCards (ids, delta) {
      const maxDegrees = 25
      const updates = []
      ids.forEach(id => {
        const card = this.getCard(id)
        let tilt = card.tilt || 0
        tilt = tilt + delta
        tilt = Math.min(maxDegrees, tilt)
        tilt = Math.max(-maxDegrees, tilt)
        tilt = Math.round(tilt)
        updates.push({ id, tilt })
        // const connections = context.rootGetters['currentConnections/byItemId'](id)
        // context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
      })
      this.updateCards(updates)
    },
    clearTiltCards (ids) {
      ids.forEach(id => {
        const update = { id, tilt: 0 }
        this.updateCard(update)
        utils.removeAllCardDimensions({ id })
      })
      this.updateCardsDimensions(ids)
    },

    // resize

    resizeCards (ids, deltaX) {
      const minImageWidth = 64
      const updates = []
      ids.forEach(id => {
        const card = this.getCard(id)
        let width = card.resizeWidth || card.width
        width = width + deltaX
        width = Math.max(minImageWidth, width)
        width = Math.round(width)
        updates.push({ id, resizeWidth: width })
        // context.dispatch('broadcast/update', { updates, type: 'resizeCard', handler: 'currentCards/update' }, { root: true })
        // context.dispatch('currentConnections/updateMultiplePaths', [card], { root: true })
      })
      this.updateCards(updates)
    },
    async clearResizeCards (ids, shouldRemoveResizeWidth) {
      const updates = []
      ids.forEach(id => {
        const update = { id, width: null }
        if (shouldRemoveResizeWidth) {
          update.resizeWidth = null
        }
        updates.push(update)
        utils.removeAllCardDimensions({ id })
      })
      this.updateCards(updates)
      this.updateCardsDimensions(ids)
      // await nextTick()
      // await nextTick()
      // let connections = context.rootGetters['currentConnections/byMultipleItemIds'](cardIds)
      // connections = utils.clone(connections)
      // context.dispatch('currentConnections/updatePaths', { connections }, { root: true })
    },

    // vote

    updateCardCounter ({ card, shouldIncrement, shouldDecrement }) {
      const isSignedIn = store.getters['currentUser/isSignedIn']
      const update = {
        id: card.id,
        cardId: card.id,
        shouldIncrement,
        shouldDecrement
      }
      this.updateCard(update)
      if (!isSignedIn) {
        store.dispatch('api/updateCardCounter', update, { root: true })
      }
    },

    // paste

    normalizeCardUrls (id) {
      setTimeout(() => {
        const card = this.getCard(id)
        const urls = utils.urlsFromString(card.name)
        if (!urls) { return }
        let name = card.name
        name = utils.removeTrackingQueryStringsFromURLs(name)
        name = utils.removeTrailingSlash(name)
        const update = { id, name }
        this.updateCard(update)
      }, 100)
    },
    async pasteCard (card, id) {
      card.id = id || nanoid()
      const spaceId = store.state.currentSpace.id
      card.spaceId = spaceId
      card.isCreatedThroughPublicApi = false
      const prevCards = this.getAllCards
      utils.uniqueCardPosition(card, prevCards)
      const tags = utils.tagsFromStringWithoutBrackets(card.name)
      if (tags) {
        tags.forEach(tag => {
          tag = store.getters.newTag({
            name: tag,
            defaultColor: store.state.currentUser.color,
            cardId: card.id,
            spaceId
          }, { root: true })
          store.dispatch('currentSpace/addTag', tag, { root: true })
        })
      }
      this.createCard(card)
    },

    // name

    cardWithNameSegments (card) {
      let name = card.name
      const url = utils.urlFromString(name)
      let imageUrl
      if (utils.urlIsImage(url)) {
        imageUrl = url
        name = name.replace(url, '')
      }
      const segments = utils.cardNameSegments(name)
      if (imageUrl) {
        segments.unshift({
          isImage: true,
          url: imageUrl
        })
      }
      card.nameSegments = segments.map(segment => {
        if (!segment.isTag) { return segment }
        segment.color = this.cardSegmentTagColor(segment)
        return segment
      })
      return card
    },
    cardSegmentTagColor (segment) {
      const spaceTag = store.getters['currentSpace/tagByName'](segment.name)
      const userTag = store.getters['currentUser/tagByName'](segment.name)
      if (spaceTag) {
        return spaceTag.color
      } else if (userTag) {
        return userTag.color
      } else {
        return store.state.currentUser.color
      }
    }

  }
})
