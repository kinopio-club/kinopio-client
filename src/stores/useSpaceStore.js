import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useApiStore } from '@/stores/useApiStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

import { useGlobalStore } from '@/stores/useGlobalStore'

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
  state: () => (utils.clone(newSpace)),

  getters: {
    getSpaceAllState () {
      return { ...this.$state }
    },
    getSpaceAllItems () {
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      const space = this.getSpaceAllState
      if (!space) { return }
      space.cards = cardStore.getAllCards
      space.connections = connectionStore.getAllConnections
      space.connectionTypes = connectionStore.getAllConnectionTypes
      space.boxes = boxStore.getAllBoxes
      return space
    },
    getSpaceIsPrivate () {
      return this.privacy === 'private'
    },
    getSpaceIsOpen () {
      return this.privacy === 'open'
    },
    getSpaceUrl () {
      const domain = consts.kinopioDomain()
      const spaceUrl = utils.url({ name: this.name, id: this.id })
      return `${domain}/${spaceUrl}`
    },
    getSpaceCreator () {
      return this.getSpaceMemberById(this.userId) || this.users[0]
    },
    getSpaceCreatorIsUpgraded () {
      const creatorUser = this.getSpaceCreator
      return creatorUser?.isUpgraded
    },
    getSpaceCreatorIsCurrentUser () {
      const userStore = useUserStore()
      const creatorUser = this.getSpaceCreator
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
      return users
    },
    getSpaceMembers () {
      const userStore = useUserStore()
      let users = this.users
      const collaborators = this.collaborators || []
      users = users.concat(collaborators)
      return users
    },
    getSpaceGroupUsers () {
      const groupStore = useGroupStore()
      const group = groupStore.getCurrentSpaceGroup
      return group?.users || []
    },
    getSpaceAndGroupMembers () {
      let users = this.getSpaceMembers
      users = users.concat(this.getSpaceGroupUsers)
      users = uniqBy(users, 'id')
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
    },
    getSpaceSelectedItems () {
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      const globalStore = useGlobalStore()
      const cards = globalStore.multipleCardsSelectedIds.map(cardId => {
        return cardStore.getCard(cardId)
      })
      const boxes = globalStore.multipleBoxesSelectedIds.map(boxId => {
        return boxStore.getBox(boxId)
      })
      const connections = connectionStore.getAllConnections.filter(connection => {
        const selectedIds = globalStore.multipleCardsSelectedIds.concat(globalStore.multipleBoxesSelectedIds)
        const isStartCardMatch = selectedIds.includes(connection.startItemId)
        const isEndCardMatch = selectedIds.includes(connection.endItemId)
        return isStartCardMatch && isEndCardMatch
      })
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const connectionTypes = connectionTypeIds.map(id => connectionStore.getConnectionType(id))
      return { cards, connectionTypes, connections, boxes }
    },
    getSpaceItemColors () {
      const cardStore = useCardStore()
      const boxStore = useBoxStore()
      const cardColors = cardStore.getCardColors
      const boxColors = boxStore.getboxColors
      const colors = cardColors.concat(boxColors)
      return uniq(colors)
    },
    getSpaceTags () {
      return uniqBy(this.tags, 'name')
    }
  },

  actions: {

    // websocket receive
    updateUser (updatedUser) {
      this.users = utils.updateUsersWithUser(this.users, updatedUser)
    },
    // websocket receive
    updateCollaborator (updatedUser) {
      this.collaborators = utils.updateUsersWithUser(this.collaborators, updatedUser)
    },
    // websocket receive
    updateSpectator (updatedUser) {
      this.spectators = utils.updateUsersWithUser(this.spectators, updatedUser)
    },
    getSpaceTagByName (name) {
      const tags = this.tags.find(tag => {
        return tag.name === name
      })
      return tags
    },
    getSpaceTagsInCard (card) {
      return this.tags.filter(tag => tag.cardId === card.id)
    },
    getSpaceItemById (itemId) {
      if (!itemId) { return }
      const cardStore = useCardStore()
      const boxStore = useBoxStore()
      const card = cardStore.getCard(itemId)
      const box = boxStore.getBox(itemId)
      return card || box
    },
    getSpaceIsFavorite (spaceId) {
      const userStore = useUserStore()
      spaceId = spaceId || this.id
      const favoriteSpaces = userStore.favoriteSpaces
      let value = favoriteSpaces.find(favoriteSpace => favoriteSpace.id === spaceId)
      value = Boolean(value)
      return value
    },
    async getSpaceIsNotCached (spaceId) {
      const spaceCardsCount = await cache.space(spaceId).cards?.length
      return Boolean(!spaceCardsCount)
    },
    async getNewItems (items, spaceId) {
      items = items || this.getSpaceSelectedItems
      items = utils.clone(items)
      spaceId = spaceId || this.id
      let newItems = await utils.uniqueSpaceItems(items)
      newItems = await utils.updateSpaceItemsSpaceId(newItems, spaceId)
      return newItems
    },
    getSpaceIsHiddenById (spaceId) {
      const userStore = useUserStore()
      const hiddenSpaces = userStore.hiddenSpaces || []
      let value = hiddenSpaces.find(hiddenSpace => hiddenSpace?.id === spaceId)
      value = Boolean(value)
      return value
    },
    getSpaceIsInbox (spaceName) {
      spaceName = spaceName || this.name
      return spaceName === 'Inbox'
    },

    // user getters

    getSpaceMemberById (userId) {
      const members = this.getSpaceMembers
      return members.find(member => member.id === userId)
    },
    getSpaceUserById (userId) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const groupStore = useGroupStore()
      // current user
      if (userStore.id === userId) {
        return userStore
      }
      // collaborators
      const user = this.getSpaceMemberById(userId)
      if (user?.id === userId) {
        return user
      }
      // commenters
      const otherUser = globalStore.getOtherUserById(userId)
      if (otherUser) {
        return otherUser
      }
      // group user
      const groupUser = groupStore.getGroupUser({ userId })
      return groupUser
    },
    getSpaceReadOnlyKey (space) {
      const globalStore = useGlobalStore()
      const readOnlyKey = globalStore.spaceReadOnlyKey
      if (space.id === readOnlyKey.spaceId) {
        return readOnlyKey.key
      } else {
        return null
      }
    },

    // init

    async initializeSpace () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      globalStore.isLoadingSpace = true
      const spaceUrl = globalStore.spaceUrlToLoad
      const cachedSpaces = await cache.getAllSpaces()
      // restore from url
      if (spaceUrl) {
        console.info('🚃 Restore space from url', spaceUrl)
        const spaceId = utils.spaceIdFromUrl(spaceUrl)
        const space = { id: spaceId }
        await this.loadSpace(space)
      // restore inbox space
      } else if (globalStore.loadInboxSpace) {
        console.info('🚃 Restore inbox space')
        await this.loadInboxSpace()
      // create new space
      } else if (globalStore.loadNewSpace) {
        console.info('🚃 Create new space')
        await this.createSpace()
        globalStore.loadNewSpace = false
      // restore last space
      } else if (userStore.lastSpaceId) {
        console.info('🚃 Restore last space', userStore.lastSpaceId)
        await this.loadLastSpace()
      // restore cached space
      } else if (cachedSpaces.length) {
        const space = cachedSpaces[0]
        console.log('🚃 Restore space from cache', space)
        await this.loadSpace(space)
      // hello kinopio
      } else {
        console.info('🚃 Create and restore hello space')
        shouldLoadNewHelloSpace = true
      }
      await this.checkIfShouldCreateNewUserSpaces()
      globalStore.triggerUpdateWindowHistory()
      globalStore.isLoadingSpace = false
      broadcastStore.connect()
    },

    // load

    async loadPrevSpaceInSession () {
      const globalStore = useGlobalStore()
      const prevSpaceIdInSession = globalStore.prevSpaceIdInSession
      const prevSpacePosition = globalStore.prevSpaceIdInSessionPagePosition
      if (!prevSpaceIdInSession) { return }
      let space = await cache.space(prevSpaceIdInSession)
      if (space.id) {
        await this.changeSpace(space)
      } else if (prevSpaceIdInSession) {
        space = { id: prevSpaceIdInSession }
        await this.changeSpace(space)
      }
      window.scroll({
        left: prevSpacePosition.x,
        top: prevSpacePosition.y,
        behavior: 'instant'
      })
    },
    restoreSpace (space) {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const boxStore = useBoxStore()
      const connectionStore = useConnectionStore()
      space = utils.removeRemovedCardsFromSpace(space)
      // initialize items
      cardStore.initializeCards(space?.cards)
      boxStore.initializeBoxes(space?.boxes)
      connectionStore.initializeConnectionTypes(space?.connectionTypes)
      connectionStore.initializeConnections(space?.connections)
      this.$state = space
      console.log('🍍 restoreSpace', this.getSpaceAllState)
      globalStore.resetPageSizes()
      globalStore.updatePageSizes()
    },
    async getRemoteSpace (space) {
      const userStore = useUserStore()
      const apiStore = useApiStore()
      const globalStore = useGlobalStore()
      const collaboratorKey = globalStore.spaceCollaboratorKeys.find(key => key.spaceId === space.id)
      if (collaboratorKey) {
        space.collaboratorKey = collaboratorKey.collaboratorKey
      }
      let remoteSpace
      try {
        if (userStore.getUserIsSignedIn) {
          remoteSpace = await apiStore.getSpace({ space })
        } else if (collaboratorKey) {
          space.collaboratorKey = collaboratorKey
          remoteSpace = await apiStore.getSpaceAnonymously(space)
          cache.saveInvitedSpace(remoteSpace)
          globalStore.clearSpaceCollaboratorKeys()
        } else if (this.getSpaceIsRemote) {
          remoteSpace = await apiStore.getSpaceAnonymously(space)
        }
        return remoteSpace
      } catch (error) {
        console.error('🚒 getRemoteSpace', space.id, error)
        loadSpaceIdsError.push(space.id)
        throw error
      }
    },
    async loadRemoteSpace (space) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      let remoteSpace
      try {
        remoteSpace = await this.getRemoteSpace(space)
      } catch (error) {
        console.warn('🚑 loadRemoteSpace', error.status, error, space.id)
        const preventRepeatError = loadSpaceIdsError.includes(space.id)
        if (preventRepeatError) {
          globalStore.updateNotifySpaceNotFound(true)
          return
        }
        if (error.status === 404) {
          globalStore.updateNotifySpaceNotFound(true)
          this.loadLastSpace(space) //
        }
        if (error.status === 401) {
          globalStore.updateNotifySpaceNotFound(true)
          this.removeLocalSpaceIfUserIsRemoved(space) //
          this.loadLastSpace(space) //
          cache.removeInvitedSpace(space)
          userStore.updateUserFavoriteSpace(space, false)
        }
        if (error.status === 500) {
          globalStore.updateNotifyConnectionError(true)
        }
      }
      if (!remoteSpace) {
        globalStore.isLoadingSpace = false
        return
      }
      // only restore current space
      if (remoteSpace.id !== this.id) { return }
      return utils.normalizeRemoteSpace(remoteSpace)
    },
    restoreSpaceLocal (space) {
      const historyStore = useHistoryStore()
      const emptySpace = utils.emptySpace(space.id)
      this.restoreSpace(emptySpace)
      historyStore.reset()
      this.restoreSpace(space)
      console.info('🎑 local space', space)
      return space
    },
    async restoreSpaceRemote (space) {
      const historyStore = useHistoryStore()
      const cardStore = useCardStore()
      isLoadingRemoteSpace = true
      space = utils.normalizeSpace(space)
      space.spectators = []
      historyStore.redoLocalUpdates()
      this.restoreSpace(space)
      historyStore.reset()
    },
    async loadSpace (space) {
      const globalStore = useGlobalStore()
      const groupStore = useGroupStore()
      isLoadingRemoteSpace = false
      space.connections = utils.migrationConnections(space.connections)
      globalStore.spaceZoomPercent = 100
      globalStore.isAddPage = false
      const cachedSpace = await cache.space(space.id) || space
      cachedSpace.id = cachedSpace.id || space.id
      space = utils.normalizeSpace(cachedSpace)
      globalStore.resetStateMeta()
      globalStore.resetPageSizes()
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
        globalStore.triggerUpdateWindowTitle()
        groupStore.loadGroup(remoteSpace)
        this.updateSpacePreviewImage()
        // space
        await this.restoreSpaceRemote(remoteSpace)
        this.saveSpaceToCache()
        this.notifySpaceIsOpen()
        this.updateUserLastSpaceId()
        globalStore.isLoadingSpace = false
        globalStore.triggerDrawingInitialize()
        this.updateOtherUsers()
      } catch (error) {
        console.error('🚒 Error fetching remoteSpace', error)
      }
      globalStore.updateCurrentSpaceIsUnavailableOffline(space.id)
      globalStore.updateCurrentUserIsInvitedButCannotEditCurrentSpace(space)
      // focus card
      const cardId = globalStore.focusOnCardId
      if (cardId) {
        globalStore.triggerScrollCardIntoView(cardId)
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
    async changeSpace (space) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      globalStore.updatePrevSpaceIdInSession(this.id)
      globalStore.updatePrevSpaceIdInSessionPagePosition()
      globalStore.clearAllInteractingWithAndSelected()
      console.info('🚟 Change space', space)
      globalStore.isLoadingSpace = true
      globalStore.notifySpaceIsRemoved = false
      globalStore.currentUserToolbar = 'card'
      space = utils.migrationEnsureRemovedCards(space)
      await this.loadSpace(space)
      globalStore.triggerUpdateWindowHistory()
      const userIsMember = userStore.getUserIsSpaceMember
      if (!userIsMember) { return }
      globalStore.parentCardId = ''
      this.updateUserLastSpaceId()
      const cardId = globalStore.loadSpaceFocusOnCardId
      if (cardId) {
        globalStore.updateFocusOnCardId(cardId)
      }
      globalStore.restoreMultipleSelectedItemsToLoad()
      const body = { id: space.id, updatedAt: new Date() }
      await apiStore.addToQueue({
        name: 'updateSpace',
        body
      })
      await cache.updateSpace('updatedAt', body.updatedAt, space.id)
    },

    // save

    async saveSpace () {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const space = this.getSpaceAllState
      const user = userStore.getUserAllState
      console.info('✨ saveSpace', space, user)
      cache.saveSpace(space)
      this.addUserToSpace(user)
      this.incrementCardsCreatedCountFromSpace(space)
      globalStore.isLoadingSpace = false
      globalStore.triggerUpdateWindowHistory()
      await apiStore.addToQueue({
        name: 'createSpace',
        body: space
      })
    },
    saveSpaceToCache () {
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember
      if (!isSpaceMember) { return }
      if (this.isRemoved) { return }
      cache.saveSpace(this.getSpaceAllState)
    },

    // create

    async restoreRemovedSpace (space) {
      const apiStore = useApiStore()
      await cache.restoreRemovedSpace(space)
      const restoredSpace = await apiStore.restoreRemovedSpace(space)
      space = restoredSpace || space
      this.incrementCardsCreatedCountFromSpace(space)
      this.changeSpace(space)
    },
    async duplicateSpace () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      const space = this.getSpaceAllItems
      const user = userStore.getUserAllState
      broadcastStore.leaveSpaceRoom({ user: { id: user.id }, type: 'userLeftRoom' })
      let uniqueNewSpace = utils.resetSpaceMeta({ space, user, type: 'copy' })
      uniqueNewSpace = await cache.updateIdsInSpace(space)
      globalStore.clearSearch()
      isLoadingRemoteSpace = false
      globalStore.resetPageSizes()
      this.restoreSpace(uniqueNewSpace)
      await this.saveSpace()
      globalStore.addNotification({ message: 'Duplicated Space', type: 'success' })
    },
    async createNewSpace (name) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const user = userStore.getUserAllState
      globalStore.triggerSpaceZoomReset()
      let space = utils.clone(newSpace)
      space = utils.resetSpaceMeta({ space, user })
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
        space.cards = [
          {
            id: '1',
            x: 94,
            y: 296,
            z: 0,
            name: 'Get your thoughts, ideas and feelings out',
            width: 200,
            height: 51
          },
          {
            id: 'wQ9-NzxQyWoIGGKEgHRMF',
            x: 151,
            y: 373,
            name: 'Connect them together\n\n[Help and Tutorials](https://help.kinopio.club)',
            z: 3,
            width: 193,
            height: 69
          }
        ]
        space.connections = [
          {
            startItemId: '1',
            endItemId: 'wQ9-NzxQyWoIGGKEgHRMF',
            path: 'm255,323 q90,40 48,77',
            id: 'gg7DEsxy0n3syEkxfKKS4',
            connectionTypeId: 'TDbVDxv4cebeN_99XAz8T'
          }
        ]
        space.connectionTypes = [
          {
            id: 'TDbVDxv4cebeN_99XAz8T',
            name: 'Connection Type 1',
            color: randomColor({ luminosity: 'light' })
          }
        ]
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
          name: `${moonPhaseSystemCommandIcon} ${date} ${globalStore.getDateImageUrl}`,
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
      globalStore.clearSearch()
      isLoadingRemoteSpace = false
      await this.restoreSpace(uniqueNewSpace)
    },
    async createSpace () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      const user = { id: userStore.id }
      broadcastStore.leaveSpaceRoom({ user: { id: user.id }, type: 'userLeftRoom' })
      await this.createNewSpace()
      await this.saveSpace()
      this.updateUserLastSpaceId()
      globalStore.notifySignUpToEditSpace = false
    },
    async saveImportSpace (space) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      const apiStore = useApiStore()
      const user = userStore.getUserAllState
      broadcastStore.leaveSpaceRoom({ user: { id: user.id }, type: 'userLeftRoom' })
      globalStore.clearSearch()
      globalStore.resetPageSizes()
      console.info('✨ saveImportSpace', space, user)
      cache.saveSpace(space)
      this.restoreSpace(space)
      this.addUserToSpace(user)
      this.incrementCardsCreatedCountFromSpace(space)
      globalStore.isLoadingSpace = false
      globalStore.triggerUpdateWindowHistory()
      await apiStore.addToQueue({
        name: 'createSpace',
        body: space
      })
    },
    async createNewHelloSpace () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const user = userStore.getUserAllState
      let space = utils.newHelloSpace(user)
      space = utils.updateSpaceCardsCreatedThroughPublicApi(space)
      space.id = nanoid()
      space.collaboratorKey = nanoid()
      space.readOnlyKey = nanoid()
      if (shouldLoadNewHelloSpace) {
        space = await cache.updateIdsInSpace(space)
        globalStore.clearSearch()
        globalStore.resetPageSizes()
        this.restoreSpace(space)
        this.addUserToSpace(user)
        this.updateOtherUsers()
        this.updateOtherItems()
      } else {
        space.users = [user]
        const nullCardUsers = true
        await cache.updateIdsInSpace(space, nullCardUsers)
      }
      globalStore.triggerUpdateWindowTitle()
    },
    async createNewInboxSpace (shouldCreateWithoutLoading) {
      const globalStore = useGlobalStore()
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
        globalStore.isLoadingSpace = true
        globalStore.clearSearch()
        isLoadingRemoteSpace = false
        globalStore.resetPageSizes()
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

    updateSpacePreviewImage: throttle(async function () {
      const userStore = useUserStore()
      const apiStore = useApiStore()
      const isSignedIn = userStore.getUserIsSignedIn
      const canEditSpace = userStore.getUserCanEditSpace
      const isPrivate = this.getSpaceIsPrivate
      if (!isSignedIn) { return }
      if (!canEditSpace) { return }
      if (isPrivate) { return }
      const response = await apiStore.updateSpacePreviewImage(this.id)
      console.info('🙈 updated space preview image', response?.urls)
    }, 10 * 1000), // 10 seconds
    updateUserLastSpaceId () {
      const userStore = useUserStore()
      const isSignedIn = userStore.getUserIsSignedIn
      const isPrivate = this.getSpaceIsPrivate
      const canEdit = userStore.getUserCanEditSpace
      const isReadOnlyInvite = isPrivate && !canEdit
      if (isReadOnlyInvite) { return }
      userStore.updateUser({ lastSpaceId: this.id })
    },
    async updateOtherUsers () {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const cardStore = useCardStore()
      const cards = cardStore.getAllCards
      let userIds = []
      const spaceMemberIds = this.users.map(user => user.id)
      const spaceCollaboratorIds = this.collaborators.map(user => user.id)
      userIds = userIds.concat(spaceMemberIds)
      userIds = userIds.concat(spaceCollaboratorIds)
      let otherUserIds = []
      cards.forEach(card => {
        const userId = card.nameUpdatedByUserId || card.userId
        const isOtherUser = userIds.includes(userId)
        if (!isOtherUser) {
          otherUserIds.push(userId)
        }
      })
      otherUserIds = uniq(otherUserIds)
      if (!otherUserIds.length) { return }
      try {
        const users = await apiStore.getPublicUsers(otherUserIds)
        users.forEach(user => {
          globalStore.updateOtherUsers(user)
        })
      } catch (error) {
        console.warn('🚑 updateOtherUsers', error)
      }
    },
    async updateOtherItems (options) {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const userStore = useUserStore()
      const apiStore = useApiStore()
      const canEditSpace = userStore.getUserCanEditSpace
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
          const space = globalStore.getOtherSpaceById(spaceId)
        } else if (cardId) {
          const card = globalStore.otherCardById(cardId)
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
      await apiStore.addToGetOtherItemsQueue({ spaceIds, cardIds, invites })
    },
    async updateSpace (update) {
      const apiStore = useApiStore()
      const keys = Object.keys(update)
      const broadcastStore = useBroadcastStore()
      for (const key of keys) {
        this[key] = update[key]
      }
      update.id = this.id
      if (update.isFromBroadcast) { return }
      broadcastStore.update({ updates: update, store: 'spaceStore', action: 'updateSpace' })
      await apiStore.addToQueue({ name: 'updateSpace', body: update })
      await cache.updateSpaceByUpdates(update, this.id)
    },
    updateGroupMeta (space) {
      this.groupId = space.groupId
      this.addedToGroupByUserId = space.addedToGroupByUserId
    },
    async updateSpaceEditedAt () {
      const userStore = useUserStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      await this.updateSpace({
        editedAt: new Date(),
        editedByUserId: userStore.id
      })
    },

    // remove

    async removeSpace () {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const space = this.getSpaceAllState
      this.decrementCardsCreatedCountFromSpace(space)
      await cache.removeSpace(space)
      globalStore.prevSpaceIdInSession = ''
      await apiStore.addToQueue({
        name: 'removeSpace',
        body: { id: space.id }
      })
    },
    async deleteSpace (space) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      await cache.deleteSpace(space)
      globalStore.prevSpaceIdInSession = ''
      await apiStore.addToQueue({
        name: 'deleteSpace',
        body: space
      })
    },
    async deleteAllRemovedSpaces () {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const userId = userStore.id
      const removedSpaces = await cache.getAllRemovedSpaces()
      for (const space of removedSpaces) {
        await cache.deleteSpace(space)
      }
      await apiStore.addToQueue({ name: 'deleteAllRemovedSpaces', body: { userId } })
    },
    async removeCurrentUserFromSpace () {
      const globalStore = useGlobalStore()
      const spaceIdToRemove = this.id
      const name = this.name
      const space = { id: spaceIdToRemove }
      this.loadLastSpace()
      await cache.removeSpace(space)
      globalStore.addNotification({ message: `You were removed as a collaborator from ${name}`, type: 'info' })
    },
    removeEmptyCards () {
      const cardStore = useCardStore()
      const cards = cardStore.getAllCards
      cards.forEach(card => {
        if (!card.name) {
          cardStore.removeCard(card)
        }
      })
    },

    // users

    async addUserToSpace (newUser) {
      const userExists = this.users.find(user => user.id === newUser.id)
      if (userExists) { return }
      this.users.push(newUser)
      await cache.updateSpace('users', this.users, this.id)
    },
    async addCollaboratorToSpace (newUser) {
      const collaboratorExists = this.collaborators.find(collaborator => collaborator.id === newUser.id)
      if (collaboratorExists) { return }
      this.collaborators.push(newUser)
      const space = this.getSpaceAllState
      await cache.saveSpace(space)
      await cache.updateSpace('collaborators', space.collaborators, space.id)
    },
    addSpectatorToSpace (newUser) {
      this.spectators.push(newUser)
      this.spectators = uniqBy(this.spectators, 'id')
    },
    updateSpaceClients (updates) {
      this.clients = this.clients.concat(updates)
      this.clients = uniqBy(this.clients, 'id')
    },
    removeIdleClientFromSpace (removeUser) {
      const spectators = this.spectators || []
      const clients = this.clients || []
      this.spectators = spectators.filter(user => {
        return user.id !== removeUser.id
      })
      this.clients = clients.filter(user => {
        return user?.id !== removeUser.id
      })
    },
    updateUserPresence (update) {
      const newUser = update.user || update
      const member = this.getSpaceMemberById(newUser.id)
      if (member) {
        this.updateSpaceClients([newUser])
      } else {
        this.addSpectatorToSpace(newUser)
      }
      // ping idle client timer
      const idleClientTime = 60 * 1000 // 60 seconds
      clearTimeout(idleClientTimers[newUser.id])
      const removeIdleClient = (newUser) => {
        this.removeIdleClientFromSpace(newUser)
      }
      idleClientTimers[newUser.id] = setTimeout(() => {
        removeIdleClient(newUser)
      }, 60 * 1000) // 60 seconds
    },
    addUserToJoinedSpace (newUser) {
      if (newUser.isCollaborator) {
        this.addCollaboratorToSpace(newUser)
        this.removeIdleClientFromSpace(newUser)
      } else {
        this.updateUserPresence(newUser)
      }
    },
    async removeCollaboratorFromSpace (user, isFromBroadcast) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      const space = this.getSpaceAllState
      this.collaborators = this.collaborators.filter(collaborator => {
        return collaborator.id !== user.id
      })
      await cache.updateSpace('collaborators', this.collaborators, this.id)
      if (isFromBroadcast) {
        broadcastStore.update({ updates: user, name: 'userLeftSpace' })
        apiStore.removeSpaceCollaborator({ space, user })
      }
      const isCurrentUser = userStore.getUserIsCurrentUser(user)
      if (isCurrentUser) {
        this.loadLastSpace()
        cache.removeInvitedSpace(space)
        cache.deleteSpace(space)
        globalStore.addNotification({ message: `You left ${space.name}`, type: 'success' })
      } else {
        const userName = user.name || 'User'
        globalStore.addNotification({ message: `${userName} removed from space`, type: 'success' })
      }
    },
    async removeUserFromSpace (removeUser) {
      utils.typeCheck({ value: removeUser, type: 'object' })
      this.users = this.users.filter(user => {
        return user.id !== removeUser.id
      })
      await cache.updateSpace('users', this.users, this.id)
    },

    // notify

    notifySpaceIsOpen () {
      const globalStore = useGlobalStore()
      if (this.isRemoved) { return }
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember
      if (!isSpaceMember && this.getSpaceIsOpen) {
        globalStore.addNotification({ message: 'This space is open to comments', icon: 'comment', type: 'success' })
      }
    },

    // user card count

    checkIfShouldNotifyCardsCreatedIsNearLimit () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      if (this.getSpaceCreatorIsUpgraded) { return }
      if (userStore.isUpgraded) { return }
      const cardsCreatedLimit = consts.cardsCreatedLimit
      const value = cardsCreatedLimit - userStore.cardsCreatedCount
      if (utils.isBetween({ value, min: 0, max: 15 })) {
        globalStore.notifyCardsCreatedIsNearLimit = true
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

    async addTag (tag) {
      this.tags.push(tag)
      await cache.updateSpace('tags', this.tags, this.id)
    },
    async removeTag (tag) {
      this.tags = this.tags.filter(spaceTag => spaceTag.id !== tag.id)
      await cache.updateSpace('tags', this.tags, this.id)
    },
    async removeTags (tag) {
      this.tags = this.tags.filter(spaceTag => spaceTag.name !== tag.name)
      await cache.removeTagsByNameInAllSpaces(tag)
    },
    async removeTagsFromCard (card) {
      this.tags = this.tags.filter(spaceTag => {
        return spaceTag.cardId !== card.id
      })
      await cache.updateSpace('tags', this.tags, this.id)
    },
    async deleteTagsFromAllRemovedCardsPermanent () {
      const cardIds = this.removedCards.map(card => card.id)
      this.tags = this.tags.filter(spaceTag => {
        return !cardIds.includes(spaceTag.cardId)
      })
      await cache.updateSpace('tags', this.tags, this.id)
    },
    async updateTagNameColor (updatedTag) {
      this.tags = this.tags.map(tag => {
        if (tag.name === updatedTag.name) {
          tag.color = updatedTag.color
        }
        return tag
      })
      await cache.updateTagColorInAllSpaces(updatedTag)
    },
    async removeUnusedTagsFromCard (cardId) {
      const cardStore = useCardStore()
      const card = cardStore.getCard(cardId)
      if (!card) { return }
      const cardTagNames = utils.tagsFromStringWithoutBrackets(card.name) || []
      const tagsInCard = this.getSpaceTagsInCard({ id: cardId })
      const tagsToRemove = tagsInCard.filter(tag => !cardTagNames.includes(tag.name))
      for (const tag of tagsToRemove) {
        await this.removeTag(tag)
      }
    },

    // items

    createSpaceItems (items) {
      const userStore = useUserStore()
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      const { cards, boxes, connections, connectionTypes, tags } = items
      cards.forEach(card => cardStore.createCard(card))
      boxes.forEach(box => boxStore.createBox(box))
      connections.forEach(connection => {
        let type = connectionTypes.find(connectionType => connectionType.id === connection.connectionTypeId)
        const prevTypeInCurrentSpace = connectionStore.getConnectionTypeByName(type.name)
        type = prevTypeInCurrentSpace || type
        connectionStore.createConnectionType(type)
        connection.connectionTypeId = type.id
        connection.type = type
        connectionStore.createConnection(connection)
      })
      tags.forEach(tag => {
        tag.userId = userStore.id
        this.addTag(tag)
      })
    },
    pauseConnectionDirections (space) {
      const svgs = document.querySelectorAll('svg.connection')
      svgs.forEach(svg => {
        svg.pauseAnimations()
        svg.setCurrentTime(1.5)
      })
    },
    unpauseConnectionDirections (space) {
      const svgs = document.querySelectorAll('svg.connection')
      svgs.forEach(svg => {
        svg.unpauseAnimations()
      })
    },
    checkIfShouldPauseConnectionDirections () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const prefersReducedMotion = consts.userPrefersReducedMotion()
      const userSetting = userStore.shouldPauseConnectionDirections
      const isInteracting = globalStore.getIsInteractingWithItem
      const shouldPause = prefersReducedMotion || userSetting || isInteracting
      if (shouldPause) {
        this.pauseConnectionDirections()
      } else {
        this.unpauseConnectionDirections()
      }
    },

    // inbox

    async updateInboxCache () {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const isSignedIn = userStore.getUserIsSignedIn
      const isOffline = !globalStore.isOnline
      if (this.getSpaceIsInbox) { return }
      if (!isSignedIn) { return }
      if (isOffline) { return }
      const inbox = await apiStore.getUserInboxSpace()
      console.info('🌍 updateInboxCache')
      await cache.saveSpace(inbox)
    }

  }
})
