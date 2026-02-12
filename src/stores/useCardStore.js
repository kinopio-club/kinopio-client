import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserNotificationStore } from '@/stores/useUserNotificationStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useThemeStore } from '@/stores/useThemeStore'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
import uniq from 'lodash/uniq'
import sortBy from 'lodash-es/sortBy'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

let tallestCardHeight = 0

export const useCardStore = defineStore('cards', {
  state: () => ({
    byId: {},
    allIds: [],
    cardSnapGuides: [] // { side, origin, target }, { ... }
  }),

  getters: {
    getAllCards () {
      let cards = this.allIds.map(id => this.byId[id])
      cards = cards.filter(card => Boolean(card) && !card.isRemoved)
      return cards
    },
    getAllCardsSortedByX () {
      let cards = this.getAllCards
      cards = cards.filter(card => !card.isRemoved)
      cards = sortBy(cards, 'x')
      return cards
    },
    getAllCardsSortedByY () {
      let cards = this.getAllCards
      cards = cards.filter(card => !card.isRemoved)
      cards = sortBy(cards, 'y')
      return cards
    },
    getAllRemovedCards () {
      let cards = this.getAllCards
      cards = cards.filter(card => card.isRemoved)
      return cards
    },
    getCardsSelectableByY () {
      const globalStore = useGlobalStore()
      let cards = this.getAllCards
      // filter
      cards = cards.filter(card => {
        if (card.isLocked) { return }
        if (card.isRemoved) { return }
        if (globalStore.filterComments && card.isComment) { return }
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
      const cards = this.getAllCards
      return cards.filter(card => Boolean(card) && card.isLocked && !card.isRemoved)
    },
    getCardsIsNotLocked () {
      const cards = this.getAllCards
      return cards.filter(card => Boolean(card) && !card.isLocked && !card.isRemoved)
    },
    getCardsSelected () {
      const globalStore = useGlobalStore()
      let ids = globalStore.multipleCardsSelectedIds
      if (!ids.length) {
        ids = [globalStore.currentDraggingCardId]
      }
      ids = ids.filter(id => Boolean(id))
      const cards = ids.map(id => this.byId[id])
      return cards
    },
    getCardIdsGroupedByList () {
      const cards = this.getAllCards
      const result = {}
      for (const card of cards) {
        if (!card.listId) continue
        if (!result[card.listId]) {
          result[card.listId] = []
        }
        result[card.listId].push(card.id)
      }
      return result // { listId: [cardId1, cardId2], .. }
    },
    getCommentCards () {
      const cards = this.getAllCards.filter(card => {
        return card.isComment || utils.isNameComment(card.name)
      })
      return cards
    },
    getCommentCardUsers () {
      const spaceStore = useSpaceStore()
      let users = []
      const cards = this.getCommentCards
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
      let cards = this.getAllCards
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
    },
    getCardsInteracting () {
      const globalStore = useGlobalStore()
      const currentDraggingCardId = globalStore.currentDraggingCardId
      const multipleCardsSelectedIds = globalStore.multipleCardsSelectedIds
      let cards
      if (multipleCardsSelectedIds.length) {
        cards = multipleCardsSelectedIds
      } else {
        cards = [currentDraggingCardId]
      }
      cards = cards.map(cardId => this.getCard(cardId))
      cards = cards.filter(card => Boolean(card))
      return cards
    },
    getCardsIsTodoSortedByY () {
      let cards = this.getAllCards
      cards = cards.filter(card => !card.isRemoved)
      cards = sortBy(cards, 'y')
      return cards.filter(card => utils.checkboxFromString(card.name))
    },
    getCardsNearLeftEdge () {
      const cards = this.getAllCards
      return cards.filter(card => {
        return card.x <= consts.edgeThreshold
      })
    }
  },

  actions: {

    getCard (id) {
      return this.byId[id]
    },
    getCardsByList (listId) {
      const cardsByList = this.getCardIdsGroupedByList
      const cardIds = cardsByList[listId]
      if (!cardIds) { return [] }
      let cards = cardIds.map(id => this.getCard(id))
      cards = sortBy(cards, 'listPositionIndex')
      return cards
    },
    getIsCommentCard (card) {
      return card.isComment || utils.isNameComment(card.name)
    },
    getCurrentDraggingCard () {
      const globalStore = useGlobalStore()
      const cardId = globalStore.currentDraggingCardId
      return this.getCard(cardId)
    },
    getVerticallyAlignedCardsBelow (cardId, deltaHeight = 0) {
      let cards = this.getAllCardsSortedByX
      let parentCard = this.byId[cardId]
      parentCard = {
        y: parentCard.y,
        x: parentCard.x,
        height: parentCard.height - deltaHeight
      }
      cards = cards.filter(card => {
        const isAlignedX = card.x === parentCard.x
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
        const { tilt, listId, listPositionIndex } = data
        const rect = element.getBoundingClientRect()
        const card = {
          id: data.id,
          x: data.x,
          y: data.y,
          width: Math.round(rect.width || data.width),
          height: Math.round(rect.height || data.height),
          tilt,
          listId,
          listPositionIndex
        }
        cards.push(card)
      })
      return cards
    },

    // init

    initializeCards (cards = []) {
      const byId = {}
      const allIds = []
      cards.forEach(card => {
        card.backgroundColor = this.normalizeCardBackgroundColor(card.backgroundColor)
        byId[card.id] = card
        allIds.push(card.id)
      })
      this.byId = byId
      this.allIds = allIds
      tallestCardHeight = 0
    },
    async alignLeftAddedCardsInInbox () {
      const globalStore = useGlobalStore()
      const spaceStore = useSpaceStore()
      if (spaceStore.name !== 'Inbox') { return }
      let cards = this.getAllCardsSortedByY
      cards = cards.filter(card => card.x === consts.minItemXY)
      const selectedCardIds = cards.map(card => card.id)
      await this.updateCardsDimensions(selectedCardIds)
      setTimeout(() => {
        globalStore.multipleCardsSelectedIds = selectedCardIds
        this.distributeCardsVertically(cards)
        globalStore.multipleCardsSelectedIds = []
      }, 100)
    },
    initializeRemoteCards (remoteCards) {
      const localCards = utils.clone(this.getAllCards)
      const { updateItems, addItems, removeItems } = utils.syncItems(remoteCards, localCards)
      console.info('🎑 remote cards', { updateItems, addItems, removeItems })
      this.updateCardsState(updateItems)
      addItems.forEach(card => this.addCardToState(card))
      removeItems.forEach(card => this.removeCardFromState(card))
    },
    normalizeCardBackgroundColor (color) {
      const themeStore = useThemeStore()
      if (color) {
        const colorIsDefault = themeStore.isCardColorThemeDefault(color)
        if (colorIsDefault) {
          color = null
        }
      }
      return color
    },

    // create

    normalizeNewCard (card) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      if (card.isFromBroadcast) { return card }
      const { x, y, z, position, isParentCard, name, id, backgroundColor, width, height } = card
      const cards = this.getAllCards
      const highestCardZ = utils.highestItemZ(cards)
      const defaultBackgroundColor = userStore.defaultCardBackgroundColor
      const isComment = globalStore.isCommentMode || userStore.getUserIsCommentOnly
      card.id = id || nanoid()
      card.x = x || position.x
      card.y = y || position.y
      card.z = z || highestCardZ + 1
      card.name = name || ''
      card.frameId = 0
      card.userId = userStore.id
      card.urlIsHidden = true
      card.urlPreviewIsVisible = true
      card.width = Math.round(width) || consts.emptyCard().width
      card.height = Math.round(height) || consts.emptyCard().height
      card.isLocked = false
      card.backgroundColor = backgroundColor || defaultBackgroundColor
      card.backgroundColor = this.normalizeCardBackgroundColor(card.backgroundColor)
      card.isRemoved = false
      card.headerFontId = userStore.prevHeaderFontId || 0
      card.maxWidth = Math.round(card.maxWidth) || userStore.cardSettingsCardWrapWidth
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
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const userNotificationStore = useUserNotificationStore()
      if (spaceStore.getShouldPreventAddCard) {
        globalStore.updateNotifyCardsCreatedIsOverLimit(true)
        return
      }
      card = this.normalizeNewCard(card)
      this.addCardToState(card)
      if (card.isFromBroadcast) { return }
      if (!skipCardDetailsIsVisible) {
        globalStore.updateCardDetailsIsVisibleForCardId(card.id)
      }
      if (card.isParentCard) {
        globalStore.parentCardId = card.id
      }
      userStore.updateUserCardsCreatedCount([card])
      spaceStore.checkIfShouldNotifyCardsCreatedIsNearLimit()
      broadcastStore.update({ updates: card, store: 'cardStore', action: 'addCardToState' })
      await apiStore.addToQueue({ name: 'createCard', body: card })
      userNotificationStore.addCardUpdated({ cardId: card.id, type: 'createCard' })
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
        card = this.normalizeNewCard(card)
        card.shouldUpdateUrlPreview = true
        card.urlPreviewIsVisible = true
        return card
      })
      cards.forEach(card => {
        this.createCard(card)
      })
    },

    // update

    async updateCardsState (updates) {
      updates = updates.map(update => { // normalize
        if (update.backgroundColor) {
          update.backgroundColor = this.normalizeCardBackgroundColor(update.backgroundColor)
        }
        delete update.user
        return update
      })
      updates.forEach(update => {
        this.byId[update.id] = {
          ...this.byId[update.id],
          ...update
        }
      })
    },
    async updateCards (updates) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const connectionStore = useConnectionStore()
      try {
        this.updateCardsState(updates)
        if (!userStore.getUserCanEditSpace) { return }
        const ids = updates.map(update => update.id)
        connectionStore.updateConnectionPathsByItemIds(ids)
        broadcastStore.update({ updates, store: 'cardStore', action: 'updateCardsState' })
        for (const card of updates) {
          await apiStore.addToQueue({ name: 'updateCard', body: card })
        }
        let cards = this.getAllCards
        cards = utils.clone(cards)
        await cache.updateSpace('cards', cards, spaceStore.id)
      } catch (error) {
        console.error('🚒 updateCards', error, updates)
      }
    },
    updateCard (update) {
      this.updateCards([update])
    },

    // remove

    removeCardFromState (card) {
      const idIndex = this.allIds.indexOf(card.id)
      if (utils.isNullish(idIndex)) { return }
      this.allIds.splice(idIndex, 1)
      delete this.byId[card.id]
    },
    async deleteCards (cards) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      for (const card of cards) {
        this.removeCardFromState(card)
        broadcastStore.update({ updates: card, store: 'cardStore', action: 'removeCardFromState' })
        await apiStore.addToQueue({ name: 'deleteCard', body: card })
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
      await apiStore.addToQueue({ name: 'deleteAllRemovedCards', body: { userId, spaceId } })
    },
    removeCards (ids) {
      const connectionStore = useConnectionStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const listStore = useListStore()
      const updates = []
      const cardsToRemove = []
      const cardsToDelete = []
      const cards = ids.map(id => this.getCard(id))
      let listIds = []
      cards.forEach(card => {
        if (!card) { return }
        spaceStore.removeTagsByCard(card)
        if (card.listId) {
          listIds.push(card.listId)
        }
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
      connectionStore.removeConnectionsFromItems(ids)
      userStore.updateUserCardsCreatedCount(cards, true)
      listIds = uniq(listIds)
      listIds.forEach(listId => {
        const list = listStore.getList(listId)
        this.updateCardPositionsInList(list)
      })
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
        await apiStore.addToQueue({ name: 'restoreRemovedCard', body: card })
        userStore.updateUserCardsCreatedCount([card])
      }
    },

    // position

    updatePageSize (card) {
      if (!card) { return }
      const globalStore = useGlobalStore()
      const cardY = card.y + card.height
      if (cardY >= globalStore.pageHeight) {
        globalStore.pageHeight = cardY
      }
      const cardX = card.x + card.width
      if (cardX >= globalStore.pageWidth) {
        globalStore.pageWidth = cardX
      }
    },
    moveCards ({ endCursor, prevCursor, delta }) {
      const globalStore = useGlobalStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      const listStore = useListStore()
      const zoom = globalStore.getSpaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      if (globalStore.shouldSnapToGrid) {
        prevCursor = utils.cursorPositionSnapToGrid(prevCursor)
        endCursor = utils.cursorPositionSnapToGrid(endCursor)
      }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      delta = {
        x: delta.x * zoom,
        y: delta.y * zoom
      }
      let cards = this.getCardsSelected
      cards = cards.map(card => {
        let x = Math.round(card.x + delta.x)
        x = Math.max(0, x)
        let y = Math.round(card.y + delta.y)
        y = Math.max(0, y)
        return {
          id: card.id,
          x,
          y
        }
      })
      this.updatePageSize(cards[0])
      this.updateCards(cards)
      globalStore.cardsWereDragged = true
      cards = cards.map(card => this.getCard(card.id))
      boxStore.updateBoxSnapGuides({ items: cards, isChildren: true, cursor: endCursor })
      this.updateCardSnapGuides({ items: cards, cursor: endCursor })
      listStore.updateListSnapGuides(cards)
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
      const globalStore = useGlobalStore()
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
      let ids = globalStore.multipleCardsSelectedIds
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
    resetDimensions ({ cardIds, cardId }) {
      if (cardId) {
        this.clearResizeCards([cardId])
      } else if (cardIds) {
        this.clearResizeCards(cardIds)
      }
    },
    async distributeCardsVertically (cards) {
      const globalStore = useGlobalStore()
      const zoom = globalStore.getSpaceCounterZoomDecimal
      let prevCard
      let index = 0
      for (const card of cards) {
        if (index === 0) {
          prevCard = card
        } else {
          const prevCardElement = utils.cardElement(prevCard)
          const prevCardRect = prevCardElement.getBoundingClientRect()
          const prevCardHeight = prevCardRect.height || prevCard.height
          card.y = prevCard.y + (prevCardHeight * zoom) + consts.spaceBetweenCards
          prevCard = card
        }
        const rect = utils.cardRectFromId(card.id)
        const update = {
          id: card.id,
          y: card.y,
          width: rect.width,
          height: rect.height || card.height
        }
        await this.updateCard(update)
        index += 1
      }
    },
    async updateCardsBelowPosition (updates) {
      const listStore = useListStore()
      let listIds = []
      for (const update of updates) {
        // calc height delta
        const card = this.getCard(update.id)
        if (!card) { return }
        const deltaHeight = update.height - update.prevHeight
        if (deltaHeight === 0) { return }
        // skip lists
        if (card.listId) {
          listIds.push(card.listId)
          continue
        }
        // distributeVertically aligned cards below
        const alignedCards = this.getVerticallyAlignedCardsBelow(card.id, deltaHeight)
        if (!alignedCards.length) { return }
        alignedCards.unshift(card)
        await this.distributeCardsVertically(alignedCards)
        const cardIds = alignedCards.map(card => card.id)
        const connectionStore = useConnectionStore()
        connectionStore.updateConnectionPathsByItemIds(cardIds)
      }
      listIds = uniq(listIds)
      listIds.forEach(listId => {
        const list = listStore.getList(listId)
        this.updateCardPositionsInList(list)
      })
    },
    async updateCardsDimensions (ids) {
      const globalStore = useGlobalStore()
      const zoom = globalStore.getSpaceCounterZoomDecimal
      ids = ids || this.allIds
      let cards = ids.map(id => this.getCard(id))
      cards = cards.filter(card => Boolean(card))
      // cards = utils.clone(cards) // temp?
      if (!cards.length) { return }
      await nextTick()
      const updatedCards = []
      globalStore.updateShouldExplicitlyRenderCardIds(ids)
      const updates = []
      cards.forEach(card => {
        card.prevWidth = Math.round(card.width)
        card.prevHeight = Math.round(card.height)
        const element = utils.cardElement(card)
        if (!element) { return }
        const isCardRenderedInDOM = element.dataset.shouldRender === 'true'
        if (isCardRenderedInDOM) {
          const rect = element.getBoundingClientRect()
          card = {
            id: card.id,
            width: Math.round(rect.width * zoom),
            height: Math.round(rect.height * zoom),
            prevWidth: card.prevWidth,
            prevHeight: card.prevHeight
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
      await this.updateCardsBelowPosition(updates)
    },
    async updateCardDimensions (id) {
      await this.updateCardsDimensions([id])
    },

    // card details

    showCardDetails (id) {
      const globalStore = useGlobalStore()
      this.incrementCardZ(id)
      globalStore.updateCardDetailsIsVisibleForCardId(id)
      globalStore.parentCardId = id
      globalStore.loadSpaceFocusOnCardId = ''
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
    },

    // tilt

    tiltCards (ids, delta) {
      const maxDegrees = 90
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
    },
    clearTiltCards (ids) {
      ids.forEach(id => {
        const update = { id, tilt: 0 }
        this.updateCard(update)
        utils.clearAllCardDimensions({ id })
      })
    },

    // resize

    resizeCards (ids, deltaX) {
      const connectionStore = useConnectionStore()
      const broadcastStore = useBroadcastStore()
      const minImageWidth = 64
      const updates = []
      ids.forEach(id => {
        const card = this.getCard(id)
        let width = card.resizeWidth || card.width
        width = width + deltaX
        width = Math.max(minImageWidth, width)
        width = Math.round(width)
        updates.push({ id, resizeWidth: width })
      })
      this.updateCards(updates)
    },
    async clearResizeCards (ids, shouldRemoveResizeWidth) {
      const connectionStore = useConnectionStore()
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
      await this.updateCardsDimensions(ids)
      await nextTick()
      await nextTick()
      connectionStore.updateConnectionPathsByItemIds(ids)
    },

    // vote

    updateCardVote ({ card, shouldIncrement, shouldDecrement }) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const broadcastStore = useBroadcastStore()
      const update = {
        cardId: card.id,
        shouldIncrement,
        shouldDecrement
      }
      if (globalStore.getShouldPreventCardVote(update)) { return }
      this.updateCardsState([card])
      globalStore.updateCardVote(update)
      apiStore.updateCardCounter(update)
      broadcastStore.update({ updates: [card], store: 'cardStore', action: 'updateCardsState' })
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
      const globalStore = useGlobalStore()
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
          tag = globalStore.getNewTag({
            name: tag,
            defaultColor: userStore.color,
            cardId: card.id,
            spaceId
          })
          spaceStore.addTag(tag)
        })
      }
      this.createCard(card)
    },

    // name

    cardWithNameSegments (card, excludeCheckboxString) {
      let name = card.name
      if (!name) {
        card.nameSegments = []
        return card
      }
      if (excludeCheckboxString) {
        const checkbox = utils.checkboxFromString(name)
        name = name.replace(checkbox, '')
      }
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
    insertCardUploadPlaceholder (file, id) {
      const card = this.getCard(id)
      if (!card) { return }
      const isMatch = card.name.includes(file.name)
      if (!isMatch) { return }
      const name = card.name.replace(file.name, consts.uploadPlaceholder)
      const update = {
        id,
        name
      }
      this.updateCard(update)
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
      let cards = this.getAllCards
      cards = utils.clone(cards)
      return cards.filter(card => {
        const tags = utils.tagsFromStringWithoutBrackets(card.name)
        if (tags) {
          return tags.includes(tagName)
        }
      })
    },

    // list

    async updateCardPositionsInList (list) {
      const listStore = useListStore()
      const globalStore = useGlobalStore()
      if (!list) { return }
      const cards = this.getCardsByList(list.id)
      const updates = []
      const originY = list.y + consts.listInfoHeight
      cards.forEach((card, index) => {
        const update = {
          id: card.id,
          x: list.x + consts.listPadding,
          y: originY,
          height: card.height
        }
        if (index > 0) {
          const prevCard = updates[index - 1]
          update.y = prevCard.y + prevCard.height + consts.listPadding
        }
        updates.push(update)
      })
      this.updateCards(updates)
      listStore.updateListDimensions(list)
    },
    async prependCardToList (card, list) {
      let targetPositionIndex = null
      const cards = this.getCardsByList(list.id)
      if (cards.length) {
        targetPositionIndex = cards[0].listPositionIndex
      }
      await this.addCardsToList({ cards: [card], list, targetPositionIndex, shouldPrepend: true })
    },
    async addCardsToList ({ cards, list, targetPositionIndex = null, shouldPrepend = true }) {
      const globalStore = useGlobalStore()
      try {
        const ids = cards.map(card => card.id)
        await this.updateCardsDimensions(ids)
        // use prev listCards to determine sibling position
        const listCards = this.getCardsByList(list.id)
        const siblingPositionIndex = utils.listSiblingPositionIndex(listCards, targetPositionIndex, shouldPrepend)
        // get new cards positions
        let newPositionIndexes
        if (shouldPrepend) {
          newPositionIndexes = generateNKeysBetween(siblingPositionIndex, targetPositionIndex, cards.length)
        } else {
          newPositionIndexes = generateNKeysBetween(targetPositionIndex, siblingPositionIndex, cards.length)
        }
        // add cards to list
        const resizeWidth = utils.listChildWidth(list.resizeWidth)
        const updates = cards.map((card, index) => {
          return {
            id: card.id,
            listId: list.id,
            listPositionIndex: newPositionIndexes[index],
            tilt: 0,
            resizeWidth,
            width: resizeWidth
          }
        })
        globalStore.triggerIsSnappingToList()
        this.updateCards(updates)
        await nextTick()
        await this.updateCardsDimensions(ids)
        this.updateCardPositionsInList(list)
        globalStore.clearAllSelected()
      } catch (error) {
        console.error('🚒 addCardsToList', error)
      }
    },
    async removeCardsFromLists (cards) {
      const listStore = useListStore()
      let listIds = []
      const ids = cards.map(card => {
        if (card.listId) {
          listIds.push(card.listId)
        }
        return card.id
      })
      listIds = uniq(listIds)
      const updates = ids.map(id => {
        return {
          id,
          listId: null,
          listPositionIndex: null
        }
      })
      await this.updateCards(updates)
      await this.clearResizeCards(ids, true)
      await nextTick()
      for (const listId of listIds) {
        const list = listStore.getList(listId)
        await this.updateCardPositionsInList(list)
        listStore.updateListDimensions(list)
      }
    },
    cardsIsInListTogether (cards) {
      if (!cards.length) { return }
      const listId = cards[0].listId
      if (!listId) { return }
      const value = cards.every(card => card.listId === listId)
      return value
    },
    async toggleListCards (cards) {
      const globalStore = useGlobalStore()
      const listStore = useListStore()
      let list
      let listCards = []
      let listHasOtherCards = []

      if (this.cardsIsInListTogether(cards)) {
        list = listStore.getList(cards[0].listId)
      }
      if (list) {
        listCards = this.getCardsByList(list.id)
        listHasOtherCards = listCards.length !== cards.length
      }
      // move cards out of list
      if (this.cardsIsInListTogether(cards) && listHasOtherCards) {
        const x = list.x + list.resizeWidth + consts.listPadding
        const updates = cards.map(card => {
          return {
            id: card.id,
            x
          }
        })
        this.removeCardsFromLists(cards)
        this.updateCards(updates)
      // remove list
      } else if (this.cardsIsInListTogether(cards)) {
        listStore.removeList(list.id)
      // create list, add cards to list
      } else {
        const card = cards[0]
        const list = {
          id: nanoid(),
          y: card.y - consts.listInfoHeight,
          x: card.x - consts.listPadding
        }
        listStore.createList({ list })
        await nextTick()
        await this.addCardsToList({ cards, list, targetPositionIndex: null })
      }
      globalStore.clearMultipleSelected()
      globalStore.closeAllDialogs()
      globalStore.multipleSelectedActionsIsVisible = false
    },

    // snap guides

    createCardSnapGuide ({ side, item, targetCard, cursor }) {
      let time = Date.now()
      const prevGuide = this.cardSnapGuides.find(guide => guide.side === side)
      if (prevGuide) {
        time = prevGuide.time
      }
      let distance, sizeOutside
      // can only snap to target card top or bottom
      if (side === 'top') {
        const targetY = targetCard.y
        const distanceFromLeft = Math.abs(cursor.y - targetY)
        const distanceFromRight = Math.abs(cursor.y - (targetY + targetCard.width))
        distance = Math.min(distanceFromLeft, distanceFromRight)
        sizeOutside = Math.abs(targetY - item.y)
      } else if (side === 'bottom') {
        const targetY = targetCard.y + targetCard.height
        const distanceFromLeft = Math.abs(cursor.y - targetY)
        const distanceFromRight = Math.abs(cursor.y - (targetY + targetCard.width))
        distance = Math.min(distanceFromLeft, distanceFromRight)
        sizeOutside = Math.abs(targetY - (item.y + item.height))
      } else {
        return
      }
      return { side, item, target: targetCard, time, distance, sizeOutside }
    },
    updateCardSnapGuides ({ items, cursor }) {
      const globalStore = useGlobalStore()
      const listStore = useListStore()
      if (globalStore.preventItemSnapping) { return }
      if (!items.length) { return }
      if (globalStore.shouldSnapToGrid) { return }
      const snapThreshold = 10
      const spaceEdgeThreshold = 100
      const targetCards = this.getCardsSelectableInViewport()
      const prevSnapGuides = globalStore.snapGuides
      let snapGuides = []
      // find
      const card = this.getCard(globalStore.currentDraggingCardId) // only current dragging card can snap
      if (!card) { return }
      targetCards.forEach(target => {
        if (target.id === card.id) { return }
        const isTargetSelected = globalStore.multipleCardsSelectedIds.includes(target.id)
        if (isTargetSelected) { return }
        // assign card sides
        const cardLeft = card.x
        const cardRight = card.x + card.width
        const cardTop = card.y
        const cardBottom = card.y + card.height
        // assign target sides
        const targetLeft = target.x
        const targetRight = target.x + target.width
        const targetTop = target.y
        const targetBottom = target.y + target.height
        const targetIsMinX = target.x <= spaceEdgeThreshold
        const targetIsMinY = target.y <= spaceEdgeThreshold
        // card side is on target edge
        const cardIsOverTargetTop = utils.isBetween({ value: targetTop, min: cardTop, max: cardBottom })
        const cardIsOverTargetBottom = utils.isBetween({ value: targetBottom, min: cardTop, max: cardBottom })
        const cardIsOverTargetLeft = utils.isBetween({ value: targetLeft, min: cardLeft, max: cardRight })
        const cardIsOverTargetRight = utils.isBetween({ value: targetRight, min: cardLeft, max: cardRight })
        // card inside target
        const cardLeftIsInsideTarget = utils.isBetween({ value: cardLeft, min: targetLeft, max: targetRight })
        const cardRightIsInsideTarget = utils.isBetween({ value: cardRight, min: targetLeft, max: targetRight })
        const cardTopIsInsideTarget = utils.isBetween({ value: cardTop, min: targetTop, max: targetBottom })
        const cardBottomIsInsideTarget = utils.isBetween({ value: cardBottom, min: targetTop, max: targetBottom })
        // card is in list if snapping to list
        let cardIsValidListSnap = true
        if (listStore.listSnapGuides.listId) {
          cardIsValidListSnap = listStore.listSnapGuides.listId === card.listId
        }
        const isSnapTop = cardIsOverTargetTop && (cardLeftIsInsideTarget || cardRightIsInsideTarget) && cardIsValidListSnap
        const isSnapBottom = cardIsOverTargetBottom && (cardLeftIsInsideTarget || cardRightIsInsideTarget) && cardIsValidListSnap
        // snap top
        if (isSnapTop) {
          const snapGuide = this.createCardSnapGuide({ side: 'top', item: card, targetCard: target, cursor })
          snapGuides.push(snapGuide)
        }
        // snap bottom
        if (isSnapBottom) {
          const snapGuide = this.createCardSnapGuide({ side: 'bottom', item: card, targetCard: target, cursor })
          snapGuides.push(snapGuide)
        }
      })
      if (!snapGuides.length) {
        this.cardSnapGuides = []
        return
      }
      snapGuides = sortBy(snapGuides, ['distance'])
      // limit snap to closest target
      snapGuides = [snapGuides[0]]
      this.cardSnapGuides = snapGuides
    }
  }

})
