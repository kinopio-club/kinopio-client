import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import inboxSpace from '@/data/inbox.json'
import newSpace from '@/data/new.json'

import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'
import random from 'lodash-es/random'
import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'
import sortBy from 'lodash-es/sortBy'
import defer from 'lodash-es/defer'
import throttle from 'lodash-es/throttle'
import dayjs from 'dayjs'

const idleClientTimers = []
let isLoadingRemoteSpace, shouldLoadNewHelloSpace
const loadSpaceIdsError = []

export const useSpaceStore = defineStore('space', {
  state: () => (newSpace),

  getters: {
    getSpaceAllState () {
      return { ...this } // In method syntax, 'this' refers to the store instance
    },
    getSpaceIsPrivate () {
      return this.privacy === 'private'
    },
    getSpaceUrl () {
      const domain = consts.kinopioDomain()
      const spaceUrl = utils.url({ name: this.name, id: this.id })
      return `${domain}/${spaceUrl}`
    },
    // getSpaceAllTags() {
    //   return this.tags
    // },
    getSpaceCreator () {
      return this.getSpaceMemberById(this.userId)
    },
    getSpaceCreatorIsUpgraded () {
      const creatorUser = this.getSpaceCreator
      return creatorUser?.isUpgraded
    },
    getSpaceCreatorIsCurrentUser () {
      const userStore = useUserStore()
      const creatorUser = this.creator
      return userStore.getUserIsCurrentUser(creatorUser)
    },
    getShouldPreventAddCard () {
      const userStore = useUserStore()
      const cardsCreatedIsOverLimit = userStore.getUserCardsCreatedIsOverLimit
      return cardsCreatedIsOverLimit && !this.getSpaceCreatorIsUpgraded
    },
    getSpaceIsRemote () {
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember
      const isOtherSpace = !isSpaceMember
      const isSignedIn = userStore.getUserIsSignedIn
      return isOtherSpace || isSignedIn
    },
    getSpaceAllUsers () {
      const userStore = useUserStore()
      let users = this.getSpaceMembers
      users = users.concat(this.spectators)
      // if (excludeCurrentUser) {
      //   users = users.filter(user => user.id !== userStore.id)
      // }
      return users
    },
    getSpaceMembers () {
      const userStore = useUserStore()
      let users = this.users
      const collaborators = this.collaborators || []
      users = users.concat(collaborators)
      // if (excludeCurrentUser) {
      //   users = users.filter(user => user.id !== userStore.id)
      // }
      return users
    },
    getSpaceIsHidden () {
      const userStore = useUserStore()
      const hiddenSpaces = userStore.hiddenSpaces || []
      let value = hiddenSpaces.find(hiddenSpace => hiddenSpace?.id === this.id)
      value = Boolean(value)
      return value
    },
    getSpaceIsHello () {
      return this.name === 'Hello Kinopio'
    }

  },

  actions: {

    getSpaceTagByName (name) {
      const tags = this.tags.find(tag => {
        return tag.name === name
      })
      return tags
    },

    // user getters

    getSpaceMemberById (userId) {
      const members = this.getSpaceMembers
      return members.find(member => member.id === userId)
    },
    getSpaceUserById (userId) {
      const userStore = useUserStore()
      // current user
      if (userStore.id === userId) {
        return userStore
      }
      // collaborators
      const user = this.memberById(userId)
      if (user?.id === userId) {
        return user
      }
      // commenters
      const otherUser = store.getters.otherUserById(userId)
      if (otherUser) {
        return otherUser
      }
      // group user
      const groupUser = store.getters['groups/groupUser']({ userId })
      return groupUser
    },
    getSpaceReadOnlyKey (space) {
      const readOnlyKey = store.state.spaceReadOnlyKey
      if (space.id === readOnlyKey.spaceId) {
        return readOnlyKey.key
      } else {
        return null
      }
    },

    // init

    async initializeSpace () {
      const userStore = useUserStore()
      store.commit('isLoadingSpace', true, { root: true })
      const spaceUrl = store.state.spaceUrlToLoad
      // restore from url
      if (spaceUrl) {
        console.info('🚃 Restore space from url', spaceUrl)
        const spaceId = utils.spaceIdFromUrl(spaceUrl)
        const space = { id: spaceId }
        await this.loadSpace(space)
      // restore inbox space
      } else if (store.state.loadInboxSpace) {
        console.info('🚃 Restore inbox space')
        await this.loadInboxSpace()
      // create new space
      } else if (store.state.loadNewSpace) {
        console.info('🚃 Create new space')
        await this.createSpace()
        store.commit('loadNewSpace', false, { root: true })
      // restore last space
      } else if (userStore.lastSpaceId) {
        console.info('🚃 Restore last space', userStore.lastSpaceId)
        await this.loadLastSpace()
      // hello kinopio
      } else {
        console.info('🚃 Create and restore hello space')
        shouldLoadNewHelloSpace = true
      }
      await this.checkIfShouldCreateNewUserSpaces()
      store.commit('triggerUpdateWindowHistory', null, { root: true })
      store.commit('isLoadingSpace', false, { root: true })
    },

    // load

    restoreSpace (space) {
      const cardStore = useCardStore()
      const boxStore = useBoxStore()
      const connectionStore = useConnectionStore()
      space = utils.removeRemovedCardsFromSpace(space)
      // initialize items
      cardStore.initializeCards(space.cards)
      boxStore.initializeBoxes(space.boxes)
      connectionStore.initializeConnectionTypes(space.connectionTypes)
      connectionStore.initializeConnections(space.connections)
      // remove unused attrs
      delete space.cards
      delete space.boxes
      delete space.connectionTypes
      delete space.connections
      this.$patch(space)
      console.log('🍍', space)
      store.dispatch('updatePageSizes')
    },
    async getRemoteSpace (space) {
      const userStore = useUserStore()
      const collaboratorKey = store.state.spaceCollaboratorKeys.find(key => key.spaceId === space.id)
      if (collaboratorKey) {
        space.collaboratorKey = collaboratorKey.collaboratorKey
      }
      let remoteSpace
      try {
        if (userStore.getUserIsSignedIn) {
          remoteSpace = await store.dispatch('api/getSpace', { space }, { root: true })
        } else if (collaboratorKey) {
          space.collaboratorKey = collaboratorKey
          remoteSpace = await store.dispatch('api/getSpaceAnonymously', space, { root: true })
          cache.saveInvitedSpace(remoteSpace)
          store.commit('clearSpaceCollaboratorKeys', null, { root: true })
        } else if (this.getSpaceIsRemote) {
          remoteSpace = await store.dispatch('api/getSpaceAnonymously', space, { root: true })
        }
        return remoteSpace
      } catch (error) {
        console.error('🚒 getRemoteSpace', space.id, error)
        loadSpaceIdsError.push(space.id)
        throw error
      }
    },
    async loadRemoteSpace (space) {
      const userStore = useUserStore()
      let remoteSpace
      try {
        remoteSpace = await this.getRemoteSpace(space)
      } catch (error) {
        console.warn('🚑 loadRemoteSpace', error.status, error, space.id)
        const preventRepeatError = loadSpaceIdsError.includes(space.id)
        if (preventRepeatError) {
          store.commit('notifySpaceNotFound', true, { root: true })
          return
        }
        if (error.status === 404) {
          store.commit('notifySpaceNotFound', true, { root: true })
          this.loadLastSpace(space) //
        }
        if (error.status === 401) {
          store.commit('notifySpaceNotFound', true, { root: true })
          this.removeLocalSpaceIfUserIsRemoved(space) //
          this.loadLastSpace(space) //
          cache.removeInvitedSpace(space)
          userStore.updateUserFavoriteSpace(space, false)
        }
        if (error.status === 500) {
          store.commit('notifyConnectionError', true, { root: true })
        }
      }
      if (!remoteSpace) {
        store.commit('isLoadingSpace', false, { root: true })
        return
      }
      // only restore current space
      if (remoteSpace.id !== store.state.id) { return }
      return utils.normalizeRemoteSpace(remoteSpace)
    },
    clearStateMeta () {
      const userStore = useUserStore()
      const user = { id: userStore.id }
      isLoadingRemoteSpace = false
      store.commit('notifySpaceIsRemoved', false, { root: true })
      store.commit('spaceUrlToLoad', '', { root: true })
      store.commit('userHasScrolled', false, { root: true })
      store.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      store.commit('clearAllNotifications', null, { root: true })
      store.commit('clearSpaceFilters', null, { root: true })
      store.commit('clearSearch', null, { root: true })
      store.commit('shouldPreventNextEnterKey', false, { root: true })
    },
    restoreSpaceLocal (space) {
      const emptySpace = utils.emptySpace(space.id)
      this.restoreSpace(emptySpace)
      store.dispatch('history/reset', null, { root: true })
      this.restoreSpace(space)
      console.info('🎑 local space', space)
      return space
    },
    async restoreSpaceRemote (space) {
      const cardStore = useCardStore()
      isLoadingRemoteSpace = true
      space = utils.normalizeSpace(space)
      store.dispatch('history/redoLocalUpdates', null, { root: true })
      this.restoreSpace(space)
    },
    async loadSpace (space) {
      space.connections = utils.migrationConnections(space.connections)
      if (!store.state.isEmbedMode) {
        store.commit('triggerSpaceZoomReset', null, { root: true })
      }
      store.commit('isAddPage', false, { root: true })
      const cachedSpace = await cache.space(space.id) || space
      cachedSpace.id = cachedSpace.id || space.id
      space = utils.normalizeSpace(cachedSpace)
      this.clearStateMeta()
      store.commit('resetPageSizes', null, { root: true })
      // load local space while fetching remote space
      try {
        const [localData, remoteData] = await Promise.all([
          this.restoreSpaceLocal(space),
          this.loadRemoteSpace(space)
        ])
        // restore remote space
        const remoteSpace = remoteData
        console.info('🎑 remoteSpace', remoteSpace)
        if (!remoteSpace) { return }
        store.commit('triggerUpdateWindowTitle', null, { root: true })
        store.dispatch('groups/loadGroup', remoteSpace, { root: true })
        const spaceIsUnchanged = utils.spaceIsUnchanged(cachedSpace, remoteSpace)
        if (spaceIsUnchanged) {
          store.commit('isLoadingSpace', false, { root: true })
          this.updateSpacePreviewImage()
          // always update drawing
          this.drawingImage = remoteSpace.drawingImage
          await cache.updateSpaceByUpdates({ drawingImage: remoteSpace.drawingImage }, this.id)
          store.commit('triggerDrawingRedraw', null, { root: true })
          return
        }
        await this.restoreSpaceRemote(remoteSpace)
        this.saveSpaceToCache()
        this.notifySpaceIsOpen()
        this.updateUserLastSpaceId()
      } catch (error) {
        console.error('🚒 Error fetching remoteSpace', error)
      }
      store.dispatch('updateCurrentSpaceIsUnavailableOffline', space.id, { root: true })
      store.dispatch('updateCurrentUserIsInvitedButCannotEditCurrentSpace', space, { root: true })
      // focus card
      const cardId = store.state.focusOnCardId
      if (cardId) {
        store.commit('triggerScrollCardIntoView', cardId, { root: true })
      }
    },
    async loadInboxSpace (prevFailedSpace) {
      let space
      const userStore = useUserStore()
      let spaceToRestore = await cache.space(userStore.lastSpaceId)
      if (!spaceToRestore.id) {
        spaceToRestore = null
      } else if (spaceToRestore?.id === prevFailedSpace?.id) {
        spaceToRestore = null
      }
      const cachedHelloSpace = await cache.getSpaceByName('Hello Kinopio')
      const cachedSpace = await cache.getAllSpaces()[0]
      const prevSpace = cachedHelloSpace || cachedSpace
      if (spaceToRestore?.id) {
        space = spaceToRestore
      } else if (userStore.lastSpaceId) {
        space = { id: userStore.lastSpaceId }
      } else if (prevSpace) {
        space = prevSpace
        await cache.saveSpace(space)
      }
      // load space
      if (space) {
        await this.loadSpace(space)
      } else {
        this.initializeSpace()
      }
    },
    async loadLastSpace (prevFailedSpace) {
      const userStore = useUserStore()
      let space
      let spaceToRestore = await cache.space(userStore.lastSpaceId)
      if (!spaceToRestore.id) {
        spaceToRestore = null
      } else if (spaceToRestore?.id === prevFailedSpace?.id) {
        spaceToRestore = null
      }
      const cachedHelloSpace = await cache.getSpaceByName('Hello Kinopio')
      const cachedSpace = await cache.getAllSpaces()[0]
      const prevSpace = cachedHelloSpace || cachedSpace
      if (spaceToRestore?.id) {
        space = spaceToRestore
      } else if (userStore.lastSpaceId) {
        space = { id: userStore.lastSpaceId }
      } else if (prevSpace) {
        space = prevSpace
        await cache.saveSpace(space)
      }
      // load space
      if (space) {
        await this.loadSpace(space)
      } else {
        this.initializeSpace()
      }
    },

    // save

    async saveSpace () {
      const userStore = useUserStore()
      const space = this.getSpaceAllState
      const user = userStore.getUserAllState
      console.info('✨ saveNewSpace', space, user)
      cache.saveSpace(space)
      this.addUserToSpace(user)
      this.incrementCardsCreatedCountFromSpace(space)
      store.commit('isLoadingSpace', false, { root: true })
      store.commit('triggerUpdateWindowHistory', null, { root: true })
      await store.dispatch('api/addToQueue', {
        name: 'createSpace',
        body: space
      }, { root: true })
      // const cardStore = useCardStore()
      // cardStore.updateCardsDimensions()
    },
    saveSpaceToCache () {
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember
      if (!isSpaceMember) { return }
      if (this.isRemoved) { return }
      cache.saveSpace(this.getSpaceAllState)
    },

    // create

    async createNewSpace (space) {
      const userStore = useUserStore()
      const user = userStore.getUserAllState
      store.commit('triggerSpaceZoomReset', null, { root: true })
      let name
      if (space) {
        name = space.name
      }
      space = utils.clone(newSpace)
      space.name = name || utils.newSpaceName()
      space.id = nanoid()
      space.createdAt = new Date()
      space.editedAt = new Date()
      space.collaboratorKey = nanoid()
      space.readOnlyKey = nanoid()
      space.moonPhase = utils.moonPhase()
      const shouldHideTutorialCards = userStore.shouldHideTutorialCards
      if (shouldHideTutorialCards) {
        space.connectionTypes = []
        space.connections = []
        space.cards = []
        space.boxes = []
      } else {
        space.connectionTypes[0].color = randomColor({ luminosity: 'light' })
      }
      const shouldHideDateCards = userStore.shouldHideDateCards
      if (!shouldHideDateCards) {
        const date = dayjs().format('dddd') // Sunday
        const moonPhaseSystemCommandIcon = '::systemCommand=moonPhase'
        const dateCard = {
          id: nanoid(),
          x: 73,
          y: 125,
          z: 0,
          name: `${moonPhaseSystemCommandIcon} ${date} ${store.getters.dateImageUrl}`,
          width: 144,
          height: 144,
          resizeWidth: 144
        }
        space.cards.push(dateCard)
      }
      space = utils.updateSpaceCardsCreatedThroughPublicApi(space)
      space.userId = userStore.id
      space = utils.newSpaceBackground(space, user)
      space.background = space.background || consts.defaultSpaceBackground
      space.isTemplate = false
      space.previewImage = null
      space.previewThumbnailImage = null
      const nullCardUsers = true
      const uniqueNewSpace = await cache.updateIdsInSpace(space, nullCardUsers)
      store.commit('clearSearch', null, { root: true })
      isLoadingRemoteSpace = false
      store.commit('resetPageSizes', null, { root: true })
      await this.restoreSpace(uniqueNewSpace)
    },
    async createSpace () {
      const userStore = useUserStore()
      const user = { id: userStore.id }
      store.commit('broadcast/leaveSpaceRoom', { user: { id: user.id }, type: 'userLeftRoom' }, { root: true })
      await this.createNewSpace()
      await this.saveSpace()
      this.updateUserLastSpaceId()
      store.commit('notifySignUpToEditSpace', false, { root: true })
    },
    async createNewHelloSpace () {
      const userStore = useUserStore()
      const user = userStore.getUserAllState
      let space = utils.newHelloSpace(user)
      space = utils.updateSpaceCardsCreatedThroughPublicApi(space)
      space.id = nanoid()
      space.collaboratorKey = nanoid()
      space.readOnlyKey = nanoid()
      if (shouldLoadNewHelloSpace) {
        space = await cache.updateIdsInSpace(space)
        store.commit('clearSearch', null, { root: true })
        store.commit('resetPageSizes', null, { root: true })
        this.restoreSpace(space)
        this.addUserToSpace(user)
        this.updateOtherUsers()
        this.updateOtherItems()
      } else {
        space.users = [user]
        const nullCardUsers = true
        await cache.updateIdsInSpace(space, nullCardUsers)
      }
      store.commit('triggerUpdateWindowTitle', null, { root: true })
    },
    async createNewInboxSpace (shouldCreateWithoutLoading) {
      const cardStore = useCardStore()
      const userStore = useUserStore()
      let space = utils.clone(inboxSpace)
      space.id = nanoid()
      space.createdAt = new Date()
      space.editedAt = new Date()
      space.userId = userStore.id
      space.cards = space.cards.map(card => {
        card.id = nanoid()
        card.userId = userStore.id
        return card
      })
      space = utils.updateSpaceCardsCreatedThroughPublicApi(space)
      if (shouldCreateWithoutLoading) {
        space.users = [userStore]
        const nullCardUsers = true
        await cache.updateIdsInSpace(space, nullCardUsers) // saves space
      } else {
        store.commit('isLoadingSpace', true, { root: true })
        store.commit('clearSearch', null, { root: true })
        isLoadingRemoteSpace = false
        store.commit('resetPageSizes', null, { root: true })
        this.restoreSpace(space)
        await nextTick()
        cardStore.updateCardsDimensions()
      }
    },
    async checkIfShouldCreateNewUserSpaces () {
      const userStore = useUserStore()
      const spaces = await cache.getAllSpaces()
      if (userStore.getUserIsSignedIn) { return }
      if (spaces.length) { return }
      await this.createNewInboxSpace(true)
      await this.createNewHelloSpace()
      this.updateUserLastSpaceId()
    },

    // update

    updateSpacePreviewImage: throttle(async () => {
      const userStore = useUserStore()
      const isSignedIn = userStore.getUserIsSignedIn
      const canEditSpace = userStore.getUserCanEditSpace()
      const isPrivate = this.getSpaceIsPrivate
      if (!isSignedIn) { return }
      if (!canEditSpace) { return }
      if (isPrivate) { return }
      const response = await store.dispatch('api/updateSpacePreviewImage', this.id, { root: true })
      console.info('🙈 updated space preview image', response?.urls)
    }, 10 * 1000), // 10 seconds
    updateUserLastSpaceId () {
      const userStore = useUserStore()
      const isSignedIn = userStore.getUserIsSignedIn
      const isPrivate = this.getSpaceIsPrivate
      const canEdit = userStore.getUserCanEditSpace()
      const isReadOnlyInvite = isPrivate && !canEdit
      if (isReadOnlyInvite) { return }
      userStore.updateUser({ lastSpaceId: this.id })
    },
    async updateOtherUsers () {
      const cardStore = useCardStore()
      const cards = cardStore.getAllCards
      let userIds = []
      const spaceMemberIds = this.users.map(user => user.id)
      const spaceCollaboratorIds = this.collaborators.map(user => user.id)
      userIds = userIds.concat(spaceMemberIds)
      userIds = userIds.concat(spaceCollaboratorIds)
      let otherUserIds = []
      cards.forEach(card => {
        if (!card.nameUpdatedByUserId) { return }
        if (!userIds.includes(card.nameUpdatedByUserId)) {
          otherUserIds.push(card.nameUpdatedByUserId)
        }
      })
      otherUserIds = uniq(otherUserIds)
      if (!otherUserIds.length) { return }
      try {
        const users = await store.dispatch('api/getPublicUsers', otherUserIds, { root: true })
        users.forEach(user => {
          store.commit('updateOtherUsers', user, { root: true })
        })
      } catch (error) {
        console.warn('🚑 updateOtherUsers', error)
      }
    },
    async updateOtherItems (options) {
      const cardStore = useCardStore()
      const userStore = useUserStore()
      const canEditSpace = userStore.getUserCanEditSpace()
      // other items to fetch
      let invites = []
      let cardIds = []
      let spaceIds = []
      // param items
      if (options) {
        const { cardId, spaceId, collaboratorKey } = options
        let space, card
        // don't update if item already exists
        if (spaceId) {
          const space = store.getters.otherSpaceById(spaceId)
        } else if (cardId) {
          const card = store.getters.otherCardById(cardId)
        }
        if (space || card) { return }
        // add options to items to fetch
        if (collaboratorKey) {
          invites.push({ spaceId, collaboratorKey })
        } else if (cardId) {
          cardIds.push(cardId)
        } else if (spaceId) {
          spaceIds.push(spaceId)
        }
      // no param items
      } else {
        const otherItemIds = cardStore.getCardsWithSpaceOrInviteLinks
        invites = otherItemIds.invites
        cardIds = otherItemIds.cardIds
        spaceIds = otherItemIds.spaceIds
      }
      spaceIds = spaceIds || []
      cardIds = cardIds || []
      invites = invites || []
      const isEmpty = !cardIds.length && !spaceIds.length && !invites.length
      if (isEmpty) { return }
      await store.dispatch('api/addToGetOtherItemsQueue', { spaceIds, cardIds, invites }, { root: true })
    },
    async updateSpace (update) {
      const keys = Object.keys(update)
      for (const key of keys) {
        this[key] = update[key]
      }
      store.dispatch('broadcast/update', { update, type: 'updateSpace' }, { root: true })
      await store.dispatch('api/addToQueue', { name: 'updateUser', body: update }, { root: true })
      await cache.updateSpaceByUpdates(update, this.id)
    },

    // remove

    // async removeCards (cards) {
    //   const userStore = useUserStore()
    //   const canEditSpace = userStore.getUserCanEditSpace()
    //   if (!canEditSpace) { return }
    //   for (const card of cards) {
    //     const idIndex = this.allIds.indexOf(card.id)
    //     this.allIds.splice(idIndex, 1)
    //     delete this.byId[card.id]
    //     await store.dispatch('api/addToQueue', { name: 'removeCard', body: card }, { root: true })
    //   }
    // },
    // async removeCard (card) {
    //   await this.removeCards([card])
    // }

    // users

    addUserToSpace (newUser) {
      const userExists = this.users.find(user => user.id === newUser.id)
      if (userExists) { return }
      this.users.push(newUser)
      cache.updateSpace('users', this.users, this.id)
    },

    // notify

    notifySpaceIsOpen () {
      if (this.isRemoved) { return }
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember
      const spaceIsOpen = this.privacy === 'open'
      if (!isSpaceMember && spaceIsOpen) {
        store.commit('addNotification', { message: 'This space is open to comments', icon: 'comment', type: 'success' }, { root: true })
      }
    },

    // user card count

    checkIfShouldNotifyCardsCreatedIsNearLimit () {
      const userStore = useUserStore()
      if (this.getSpaceCreatorIsUpgraded) { return }
      if (userStore.isUpgraded) { return }
      const cardsCreatedLimit = consts.cardsCreatedLimit
      const value = cardsCreatedLimit - userStore.cardsCreatedCount
      if (utils.isBetween({ value, min: 0, max: 15 })) {
        store.commit('notifyCardsCreatedIsNearLimit', true, { root: true })
      }
    },
    incrementCardsCreatedCountFromSpace (space) {
      const userStore = useUserStore()
      const updatedCards = space.cards.filter(card => {
        return userStore.getUserIsCurrentUser({ id: card.userId })
      })
      userStore.updateUserCardsCreatedCount(updatedCards)
    },
    decrementCardsCreatedCountFromSpace (space) {
      const userStore = useUserStore()
      space.cards = space.cards.filter(card => {
        return userStore.getUserIsCurrentUser({ id: card.userId })
      })
      userStore.updateUserCardsCreatedCount(space.cards, true)
    },

    // tags

    addTag (tag) {
      this.tags.push(tag)
      cache.updateSpace('tags', this.tags, this.id)
    },
    removeTag (tag) {
      this.tags = this.tags.filter(spaceTag => spaceTag.id !== tag.id)
      cache.updateSpace('tags', this.tags, this.id)
    },
    removeTags (tag) {
      this.tags = this.tags.filter(spaceTag => spaceTag.name !== tag.name)
      cache.removeTagsByNameInAllSpaces(tag)
    },
    removeTagsFromCard (card) {
      this.tags = this.tags.filter(spaceTag => {
        return spaceTag.cardId !== card.id
      })
      cache.updateSpace('tags', this.tags, this.id)
    },
    deleteTagsFromAllRemovedCardsPermanent () {
      const cardIds = this.removedCards.map(card => card.id)
      this.tags = this.tags.filter(spaceTag => {
        return !cardIds.includes(spaceTag.cardId)
      })
      cache.updateSpace('tags', this.tags, this.id)
    },
    updateTagNameColor (updatedTag) {
      this.tags = this.tags.map(tag => {
        if (tag.name === updatedTag.name) {
          tag.color = updatedTag.color
        }
        return tag
      })
      cache.updateTagColorInAllSpaces(updatedTag)
    }

  }
})
