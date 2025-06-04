import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserNotificationStore } from '@/stores/useUserNotificationStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
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
    getAllCards () {
      let cards = this.allIds.map(id => this.byId[id])
      cards = cards.filter(card => !card.isRemoved)
      return cards
    },
    getAllCardsSortedByX () {
      let cards = this.allIds.map(id => this.byId[id])
      cards = cards.filter(card => !card.isRemoved)
      cards = sortBy(cards, 'x')
      return cards
    },
    getAllCardsSortedByY () {
      let cards = this.allIds.map(id => this.byId[id])
      cards = cards.filter(card => !card.isRemoved)
      cards = sortBy(cards, 'y')
      return cards
    },
    getAllRemovedCards () {
      let cards = this.allIds.map(id => this.byId[id])
      cards = cards.filter(card => card.isRemoved)
      return cards
    },
    getCardsSelectableByY () {
      let cards = this.allIds.map(id => this.byId[id])
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
    getCardsIsLocked () {
      const cards = this.allIds.map(id => this.byId[id])
      return cards.filter(card => card.isLocked && !card.isRemoved)
    },
    getCardsIsNotLocked () {
      const cards = this.allIds.map(id => this.byId[id])
      return cards.filter(card => !card.isLocked && !card.isRemoved)
    },
    getCardsSelected () {
      let ids = store.state.multipleCardsSelectedIds
      if (!ids.length) {
        ids = [store.state.currentDraggingCardId]
      }
      ids = ids.filter(id => Boolean(id))
      const cards = ids.map(id => this.byId[id])
      return cards
    },
    getCardCommenters () {
      const spaceStore = useSpaceStore()
      let users = []
      let cards = this.allIds.map(id => this.byId[id])
      cards = cards.filter(card => !card.isRemoved)
      cards.forEach(card => {
        users.push(card.userId)
        users.push(card.nameUpdatedByUserId)
      })
      users = uniq(users)
      users = users.map(id => spaceStore.getSpaceUserById(id))
      users = users.filter(user => Boolean(user))
      return users
    },
    getCardsWithSpaceOrInviteLinks () {
      const cardIds = []
      const spaceIds = []
      const invites = []
      let cards = this.allIds.map(id => this.byId[id])
      cards = cards.filter(card => !card.isRemoved)
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
    getCardColors () {
      const cards = this.getAllCards
      let colors = cards.map(card => card.backgroundColor)
      colors = colors.filter(color => Boolean(color))
      return uniq(colors)
    }

  },

  actions: {

    getCard (id) {
      return this.byId[id]
    },
    getIsCardComment (card) {
      return card.isComment || utils.isNameComment(card.name)
    },
    getVerticallyAlignedCardsBelow (cards, id, deltaHeight = 0) {
      const card = this.byId[id]
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
    },
    getCardsBelowY (y, zoom = 1, cards) {
      let i = 0
      while (i < cards.length && (cards[i].y * zoom) <= y) {
        i++
      }
      return cards.slice(i)
    },
    getCardsAboveY (y, zoom = 1, cards) {
      let i = 0
      while (i < cards.length && (cards[i].y * zoom) <= y) {
        i++
      }
      return cards.slice(0, i)
    },
    getCardsRightOfX (x, zoom = 1, cards) {
      let i = 0
      while (i < cards.length && (cards[i].x * zoom) <= x) {
        i++
      }
      return cards.slice(i)
    },
    getCardsLeftOfX (x, zoom = 1, cards) {
      let i = 0
      while (i < cards.length && (cards[i].x * zoom) <= x) {
        i++
      }
      return cards.slice(0, i)
    },
    getCardsSelectableInViewport () {
      const elements = document.querySelectorAll('.card-wrap')
      const cards = []
      elements.forEach(element => {
        if (element.dataset.isVisibleInViewport === 'false') { return }
        if (element.dataset.isLocked === 'true') { return }
        const id = element.dataset.cardId
        const data = this.getCard(id)
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

    // init

    clear () {
      this.byId = []
      this.allIds = {}
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
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const { x, y, z, position, isParentCard, name, id, backgroundColor, width, height } = card
      const cards = this.getAllCards
      const highestCardZ = utils.highestItemZ(cards)
      const defaultBackgroundColor = userStore.defaultCardBackgroundColor
      const isComment = store.state.isCommentMode || userStore.getUserIsCommentOnly
      card.id = id || nanoid()
      card.x = x || position.x
      card.y = y || position.y
      card.z = z || highestCardZ + 1
      card.name = name || ''
      card.frameId = 0
      card.userId = userStore.id
      card.urlPreviewIsVisible = true
      card.width = Math.round(width) || consts.emptyCard().width
      card.height = Math.round(height) || consts.emptyCard().height
      card.isLocked = false
      card.backgroundColor = backgroundColor || defaultBackgroundColor
      card.isRemoved = false
      card.headerFontId = userStore.prevHeaderFontId || 0
      card.maxWidth = Math.round(card.maxWidth) || userStore.cardSettingsMaxCardWidth
      card.spaceId = spaceStore.id // currentSpaceId
      card.isComment = isComment
      card.shouldShowOtherSpacePreviewImage = true
      return card
    },
    addCardToState (card) {
      this.byId[card.id] = card
      this.allIds.push(card.id)
    },
    async createCard (card, skipCardDetailsIsVisible) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const userNotificationStore = useUserNotificationStore()
      if (spaceStore.getShouldPreventAddCard) {
        store.commit('notifyCardsCreatedIsOverLimit', true, { root: true })
        return
      }
      card = this.normailzeNewCard(card)
      this.addCardToState(card)
      if (!skipCardDetailsIsVisible) {
        store.commit('cardDetailsIsVisibleForCardId', card.id, { root: true })
      }
      if (card.isParentCard) { store.commit('parentCardId', card.id, { root: true }) }
      userStore.updateUserCardsCreatedCount([card])
      spaceStore.checkIfShouldNotifyCardsCreatedIsNearLimit()
      userNotificationStore.addCardUpdated({ cardId: card.id, type: 'createCard' })
      // server/disk/save tasks TODO dry
      if (!card.isBroadcast) {
        store.dispatch('broadcast/update', { updates: card, storeName: 'cardStore', actionName: 'createCard' }, { root: true })
      }
      await apiStore.addToQueue({ name: 'createCard', body: card }, { root: true })
      await spaceStore.updateSpace({
        editedAt: new Date(),
        editedByUserId: userStore.id
      })
    },
    async createCards (cards, shouldOffsetPosition) {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
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
      await spaceStore.updateSpace({
        editedAt: new Date(),
        editedByUserId: userStore.id
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
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      updates = updates.filter(update => userStore.getUserCanEditCard(update))
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
      await apiStore.addToQueue({ name: 'updateMultipleCards', body: { cards: updates } }, { root: true })
      // TODO history? if unpaused
      await cache.updateSpace('cards', this.getAllCards, spaceStore.id)
      // update connection paths
      const connectionStore = useConnectionStore()
      const isNameUpdated = updates.find(update => Boolean(update.name))
      if (isNameUpdated) {
        const ids = updates.map(update => update.id)
        connectionStore.updateConnectionPaths(ids)
      }
    },

    // remove

    async deleteCards (cards) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      for (const card of cards) {
        const idIndex = this.allIds.indexOf(card.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[card.id]
        await apiStore.addToQueue({ name: 'deleteCard', body: card }, { root: true })
      }
    },
    async deleteCard (card) {
      await this.deleteCards([card])
    },
    async deleteAllRemovedCards () {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const spaceId = spaceStore.id
      const userId = userStore.id
      const cards = this.getAllRemovedCards
      await this.deleteCards(cards)
      await apiStore.addToQueue({ name: 'deleteAllRemovedCards', body: { userId, spaceId } }, { root: true })
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
      // ?await cache.updateSpace('removedCards', state.removedCards, currentSpaceId)
      const connectionStore = useConnectionStore()
      connectionStore.removeConnectionsFromItems(ids)
    },
    removeCard (id) {
      this.removeCards([id])
    },
    async restoreRemovedCard (card) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      card.isRemoved = false
      const isLocal = this.getCard(card.id)
      if (isLocal) {
        this.updateCard(card)
      } else {
        this.addCardToState(card)
        await cache.updateSpace('cards', this.getAllCards, spaceStore.id)
        await apiStore.addToQueue({ name: 'restoreRemovedCard', body: card }, { root: true })
        userStore.updateUserCardsCreatedCount([card])
      }
    },

    // position

    updatePageSize (card) {
      const cardY = card.y + card.height
      if (cardY >= store.state.pageHeight) {
        store.commit('pageHeight', cardY, { root: true })
      }
      const cardX = card.x + card.width
      if (cardX >= store.state.pageWidth) {
        store.commit('pageWidth', cardX, { root: true })
      }
    },
    moveCards ({ endCursor, prevCursor, delta }) {
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      const zoom = store.getters.spaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      endCursor = {
        x: endCursor.x * zoom,
        y: endCursor.y * zoom
      }
      if (store.state.shouldSnapToGrid) {
        prevCursor = utils.cursorPositionSnapToGrid(prevCursor)
        endCursor = utils.cursorPositionSnapToGrid(endCursor)
      }
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
          y: card.y + delta.y,
          width: card.width,
          height: card.height
        }
        this.updatePageSize(update)
        updates.push(update)
      })
      this.updateCards(updates)
      store.commit('cardsWereDragged', true, { root: true })
      const itemIds = updates.map(update => update.id)
      connectionStore.updateConnectionPaths(itemIds)
      boxStore.updateBoxSnapGuides(cards, true)
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
    incrementCardZ (id) {
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
        const cardIds = alignedCards.map(card => card.id)
        const connectionStore = useConnectionStore()
        connectionStore.updateConnectionPaths(cardIds)
      }
    },
    async updateCardsDimensions (ids) {
      const zoom = store.getters.spaceCounterZoomDecimal
      ids = ids || this.allIds
      let cards = ids.map(id => this.getCard(id))
      cards = cards.filter(card => Boolean(card))
      // cards = utils.clone(cards) // temp?
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
      this.incrementCardZ(id)
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
    clearCardChecked (id) {
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
      })
      this.updateCards(updates)
      const connectionStore = useConnectionStore()
      connectionStore.updateConnectionPaths(ids)
    },
    clearTiltCards (ids) {
      ids.forEach(id => {
        const update = { id, tilt: 0 }
        this.updateCard(update)
        utils.clearAllCardDimensions({ id })
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
        // store.dispatch('broadcast/update', { updates, type: 'resizeCard', handler: 'currentCards/update' }, { root: true })
      })
      const connectionStore = useConnectionStore()
      connectionStore.updateConnectionPaths(ids)
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
        utils.clearAllCardDimensions({ id })
      })
      this.updateCards(updates)
      this.updateCardsDimensions(ids)
      await nextTick()
      await nextTick()
      const connectionStore = useConnectionStore()
      connectionStore.updateConnectionPaths(ids)
    },

    // vote

    updateCardCounter ({ card, shouldIncrement, shouldDecrement }) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const isSignedIn = userStore.getUserIsSignedIn
      const update = {
        id: card.id,
        cardId: card.id,
        shouldIncrement,
        shouldDecrement
      }
      this.updateCard(update)
      if (!isSignedIn) {
        apiStore.updateCardCounter(update)
      }
    },

    // paste

    normalizeCardUrls (id) {
      setTimeout(() => {
        const card = this.getCard(id)
        const urls = utils.urlsFromString(card.name)
        if (!urls) { return }
        let name = card.name
        name = utils.clearTrackingQueryStringsFromUrls(name)
        name = utils.clearTrailingSlash(name)
        const update = { id, name }
        this.updateCard(update)
      }, 100)
    },
    async pasteCard (card, id) {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      card.id = id || nanoid()
      const spaceId = spaceStore.id
      card.spaceId = spaceId
      card.isCreatedThroughPublicApi = false
      const prevCards = this.getAllCards
      utils.uniqueCardPosition(card, prevCards)
      const tags = utils.tagsFromStringWithoutBrackets(card.name)
      if (tags) {
        tags.forEach(tag => {
          tag = store.getters.newTag({
            name: tag,
            defaultColor: userStore.color,
            cardId: card.id,
            spaceId
          }, { root: true })
          spaceStore.addTag(tag)
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
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const spaceTag = spaceStore.getSpaceTagByName(segment.name)
      const userTag = userStore.getUserTagByName(segment.name)
      if (spaceTag) {
        return spaceTag.color
      } else if (userTag) {
        return userTag.color
      } else {
        return userStore.color
      }
    },
    clearCardNameUploadPlaceholder (id) {
      const card = this.getCard(id)
      if (!card) { return }
      const name = card.name.replaceAll(consts.uploadPlaceholder, '')
      const update = {
        id,
        name
      }
      this.updateCard(update)
    },
    getCardsWithTagName (tagName) {
      const cards = this.getAllCards
      return cards.filter(card => {
        const tags = utils.tagsFromStringWithoutBrackets(card.name)
        if (tags) {
          return tags.includes(tagName)
        }
      })
    }

  }
})
