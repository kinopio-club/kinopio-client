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
import last from 'lodash-es/last'
import { generateNKeysBetween } from 'fractional-indexing'

/**
 * @import {Segment, Position, CardList, Card, CardUpdate, CardStoreState, User, SnapGuide} from "./useCardStore"
 */

let tallestCardHeight = 0

export const useCardStore = defineStore('cards', {
  /** @return {CardStoreState} */
  state: () => ({
    byId: {},
    allIds: [],
    cardSnapGuides: [] // { side, origin, target }, { ... }
  }),

  getters: {
    /** @return {Card[]} */
    getAllCards () {
      let cards = this.allIds.map(id => this.byId[id])
      cards = cards.filter(card => Boolean(card) && !card.isRemoved)
      return cards
    },
    /** @return {Card[]} */
    getAllCardsSortedByX () {
      let cards = this.getAllCards
      cards = cards.filter(card => !card.isRemoved)
      cards = sortBy(cards, 'x')
      return cards
    },
    /** @return {Card[]} */
    getAllCardsSortedByY () {
      let cards = this.getAllCards
      cards = cards.filter(card => !card.isRemoved)
      cards = sortBy(cards, 'y')
      return cards
    },
    /** @return {Card[]} */
    getAllRemovedCards () {
      let cards = this.getAllCards
      cards = cards.filter(card => card.isRemoved)
      return cards
    },
    /** @return {{cards: Card[], yIndex: number[]}} */
    getCardsSelectableByY () {
      let cards = this.getAllCards
      // filter
      cards = cards.filter(card => {
        if (card.isLocked) { return }
        if (card.isRemoved) { return }
        return true
      })
      // sort by y
      cards = sortBy(cards, ['y'])
      /** @type {number[]} */
      const yIndex = []
      cards.forEach(card => yIndex.push(card.y))
      return {
        cards,
        yIndex
      }
    },
    /** @return {Card[]} */
    getCardsIsLocked () {
      const cards = this.getAllCards
      return cards.filter(card => Boolean(card) && card.isLocked && !card.isRemoved)
    },
    /** @return {Card[]} */
    getCardsIsNotLocked () {
      const cards = this.getAllCards
      return cards.filter(card => Boolean(card) && !card.isLocked && !card.isRemoved)
    },
    /** @return {Card[]} */
    getCardsSelected () {
      const globalStore = useGlobalStore()
      /** @type {string[]} */
      let ids = globalStore.multipleCardsSelectedIds
      if (!ids.length) {
        ids = [globalStore.currentDraggingCardId]
      }
      ids = ids.filter(id => Boolean(id))
      const cards = ids.map(id => this.byId[id])
      return cards
    },
    /** @return {Card} */
    getCurrentDraggingCard () {
      const globalStore = useGlobalStore()
      const cardId = globalStore.currentDraggingCardId
      // TODO: This shows a type error as not being available. Maybe getters aren't supposed to use actions?
      return this.getCard(cardId)
    },
    /** @return {Object<string, string[]>} */
    getCardIdsGroupedByList () {
      const cards = this.getAllCards
      /** @type {Object<string, string[]>} */
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
    /** @return {Card[]} */
    getCommentCards () {
      const cards = this.getAllCards.filter(card => {
        return card.isComment || utils.isNameComment(card.name)
      })
      return cards
    },
    /** @return {string[]} */
    getCommentCardUsers () {
      const spaceStore = useSpaceStore()
      /** @type {string[]} */
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
      /** @type {string[]} */
      const cardIds = []
      /** @type {string[]} */
      const spaceIds = []
      /** @type {{spaceId: string, collaboratorKey: string}[]} */
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
    /** @return {string[]} */
    getCardColors () {
      const cards = this.getAllCards
      let colors = cards.map(card => card.backgroundColor)
      colors = colors.filter(color => Boolean(color))
      return /** @type {string[]} */ (uniq(colors))
    },
    /** @return {Card[]} */
    getCardsInteracting () {
      const globalStore = useGlobalStore()
      const currentDraggingCardId = globalStore.currentDraggingCardId
      /** @type {Card[]} */
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
    /** @return {Card[]} */
    getCardsIsTodoSortedByY () {
      let cards = this.getAllCards
      cards = cards.filter(card => !card.isRemoved)
      cards = sortBy(cards, 'y')
      return cards.filter(card => utils.checkboxFromString(card.name))
    },
    /** @return {Card[]} */
    getCardsNearLeftEdge () {
      const cards = this.getAllCards
      return cards.filter(card => {
        return card.x <= consts.edgeThreshold
      })
    },
    /** @return {Card[]} */
    getCardsNearTopEdge () {
      const cards = this.getAllCards
      return cards.filter(card => {
        return card.y <= consts.edgeThreshold
      })
    },
    /** @return {Card[]} */
    getCardsWithLinkToSpaceId () {
      const cards = this.getAllCards
      return cards.filter(card => card.linkToSpaceId)
    },
    getCardsAtUserMentionsCurrentUser () {
      const userStore = useUserStore()
      const cards = this.getAllCards
      return cards.filter(card => {
        return card.atUserMentions?.find(mention => mention.userId === userStore.id)
      })
    },
    getCardsAtDateMentions () {
      let cards = this.getAllCards
      cards = cards.filter(card => {
        return utils.arrayHasItems(card.atDateMentions)
      })
      cards = sortBy(cards, 'atDateMentions[0].date').reverse()
      return cards
    }
  },

  actions: {

    /**
     * @param {string} id
     * @return {Card}
     */
    getCard (id) {
      return this.byId[id]
    },
    /**
     * @param {string} listId
     * @return {Card[]}
     */
    getCardsByList (listId) {
      const cardsByList = this.getCardIdsGroupedByList
      const cardIds = cardsByList[listId]
      if (!cardIds) { return [] }
      let cards = cardIds.map(id => this.getCard(id))
      cards = sortBy(cards, 'listPositionIndex')
      return cards
    },
    /**
     * @param {Card} card
     * @return {boolean}
     */
    getIsCommentCard (card) {
      return card.isComment || utils.isNameComment(card.name)
    },
    /**
     * @param {string} cardId
     * @param {number} [deltaHeight=0]
     * @return {Card[]}
     */
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
      /** @type {Card|null} */
      let prevAlignedCard = null
      do {
        /** @type {Card} */
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
    /**
     * @param {number} y
     * @param {number} [zoom=1]
     * @param {Card[]} [cards=[]]
     * @return {Card[]}
     */
    getCardsBelowY (y, zoom = 1, cards = []) {
      let i = 0
      while (i < cards.length && (cards[i].y * zoom) <= y) {
        i++
      }
      return cards.slice(i)
    },
    /**
     * @param {number} y
     * @param {number} [zoom=1]
     * @param {Card[]} [cards=[]]
     * @return {Card[]}
     */
    getCardsAboveY (y, zoom = 1, cards = []) {
      let i = 0
      while (i < cards.length && (cards[i].y * zoom) <= y) {
        i++
      }
      return cards.slice(0, i)
    },
    /**
     * @param {number} x
     * @param {number} [zoom=1]
     * @param {Card[]} [cards=[]]
     * @return {Card[]}
     */
    getCardsRightOfX (x, zoom = 1, cards = []) {
      let i = 0
      while (i < cards.length && (cards[i].x * zoom) <= x) {
        i++
      }
      return cards.slice(i)
    },
    /**
     * @param {number} x
     * @param {number} [zoom=1]
     * @param {Card[]} [cards=[]]
     * @return {Card[]}
     */
    getCardsLeftOfX (x, zoom = 1, cards = []) {
      let i = 0
      while (i < cards.length && (cards[i].x * zoom) <= x) {
        i++
      }
      return cards.slice(0, i)
    },
    /** @return {Card[]} */
    getCardsSelectableInViewport () {
      /** @type NodeListOf<HTMLElement> */
      const elements = document.querySelectorAll('.card-wrap')
      /** @type {Card[]} */
      const cards = []
      elements.forEach(element => {
        if (element.dataset.isVisibleInViewport === 'false') { return }
        if (element.dataset.isLocked === 'true') { return }
        const id = /** @type {string} */ (element.dataset.cardId)
        const data = this.getCard(id)
        const { tilt, listId, listPositionIndex } = data // TODO: Unused, maybe should be deleted?
        const rect = element.getBoundingClientRect()
        const card = {
          ...data,
          width: Math.round(rect.width || data.width),
          height: Math.round(rect.height || data.height)
        }
        cards.push(card)
      })
      return cards
    },

    // init

    /** @param {Card[]} [cards=[]] */
    initializeCards (cards = []) {
      /** @type {Object.<string, Card>} */
      const byId = {}
      /** @type {string[]} */
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
    /** @param {Card[]} remoteCards */
    initializeRemoteCards (remoteCards) {
      const localCards = utils.clone(this.getAllCards)
      const { updateItems, addItems, removeItems } = utils.syncItems(remoteCards, localCards)
      console.info('🎑 remote cards', { updateItems, addItems, removeItems })
      this.updateCardsState(updateItems)
      addItems.forEach(card => this.addCardToState(card))
      removeItems.forEach(card => this.removeCardFromState(card))
    },
    /**
     * @param {string|null} color
     * @return {string|null}
     */
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

    /**
     * @param {Card} card
     * @return {Card}
     */
    normalizeNewCard (card) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      if (card.isFromBroadcast) { return card }
      const { x, y, z, position, isParentCard, name, id, backgroundColor, width, height, atUserMentions, atDateMentions } = card
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
      card.atUserMentions = atUserMentions || []
      card.atDateMentions = atDateMentions || []
      return card
    },
    /**
     * @param {Card} card
     */
    addCardToState (card) {
      this.byId[card.id] = card
      this.allIds.push(card.id)
    },
    /**
     * @param {Card} card
     * @param {boolean} [skipCardDetailsIsVisible]
     */
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
    /**
     * @param {Card[]} cards
     * @param {boolean} shouldOffsetPosition
     */
    async createCards (cards, shouldOffsetPosition) {
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

    /** @param {CardUpdate[]} updates */
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
    /**
     * @param {CardUpdate[]} updates
     * @return {boolean}
     */
    shouldUpdateSpaceEditedAt (updates) {
      // TODO: Change to a set and maybe make global to this file.
      const ignoreKeys = ['id', 'z', 'xDisplay', 'yDisplay']
      // TODO: Change to use a Set.
      /** @type {string[]} */
      let keys = []
      for (const card of updates) {
        Object.keys(card).forEach(key => keys.push(key))
      }
      keys = uniq(keys)
      keys = keys.filter(key => !ignoreKeys.includes(key))
      return Boolean(keys.length)
    },
    /**
     * @param {CardUpdate[]} updates
     * @return {CardUpdate[]}
     */
    updateCardNameUpdatedAt (updates) {
      return updates.map(update => {
        if (update.name) {
          update.nameUpdatedAt = new Date()
        }
        return update
      })
    },
    /** @param {CardUpdate[]} updates */
    async updateCards (updates) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const connectionStore = useConnectionStore()
      try {
        updates = this.updateCardNameUpdatedAt(updates)
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
        if (this.shouldUpdateSpaceEditedAt(updates)) {
          spaceStore.updateSpaceEditedAt()
        }
      } catch (error) {
        console.error('🚒 updateCards', error, updates)
      }
    },
    /** @param {CardUpdate} update */
    updateCard (update) {
      this.updateCards([update])
    },
    /**
     * @user mentions
     * @param {Card} card
     * @param {User} user
     * @param {string} userString
     */
    async addAtUserMention (card, user, userString) {
      const userNotificationStore = useUserNotificationStore()
      const mention = {
        id: nanoid(),
        cardId: card.id,
        userId: user.id,
        stringMatch: userString
      }
      const atUserMentions = card.atUserMentions.concat(mention)
      /** @type {CardUpdate} */
      const update = {
        id: card.id,
        atUserMentions
      }
      await this.updateCard(update)
      await userNotificationStore.addCardUserMention(mention)
      this.updateCardDimensions(card.id)
    },
    /**
     * @param {Card} card
     * @param {string} userString
     */
    async removeAtUserMentions (card, userString) {
      const atUserMentions = card.atUserMentions.filter(mention => {
        return mention.stringMatch !== userString
      })
      const update = {
        id: card.id,
        atUserMentions
      }
      await this.updateCard(update) // TODO: Awaiting on a non-async function, remove.
      this.updateCardDimensions(card.id)
    },

    // @date mentions

    async addAtDateMention (card, date, dateString) {
      const userNotificationStore = useUserNotificationStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const mention = {
        id: nanoid(),
        cardId: card.id,
        userId: userStore.id,
        spaceId: spaceStore.id,
        date,
        stringMatch: dateString
      }
      const atDateMentions = card.atDateMentions.concat(mention)
      const update = {
        id: card.id,
        atDateMentions,
        atMentionDateIsRelative: userStore.atMentionDateIsRelative
      }
      await this.updateCard(update)
      await userNotificationStore.addCardDateMention(mention)
      this.updateCardDimensions(card.id)
    },
    async removeAtDateMentions (card, dateString) {
      const atDateMentions = card.atDateMentions.filter(mention => {
        return mention.stringMatch !== dateString
      })
      const update = {
        id: card.id,
        atDateMentions
      }
      await this.updateCard(update)
      this.updateCardDimensions(card.id)
    },

    // remove

    /** @param {Card} card */
    removeCardFromState (card) {
      const idIndex = this.allIds.indexOf(card.id)
      if (utils.isNullish(idIndex)) { return }
      this.allIds.splice(idIndex, 1)
      delete this.byId[card.id]
    },
    /** @param {Card[]} cards */
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
    /** @param {Card} card */
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
    /** @param {string[]} ids */
    removeCards (ids) {
      const connectionStore = useConnectionStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const listStore = useListStore()
      /** @type {CardUpdate[]} */
      const updates = []
      /** @type {Card[]} */
      const cardsToRemove = []
      /** @type {Card[]} */
      const cardsToDelete = []
      const cards = ids.map(id => this.getCard(id))
      /** @type {string[]} */
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
    /** @param {string} id */
    removeCard (id) {
      this.removeCards([id])
    },
    /** @param {Card} card */
    async restoreRemovedCard (card) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      card.isRemoved = false
      const isLocal = this.getCard(card.id)
      if (isLocal) {
        this.updateCard({
          id: card.id,
          isRemoved: false
        })
      } else {
        this.addCardToState(card)
        await cache.updateSpace('cards', this.getAllCards, spaceStore.id)
        await apiStore.addToQueue({ name: 'restoreRemovedCard', body: card })
        userStore.updateUserCardsCreatedCount([card])
      }
    },

    // position

    /** @param {Card} card */
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
    /** @param {string[]} cardIds */
    checkIfShouldSnapAlignCards (cardIds) {
      cardIds = cardIds.filter(id => Boolean(id))
      const updates = cardIds.map(id => {
        const card = this.getCard(id)
        /** @type {CardUpdate} */
        const update = {
          id,
          xDisplay: undefined,
          yDisplay: undefined
        }
        if (card.shouldSnapAlignToXDisplay && card.xDisplay) {
          update.x = card.xDisplay
        }
        if (card.shouldSnapAlignToYDisplay && card.yDisplay) {
          update.y = card.yDisplay
        }
        return update
      })
      this.updateCards(updates)
    },
    /**
     * @param {Object} param
     * @param {Position} [param.endCursor]
     * @param {Position} [param.prevCursor]
     * @param {Position} [param.delta]
     * @param {Card[]} param.cards
     */
    moveCards ({ endCursor, prevCursor, delta, cards }) {
      const globalStore = useGlobalStore()
      const connectionStore = useConnectionStore() // TODO: Unused, maybe remove.
      const boxStore = useBoxStore()
      const listStore = useListStore()
      const zoom = globalStore.getSpaceCounterZoomDecimal
      if ((!endCursor || !prevCursor) && !delta) { return }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      delta = {
        x: delta.x * zoom,
        y: delta.y * zoom
      }
      cards = cards || this.getCardsSelected
      cards = cards.map(card => {
        let x = Math.round(card.x + delta.x)
        x = Math.max(0, x)
        let y = Math.round(card.y + delta.y)
        y = Math.max(0, y)
        return {
          id: card.id,
          x,
          y,
          width: card.width,
          height: card.height
        }
      })

      cards = globalStore.moveItemsUpdateSnapAlignDisplayPosition(cards)
      this.updatePageSize(cards[0])
      this.updateCards(cards)
      globalStore.cardsWereDragged = true
      cards = cards.map(card => this.getCard(card.id))
      if (endCursor) {
        boxStore.updateBoxSnapGuides({ items: cards, isChildren: true, cursor: endCursor })
        this.updateCardSnapGuides({ items: cards, cursor: endCursor })
      }
      globalStore.updateItemSnapAlignGuides()
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
    /** @param {string} id */
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
      /** @type {CardUpdate[]} */
      const updates = []
      /** @type {string[]} */
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
    /** @param {Card} card */
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
    /**
     * @param {Object} param
     * @param {string[]} param.cardIds
     * @param {string} param.cardId
     */
    resetDimensions ({ cardIds, cardId }) {
      if (cardId) {
        this.clearResizeCards([cardId])
      } else if (cardIds) {
        this.clearResizeCards(cardIds)
      }
    },
    /** @param {Card[]} cards */
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
        await this.updateCard(update) // TODO: Awaiting on a non-async function, remove await.
        index += 1
      }
    },
    /** @param {CardUpdate[]} updates */
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
    /** @param {string[]} ids */
    async updateCardsDimensions (ids) {
      const globalStore = useGlobalStore()
      const zoom = globalStore.getSpaceCounterZoomDecimal
      ids = ids || this.allIds
      let cards = ids.map(id => this.getCard(id))
      cards = cards.filter(card => Boolean(card))
      // cards = utils.clone(cards) // temp?
      if (!cards.length) { return }
      await nextTick()
      const updatedCards = [] // TODO: Unused, maybe delete?
      globalStore.updateShouldExplicitlyRenderCardIds(ids)
      /** @type {CardUpdate[]} */
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
    /** @param {string} id */
    async updateCardDimensions (id) {
      await this.updateCardsDimensions([id])
    },

    // card details

    /** @param {string} id */
    showCardDetails (id) {
      const globalStore = useGlobalStore()
      this.incrementCardZ(id)
      globalStore.updateCardDetailsIsVisibleForCardId(id)
      globalStore.parentCardId = id
      globalStore.loadSpaceFocusOnItemId = ''
    },

    // checked

    /**
     * @param {string} id
     * @param {boolean} value
     */
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
        name
      }
      this.updateCard(update)
    },
    /** @param {string} id */
    clearCardChecked (id) {
      const card = this.getCard(id)
      let name = card.name
      name = name.replace('[x]', '').trim()
      const update = {
        id,
        name
      }
      this.updateCard(update)
    },
    /**
     * @param {Card} card
     * @param {boolean} value
     */
    async toggleOtherSpaceCardChecked (card, value) {
      const apiStore = useApiStore()
      let { id, name, spaceId } = card
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
        spaceId
      }
      await apiStore.updateCards([update])
    },
    markAllCheckboxCardsChecked () {
      const cards = this.getAllCards
      cards.forEach(card => {
        const isUnchecked = card.name.startsWith('[] ')
        if (isUnchecked) {
          this.toggleCardChecked(card.id, true)
        }
      })
    },

    // tilt

    /**
     * @param {string[]} ids
     * @param {number} delta
     */
    tiltCards (ids, delta) {
      const maxDegrees = 90
      /** @type {CardUpdate[]} */
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
    /** @param {string[]} ids */
    clearTiltCards (ids) {
      ids.forEach(id => {
        const update = { id, tilt: 0 }
        this.updateCard(update)
        utils.clearAllCardDimensions({ id })
      })
    },

    // resize

    /**
     * @param {string[]} ids
     * @param {number} deltaX
     */
    resizeCards (ids, deltaX) {
      const connectionStore = useConnectionStore() // TODO: Unused, maybe remove.
      const broadcastStore = useBroadcastStore() // TODO: Unused, maybe remove.
      const minImageWidth = 64
      /** @type {CardUpdate[]} */
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
    /**
     * @param {string[]} ids
     * @param {boolean} [shouldRemoveResizeWidth]
     */
    async clearResizeCards (ids, shouldRemoveResizeWidth) {
      const connectionStore = useConnectionStore()
      /** @type {CardUpdate[]} */
      const updates = []
      ids.forEach(id => {
        /** @type {CardUpdate} */
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

    /**
     * @param {Object} param
     * @param {Card} param.card
     * @param {boolean} param.shouldIncrement
     * @param {boolean} param.shouldDecrement
     */
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

    /** @param {string} id */
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
    /**
     * @param {Card} card
     * @param {string} id
     */
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
          const newTag = globalStore.getNewTag({
            name: tag,
            defaultColor: userStore.color,
            cardId: card.id,
            spaceId
          })
          spaceStore.addTag(newTag)
        })
      }
      this.createCard(card)
    },

    // name

    /**
     * @param {Card} card
     * @param {boolean} excludeCheckboxString
     * @return {Card}
     */
    cardWithNameSegments (card, excludeCheckboxString) {
      const spaceStore = useSpaceStore()
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
      const atMentions = (card.atUserMentions || []).concat(card.atDateMentions || [])
      const segments = utils.cardNameSegments(name, atMentions)
      if (imageUrl) {
        segments.unshift({
          isImage: true,
          url: imageUrl
        })
      }
      card.nameSegments = segments.map(segment => {
        if (segment.isTag) {
          segment.color = this.cardSegmentTagColor(segment)
        } else if (segment.isAtUserMention) {
          segment.user = spaceStore.getSpaceUserById(segment.userId)
        }
        return segment
      })
      return card
    },
    /**
     * @param {Segment} segment
     * @return {string}
     */
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
    /**
     * @param {{name: string}} file
     * @param {string} id
     */
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
    /** @param {string} id */
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
    /** @param {string} tagName */
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

    /** @param {CardList} list */
    async updateCardPositionsInList (list) {
      const listStore = useListStore()
      const globalStore = useGlobalStore() // TODO: Unused, maybe remove.
      if (!list) { return }
      const cards = this.getCardsByList(list.id)
      /** @type {CardUpdate[]} */
      const updates = []
      /** @type {CardUpdate[]} */
      const prevCards = []
      const originY = list.y + consts.listInfoHeight
      cards.forEach((card, index) => {
        const update = {
          id: card.id,
          x: list.x + consts.listPadding,
          y: originY,
          height: card.height
        }
        if (index > 0) {
          const prevCard = prevCards[index - 1]
          update.y = prevCard.y + prevCard.height + consts.listPadding
        }
        const cardIsUnchanged = ['x', 'y', 'height'].every(key => card[key] === update[key])
        prevCards.push(update)
        if (cardIsUnchanged) { return }
        updates.push(update)
      })
      this.updateCards(updates)
      listStore.updateListDimensions(list)
    },
    /**
     * @param {Card} card
     * @param {CardList} list
     */
    async prependCardToList (card, list) {
      let targetPositionIndex = null
      const cards = this.getCardsByList(list.id)
      if (cards.length) {
        targetPositionIndex = cards[0].listPositionIndex
      }
      await this.addCardsToList({ cards: [card], list, targetPositionIndex, shouldPrepend: true })
    },
    /**
     * @param {Card} card
     * @param {CardList} list
     */
    async appendCardToList (card, list) {
      let targetPositionIndex = null
      const cards = this.getCardsByList(list.id)
      if (cards.length) {
        targetPositionIndex = last(cards).listPositionIndex
      }
      await this.addCardsToList({ cards: [card], list, targetPositionIndex, shouldPrepend: false })
    },
    /**
     * @param {Card[]} cards
     * @param {CardList} list
     */
    checkIfShouldUpdatePrevListDimensions (cards, list) {
      const listStore = useListStore()
      /** @type {string[]} */
      let prevListIds = []
      // get moved cards prev listIds
      cards.forEach(card => {
        if (!card.listId) { return }
        if (card.listId !== list.id) {
          prevListIds.push(card.listId)
        }
      })
      // update lists
      prevListIds = uniq(prevListIds)
      prevListIds.forEach(id => {
        const list = listStore.getList(id)
        listStore.updateListDimensions(list)
      })
    },
    /**
     * @param {Object} param
     * @param {Card[]} param.cards
     * @param {CardList} param.list
     * @param {string|null} [param.targetPositionIndex=null]
     * @param {boolean} [param.shouldPrepend]
     */
    async addCardsToList ({ cards, list, targetPositionIndex = null, shouldPrepend }) {
      const globalStore = useGlobalStore()
      try {
        cards = utils.sortByY(cards)
        const ids = cards.map(card => card.id)
        this.updateCardsDimensions(ids)
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
        /** @type {CardUpdate[]} */
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
        this.updateCardsDimensions(ids)
        this.updateCardPositionsInList(list)
        this.checkIfShouldUpdatePrevListDimensions(cards, list)

        globalStore.clearAllSelected()
      } catch (error) {
        console.error('🚒 addCardsToList', error)
      }
    },
    /** @param {Card[]} cards */
    async removeCardsFromLists (cards) {
      const listStore = useListStore()
      /** @type {string[]} */
      let listIds = []
      const ids = cards.map(card => {
        if (card.listId) {
          listIds.push(card.listId)
        }
        return card.id
      })
      listIds = uniq(listIds)
      /** @type {CardUpdate[]} */
      const updates = ids.map(id => {
        return {
          id,
          listId: null,
          listPositionIndex: null,
          resizeWidth: null,
          width: null
        }
      })
      this.updateCards(updates)
      this.clearResizeCards(ids, true)
      for (const listId of listIds) {
        const list = listStore.getList(listId)
        await this.updateCardPositionsInList(list)
        listStore.updateListDimensions(list)
      }
    },
    /** @param {string[]} listIds */
    async removeCardsFromListsByLists (listIds) {
      listIds.forEach(id => {
        const cards = this.getCardsByList(id)
        this.removeCardsFromLists(cards)
      })
    },
    /**
     * @param {Card[]} cards
     * @return {boolean}
     */
    cardsIsInListTogether (cards) {
      if (!cards.length) { return false }
      const listId = cards[0].listId
      if (!listId) { return false }
      const value = cards.every(card => card.listId === listId)
      return value
    },
    /** @param {Card[]} cards */
    async toggleListCards (cards) {
      const globalStore = useGlobalStore()
      const listStore = useListStore()
      let list
      let listCards = []
      let listHasOtherCards = false

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

    /**
     * @param {Object} param
     * @param {Position} param.cursor
     * @param {Card} param.targetCard
     * @param {number} param.edgeY
     * @return {number}
     */
    distanceCursorToCardEdge ({ cursor, targetCard, edgeY }) {
      const nearestEdgeX = Math.max(targetCard.x, Math.min(cursor.x, targetCard.x + targetCard.width))
      const dx = cursor.x - nearestEdgeX
      const dy = cursor.y - edgeY
      return Math.sqrt(dx * dx + dy * dy)
    },
    /**
     * @param {Object} param
     * @param {"top" | "bottom"} param.side
     * @param {Card} param.item
     * @param {Card} param.targetCard
     * @param {Position} param.cursor
     * @return {SnapGuide|undefined}
     */
    createCardSnapGuide ({ side, item, targetCard, cursor }) {
      const edgeParams = {
        top: {
          edgeY: targetCard.y,
          sizeOutside: Math.abs(targetCard.y - item.y)
        },
        bottom: {
          edgeY: targetCard.y + targetCard.height,
          sizeOutside: Math.abs((targetCard.y + targetCard.height) - (item.y + item.height))
        }
      }
      if (!edgeParams[side]) { return }
      const { edgeY, sizeOutside } = edgeParams[side]
      const prevGuide = this.cardSnapGuides.find(guide => guide.side === side)
      const time = prevGuide ? prevGuide.time : Date.now()
      const distance = this.distanceCursorToCardEdge({ cursor, targetCard, edgeY })
      return { side, item, target: targetCard, time, distance, sizeOutside }
    },
    /**
     * @param {Object} param
     * @param {any[]} param.items
     * @param {Position} param.cursor
     */
    updateCardSnapGuides ({ items, cursor }) {
      const globalStore = useGlobalStore()
      const listStore = useListStore()
      if (globalStore.preventItemSnapping) { return }
      if (!items.length) { return } // TODO: Only usage of items, maybe remove?
      if (globalStore.shouldSnapAlign) { return }
      const snapThreshold = 10 // TODO: Unused, maybe remove?
      const spaceEdgeThreshold = 100
      const targetCards = this.getCardsSelectableInViewport()
      const prevSnapGuides = globalStore.snapGuides // TODO: Unused, maybe remove?
      /** @type {SnapGuide[]} */
      let snapGuides = []
      // find
      const card = this.getCard(globalStore.currentDraggingCardId) // only current dragging card can snap
      if (!card) { return }
      targetCards.forEach(target => {
        if (target.id === card.id) { return }
        if (!target.listId) { return } // only snap to list cards
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
        const targetIsMinX = target.x <= spaceEdgeThreshold // TODO: Unused, maybe remove?
        const targetIsMinY = target.y <= spaceEdgeThreshold // TODO: Unused, maybe remove?
        // card side is on target edge
        const cardOverlapsTargetTop = utils.isBetween({ value: targetTop, min: cardTop, max: cardBottom })
        const cardOverlapsTargetBottom = utils.isBetween({ value: targetBottom, min: cardTop, max: cardBottom })
        const cardOverlapsTargetX = cardLeft < targetRight && cardRight > targetLeft
        const cardOverlapsTargetY = cardTop < targetBottom && cardBottom > targetTop
        const cardOverlapsTarget = cardOverlapsTargetX && cardOverlapsTargetY
        // card is in list if snapping to list
        let cardIsValidListSnap = true
        if (listStore.listSnapGuides.listId) {
          cardIsValidListSnap = listStore.listSnapGuides.listId === card.listId
        }
        const isSnapable = cardOverlapsTarget && cardIsValidListSnap
        // snap top
        if (cardOverlapsTargetTop && isSnapable) {
          const snapGuide = this.createCardSnapGuide({ side: 'top', item: card, targetCard: target, cursor })
          snapGuides.push(snapGuide)
        }
        // snap bottom
        if (cardOverlapsTargetBottom && isSnapable) {
          const snapGuide = this.createCardSnapGuide({ side: 'bottom', item: card, targetCard: target, cursor })
          snapGuides.push(snapGuide)
        }
      })
      if (!snapGuides.length) {
        this.cardSnapGuides = []
        return
      }
      snapGuides = sortBy(snapGuides, ['distance', 'sizeOutside'])
      // limit snap to closest target
      snapGuides = [snapGuides[0]]
      this.cardSnapGuides = snapGuides
    }

  }

})
