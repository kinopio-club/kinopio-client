import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'

import inboxSpace from '@/data/inbox.json'
import newSpace from '@/data/new.json'

import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import { nextTick } from 'vue'
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

const currentSpace = {
  namespaced: true,
  state: utils.clone(newSpace),
  mutations: {

    restoreSpace: (state, space) => {
      space = utils.removeRemovedCardsFromSpace(space)
      Object.assign(state, space)
    },

    // Users

    addUserToSpace: (state, newUser) => {
      utils.typeCheck({ value: newUser, type: 'object' })
      const userExists = state.users.find(user => user.id === newUser.id)
      if (userExists) { return }
      state.users.push(newUser)
      cache.updateSpace('users', state.users, state.id)
    },
    addCollaboratorToSpace: (state, newUser) => {
      utils.typeCheck({ value: newUser, type: 'object' })
      const collaboratorExists = state.collaborators.find(collaborator => collaborator.id === newUser.id)
      if (collaboratorExists) { return }
      state.collaborators.push(newUser)
      const space = utils.clone(state)
      cache.saveSpace(space)
      cache.updateSpace('collaborators', space.collaborators, space.id)
    },
    addSpectatorToSpace: (state, newUser) => {
      state.spectators.push(newUser)
      state.spectators = uniqBy(state.spectators, 'id')
    },
    updateSpaceClients: (state, updates) => {
      utils.typeCheck({ value: updates, type: 'array' })
      state.clients = state.clients.concat(updates)
    },
    removeClientsFromSpace: (state) => {
      state.clients = []
    },
    removeIdleClientFromSpace: (state, oldUser) => {
      utils.typeCheck({ value: oldUser, type: 'object' })
      const spectators = state.spectators || []
      const clients = state.clients || []
      state.spectators = spectators.filter(user => {
        return user.id !== oldUser.id
      })
      state.clients = clients.filter(user => {
        return user.id !== oldUser.id
      })
    },
    removeUserFromSpace: (state, oldUser) => {
      utils.typeCheck({ value: oldUser, type: 'object' })
      state.users = state.users.filter(user => {
        return user.id !== oldUser.id
      })
      cache.updateSpace('users', state.users, state.id)
    },
    removeCollaboratorFromSpace: (state, oldUser) => {
      utils.typeCheck({ value: oldUser, type: 'object' })
      state.collaborators = state.collaborators.filter(user => {
        return user.id !== oldUser.id
      })
      cache.updateSpace('collaborators', state.collaborators, state.id)
    },
    updateGroupMeta: (state, space) => {
      state.groupId = space.groupId
      state.addedToGroupByUserId = space.addedToGroupByUserId
    },
    // websocket receive
    updateUser: (state, updatedUser) => {
      state.users = utils.updateUsersWithUser(state.users, updatedUser)
    },
    // websocket receive
    updateCollaborator: (state, updatedUser) => {
      state.collaborators = utils.updateUsersWithUser(state.collaborators, updatedUser)
    },
    // websocket receive
    updateSpectator: (state, updatedUser) => {
      state.spectators = utils.updateUsersWithUser(state.spectators, updatedUser)
    },

    // Space

    updateSpace: (state, updatedSpace) => {
      const updates = Object.keys(updatedSpace)
      updates.forEach(key => {
        state[key] = updatedSpace[key]
      })
    },

    // Tags

    addTag: (state, tag) => {
      state.tags.push(tag)
      cache.updateSpace('tags', state.tags, state.id)
    },
    removeTag: (state, tag) => {
      state.tags = state.tags.filter(spaceTag => spaceTag.id !== tag.id)
      cache.updateSpace('tags', state.tags, state.id)
    },
    removeTags: (state, tag) => {
      state.tags = state.tags.filter(spaceTag => spaceTag.name !== tag.name)
      cache.removeTagsByNameInAllSpaces(tag)
    },
    removeTagsFromCard: (state, card) => {
      state.tags = state.tags.filter(spaceTag => {
        return spaceTag.cardId !== card.id
      })
      cache.updateSpace('tags', state.tags, state.id)
    },
    deleteTagsFromAllRemovedCardsPermanent: (state) => {
      const cardIds = state.removedCards.map(card => card.id)
      state.tags = state.tags.filter(spaceTag => {
        return !cardIds.includes(spaceTag.cardId)
      })
      cache.updateSpace('tags', state.tags, state.id)
    },
    updateTagNameColor: (state, updatedTag) => {
      state.tags = state.tags.map(tag => {
        if (tag.name === updatedTag.name) {
          tag.color = updatedTag.color
        }
        return tag
      })
      cache.updateTagColorInAllSpaces(updatedTag)
    }
  },

  actions: {
    init: async (context) => {
      const userStore = useUserStore()
      context.commit('isLoadingSpace', true, { root: true })
      const spaceUrl = context.rootState.spaceUrlToLoad
      const loadInboxSpace = context.rootState.loadInboxSpace
      const loadBlogSpace = context.rootState.loadBlogSpace
      const loadNewSpace = context.rootState.loadNewSpace
      // restore from url
      if (spaceUrl) {
        console.info('🚃 Restore space from url', spaceUrl)
        const spaceId = utils.spaceIdFromUrl(spaceUrl)
        const space = { id: spaceId }
        await context.dispatch('loadSpace', { space })
      // restore inbox space
      } else if (loadInboxSpace) {
        console.info('🚃 Restore inbox space')
        await context.dispatch('loadInboxSpace')
      // load blog space
      } else if (loadBlogSpace) {
        console.info('🚃 Load blog space')
        await context.dispatch('loadBlogSpace')
      // create new space
      } else if (loadNewSpace) {
        console.info('🚃 Create new space')
        await context.dispatch('addSpace')
        context.commit('loadNewSpace', false, { root: true })
      // restore last space
      } else if (userStore.lastSpaceId) {
        console.info('🚃 Restore last space', userStore.lastSpaceId)
        await context.dispatch('loadLastSpace')
      // hello kinopio
      } else {
        console.info('🚃 Create and restore hello space')
        shouldLoadNewHelloSpace = true
      }
      await context.dispatch('checkIfShouldCreateNewUserSpaces')
      context.dispatch('updateModulesSpaceId')
      context.commit('triggerUpdateWindowHistory', null, { root: true })
      context.dispatch('checkIfShouldShowExploreOnLoad')
    },
    updateSpacePreviewImage: throttle(async function (context) {
      const userStore = useUserStore()
      const currentUserIsSignedIn = userStore.getUserIsSignedIn
      const canEditSpace = userStore.getUserCanEditSpace()
      const isPrivate = context.state.privacy === 'private'
      if (!currentUserIsSignedIn) { return }
      if (!canEditSpace) { return }
      if (isPrivate) { return }
      const response = await context.dispatch('api/updateSpacePreviewImage', context.state.id, { root: true })
      console.info('🙈 updated space preview image', response?.urls)
    }, 10 * 1000), // 10 seconds
    updateInboxCache: async (context) => {
      const userStore = useUserStore()
      const currentSpaceIsInbox = context.state.name === 'Inbox'
      const currentUserIsSignedIn = userStore.getUserIsSignedIn
      const isOffline = !context.rootState.isOnline
      if (currentSpaceIsInbox) { return }
      if (!currentUserIsSignedIn) { return }
      if (isOffline) { return }
      const inbox = await context.dispatch('api/getUserInboxSpace', null, { root: true })
      console.info('🌍 updateInboxCache')
      cache.saveSpace(inbox)
    },

    // Users

    updateUserPresence: (context, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      const newUser = update.user || update
      const member = context.getters.memberById(newUser.id)
      if (member) {
        context.commit('updateSpaceClients', [newUser])
      } else {
        context.commit('addSpectatorToSpace', newUser)
      }
      // ping idle client timer
      const idleClientTime = 60 * 1000 // 60 seconds
      clearTimeout(idleClientTimers[newUser.id])
      const removeIdleClient = (newUser) => {
        context.commit('removeIdleClientFromSpace', newUser)
      }
      idleClientTimers[newUser.id] = setTimeout(() => {
        removeIdleClient(newUser)
      }, 60 * 1000) // 60 seconds
    },
    addUserToJoinedSpace: (context, newUser) => {
      if (newUser.isCollaborator) {
        context.commit('addCollaboratorToSpace', newUser)
        context.commit('removeIdleClientFromSpace', newUser)
      } else {
        context.dispatch('updateUserPresence', newUser)
      }
    },

    // Other Items

    updateOtherUsers: async (context) => {
      const cardStore = useCardStore()
      const cards = cardStore.getAllCards
      let userIds = []
      const spaceMemberIds = utils.clone(context.state.users).map(user => user.id)
      const spaceCollaboratorIds = utils.clone(context.state.collaborators).map(user => user.id)
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
        const users = await context.dispatch('api/getPublicUsers', otherUserIds, { root: true })
        users.forEach(user => {
          context.commit('updateOtherUsers', user, { root: true })
        })
      } catch (error) {
        console.warn('🚑 updateOtherUsers', error)
      }
    },
    updateOtherItems: async (context, options) => {
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
          const space = context.rootGetters.otherSpaceById(spaceId)
        } else if (cardId) {
          const card = context.rootGetters.otherCardById(cardId)
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
      await context.dispatch('api/addToGetOtherItemsQueue', { spaceIds, cardIds, invites }, { root: true })
    },

    // Space

    checkIfShouldCreateNewUserSpaces: async (context) => {
      const userStore = useUserStore()
      const spaces = await cache.getAllSpaces()
      if (userStore.getUserIsSignedIn) { return }
      if (spaces.length) { return }
      await context.dispatch('createNewInboxSpace', true)
      await context.dispatch('createNewHelloSpace')
      context.dispatch('updateUserLastSpaceId')
    },
    createNewHelloSpace: async (context) => {
      const userStore = useUserStore()
      const user = userStore.$state
      let space = utils.newHelloSpace(user)
      space = utils.updateSpaceCardsCreatedThroughPublicApi(space)
      space.id = nanoid()
      space.collaboratorKey = nanoid()
      space.readOnlyKey = nanoid()
      if (shouldLoadNewHelloSpace) {
        space = await cache.updateIdsInSpace(space)
        context.commit('clearSearch', null, { root: true })
        context.commit('resetPageSizes', null, { root: true })
        context.dispatch('restoreSpace', { space })
        context.commit('addUserToSpace', user)
        context.dispatch('updateOtherUsers')
        context.dispatch('updateOtherItems')
      } else {
        space.users = [user]
        const nullCardUsers = true
        await cache.updateIdsInSpace(space, nullCardUsers)
      }
      context.commit('triggerUpdateWindowTitle', null, { root: true })
    },
    createNewSpace: async (context, space) => {
      const userStore = useUserStore()
      const user = userStore.$state
      context.commit('triggerSpaceZoomReset', null, { root: true })
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
          name: `${moonPhaseSystemCommandIcon} ${date} ${context.rootGetters.dateImageUrl}`,
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
      context.commit('clearSearch', null, { root: true })
      isLoadingRemoteSpace = false
      context.commit('resetPageSizes', null, { root: true })
      await context.dispatch('restoreSpace', { space: uniqueNewSpace })
    },
    createNewInboxSpace: async (context, shouldCreateWithoutLoading) => {
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
        context.commit('isLoadingSpace', true, { root: true })
        context.commit('clearSearch', null, { root: true })
        isLoadingRemoteSpace = false
        context.commit('resetPageSizes', null, { root: true })
        context.dispatch('restoreSpace', { space })
        nextTick(() => {
          cardStore.updateCardsDimensions()
        })
      }
    },
    saveNewSpace: async (context) => {
      const space = utils.clone(context.state)
      const userStore = useUserStore()
      const user = userStore.$state
      console.info('✨ saveNewSpace', space, user)
      cache.saveSpace(space)
      context.commit('addUserToSpace', user)
      // nextTick(() => {
      // })
      context.dispatch('updateModulesSpaceId', space)
      context.dispatch('incrementCardsCreatedCountFromSpace', space)
      context.commit('isLoadingSpace', false, { root: true })
      context.commit('triggerUpdateWindowHistory', null, { root: true })
      await context.dispatch('api/addToQueue', {
        name: 'createSpace',
        body: space
      }, { root: true })

      // const cardStore = useCardStore()
      // cardStore.updateCardsDimensions()
    },
    saveSpace: async (context, space) => {
      const userStore = useUserStore()
      const user = userStore.$state
      cache.saveSpace(space)
      if (userStore.getUserIsSignedIn) {
        await context.dispatch('api/createSpace', space, { root: true })
      }
      context.commit('triggerUpdateWindowHistory', space, { root: true })
      context.commit('addUserToSpace', user)
      context.dispatch('updateModulesSpaceId', space)
      context.dispatch('incrementCardsCreatedCountFromSpace', space)
    },
    duplicateSpace: async (context, space) => {
      space = space || context.state
      space = utils.clone(space)
      const userStore = useUserStore()
      const user = userStore.$state
      context.commit('broadcast/leaveSpaceRoom', { user: { id: user.id }, type: 'userLeftRoom' }, { root: true })
      let uniqueNewSpace = utils.resetSpaceMeta({ space, user, type: 'copy' })
      uniqueNewSpace = await cache.updateIdsInSpace(space)
      context.commit('clearSearch', null, { root: true })
      isLoadingRemoteSpace = false
      context.commit('resetPageSizes', null, { root: true })
      context.dispatch('restoreSpace', { space: uniqueNewSpace })
      await context.dispatch('saveNewSpace')
      context.commit('addNotification', { message: 'Duplicated Space', type: 'success' }, { root: true })
    },
    addSpace: async (context, space) => {
      const userStore = useUserStore()
      const user = { id: userStore.id }
      context.commit('broadcast/leaveSpaceRoom', { user: { id: user.id }, type: 'userLeftRoom' }, { root: true })
      await context.dispatch('createNewSpace', space)
      await context.dispatch('saveNewSpace')
      context.dispatch('updateUserLastSpaceId')
      context.commit('notifySignUpToEditSpace', false, { root: true })
    },
    addInboxSpace: async (context) => {
      const userStore = useUserStore()
      const user = { id: userStore.id }
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      await context.dispatch('createNewInboxSpace')
      await context.dispatch('saveNewSpace')
      context.dispatch('updateUserLastSpaceId')
      context.commit('notifySignUpToEditSpace', false, { root: true })
    },
    getRemoteSpace: async (context, space) => {
      const userStore = useUserStore()
      const collaboratorKey = context.rootState.spaceCollaboratorKeys.find(key => key.spaceId === space.id)
      if (collaboratorKey) {
        space.collaboratorKey = collaboratorKey.collaboratorKey
      }
      const currentSpaceIsRemote = context.rootGetters['currentSpace/isRemote']
      let remoteSpace
      try {
        if (userStore.getUserIsSignedIn) {
          remoteSpace = await context.dispatch('api/getSpace', { space }, { root: true })
        } else if (collaboratorKey) {
          space.collaboratorKey = collaboratorKey
          remoteSpace = await context.dispatch('api/getSpaceAnonymously', space, { root: true })
          cache.saveInvitedSpace(remoteSpace)
          context.commit('clearSpaceCollaboratorKeys', null, { root: true })
        } else if (currentSpaceIsRemote) {
          remoteSpace = await context.dispatch('api/getSpaceAnonymously', space, { root: true })
        }
        return remoteSpace
      } catch (error) {
        console.error('🚒 getRemoteSpace', space.id, error)
        loadSpaceIdsError.push(space.id)
        throw error
      }
    },
    loadRemoteSpace: async (context, space) => {
      const userStore = useUserStore()
      let remoteSpace
      try {
        remoteSpace = await context.dispatch('getRemoteSpace', space)
      } catch (error) {
        console.warn('🚑 loadRemoteSpace', error.status, error, space.id)
        const preventRepeatError = loadSpaceIdsError.includes(space.id)
        if (preventRepeatError) {
          context.commit('notifySpaceNotFound', true, { root: true })
          return
        }
        if (error.status === 404) {
          context.commit('notifySpaceNotFound', true, { root: true })
          context.dispatch('loadLastSpace', space)
        }
        if (error.status === 401) {
          context.commit('notifySpaceNotFound', true, { root: true })
          context.dispatch('removeLocalSpaceIfUserIsRemoved', space)
          context.dispatch('loadLastSpace', space)
          cache.removeInvitedSpace(space)
          userStore.updateUserFavoriteSpace(space, false)
        }
        if (error.status === 500) {
          context.commit('notifyConnectionError', true, { root: true })
        }
      }
      if (!remoteSpace) {
        context.commit('isLoadingSpace', false, { root: true })
        return
      }
      // only restore current space
      if (remoteSpace.id !== context.state.id) { return }
      return utils.normalizeRemoteSpace(remoteSpace)
    },
    removeLocalSpaceIfUserIsRemoved: async (context, space) => {
      const userStore = useUserStore()
      const cachedSpace = await cache.space(space.id)
      const currentUserIsRemovedFromSpace = utils.objectHasKeys(cachedSpace)
      userStore.updateUserFavoriteSpace(space, false)
      if (currentUserIsRemovedFromSpace) {
        userStore.clearUserLastSpaceId()
        cache.deleteSpace(space)
        const emptySpace = utils.emptySpace(space.id)
        context.commit('restoreSpace', emptySpace)
      }
    },
    removeCurrentUserFromSpace: (context) => {
      const spaceIdToRemove = context.state.id
      const name = context.state.name
      const space = { id: spaceIdToRemove }
      context.dispatch('loadLastSpace')
      cache.removeSpace(space)
      context.commit('addNotification', { message: `You were removed as a collaborator from ${name}`, type: 'info' }, { root: true })
    },
    removeEmptyCards: (context) => {
      const cardStore = useCardStore()
      const cards = cardStore.getAllCards
      cards.forEach(card => {
        if (!card.name) {
          cardStore.removeCard(card)
        }
      })
    },
    checkIfShouldResetDimensions: (context) => {
      const cardStore = useCardStore()
      const shouldReset = context.rootState.shouldResetDimensionsOnLoad
      if (!shouldReset) { return }
      const cardIds = cardStore.allIds
      cardStore.clearResizeCards(cardIds)
      context.commit('shouldResetDimensionsOnLoad', false, { root: true })
    },
    loadInboxSpace: async (context) => {
      const userStore = useUserStore()
      const inboxSpace = await userStore.getInboxSpace()
      if (inboxSpace) {
        const space = { id: inboxSpace.id }
        context.dispatch('changeSpace', space)
      } else {
        context.commit('addNotification', { message: 'Inbox space not found', type: 'danger' }, { root: true })
        context.dispatch('loadLastSpace')
      }
      context.commit('loadInboxSpace', false, { root: true })
    },
    loadBlogSpace: (context) => {
      const space = { id: consts.blogSpaceId() }
      context.dispatch('changeSpace', space)
    },
    updateModulesSpaceId: (context, space) => {
      const cardStore = useCardStore()
      space = space || context.state
      console.info('💕 update modules space id', space.id) // deprecated
      // context.dispatch('currentCards/updateSpaceId', space.id, { root: true })
      // context.dispatch('currentConnections/updateSpaceId', space.id, { root: true })
      // context.dispatch('currentBoxes/updateSpaceId', space.id, { root: true })
    },

    restoreSpace: async (context, { space, isRemote }) => {
      // if (!utils.objectHasKeys(space)) { return }

      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()

      await cardStore.initializeCards(space.cards)
      await connectionStore.initializeConnections(space.connections)
      await connectionStore.initializeConnectionTypes(space.connectionTypes)
      await boxStore.initializeBoxes(space.boxes)
      // delete space.cards
      // delete space.connections
      // delete space.connectionTypes
      // context.commit('currentBoxes/restore', space.boxes, { root: true }) // replace
      context.commit('restoreSpace', space)

      context.dispatch('restoreRemoteSpaceComplete', { space, isRemote })

      // TODO merge diffs bw local loaded/edited and loaded from remote

      // space.connections = utils.migrationConnections(space.connections)
      // addConnections = utils.migrationConnections(addConnections)
      // console.info('🌱 Restoring space', space, { isRemote, addCards, addConnections, addConnectionTypes, addBoxes })
      // context.commit('isLoadingSpace', true, { root: true })
      // const chunkSize = 50
      // const timeStart = utils.unixTime()
      // const origin = { x: window.scrollX, y: window.scrollY }
      // // init items
      // let cards = addCards || space.cards || []
      // let connectionTypes = addConnectionTypes || space.connectionTypes || []
      // connectionTypes = connectionTypes.filter(type => Boolean(type))
      // let connections = addConnections || space.connections || []
      // cards = utils.normalizeItems(cards)
      // connections = utils.normalizeItems(connections)
      // const boxes = addBoxes || space.boxes || []
      // // sort cards
      // const cardIds = Object.keys(cards)
      // cards = cardIds.map(id => {
      //   const card = cards[id]
      //   card.distanceFromOrigin = utils.distanceBetweenTwoPoints(card, origin)
      //   return card
      // })
      // cards = sortBy(cards, ['distanceFromOrigin'])
      // // page size
      // const itemsRect = utils.pageSizeFromItems(cards)
      // context.commit('resetPageSizes', null, { root: true })
      // context.commit('updatePageSizes', itemsRect, { root: true })
      // // sort connections
      // const connectionIds = Object.keys(connections)
      // connections = connectionIds.map(id => {
      //   const connection = connections[id]
      //   const pathIsEmpty = connection.path === 'm0,0 q00,00 0,0'
      //   if (connection.path && !pathIsEmpty) {
      //     const coords = utils.startCoordsFromConnectionPath(connection.path)
      //     connection.distanceFromOrigin = utils.distanceBetweenTwoPoints(coords, origin)
      //   }
      //   return connection
      // })
      // connections = sortBy(connections, ['distanceFromOrigin'])
      // // restore space
      // if (!isRemote) {
      //   context.commit('currentCards/clear', null, { root: true })
      //   context.commit('currentConnections/clear', null, { root: true })
      //   context.commit('currentBoxes/clear', null, { root: true })
      //   context.dispatch('updateModulesSpaceId', space)
      // }
      // context.commit('isLoadingSpace', true, { root: true })
      // context.commit('restoreSpace', space)
      // // split into chunks
      // const cardChunks = utils.splitArrayIntoChunks(cards, chunkSize)
      // const connectionChunks = utils.splitArrayIntoChunks(connections, chunkSize)
      // let primaryIsCards = true
      // let primaryChunks = cardChunks
      // let secondaryChunks = connectionChunks
      // if (connectionChunks.length > cardChunks.length) {
      //   primaryIsCards = false
      //   primaryChunks = connectionChunks
      //   secondaryChunks = cardChunks
      // }
      // // restore space
      // if (!primaryChunks.length) {
      //   context.commit('currentBoxes/restore', boxes, { root: true })
      //   context.commit('currentConnections/restoreTypes', connectionTypes, { root: true })
      //   context.dispatch('restoreRemoteSpaceComplete', { space, isRemote, timeStart })
      //   return
      // }
      // // restore types
      // context.commit('currentConnections/restoreTypes', connectionTypes, { root: true })
      // // restore boxes
      // context.commit('currentBoxes/restore', boxes, { root: true })
      // // restore chunks
      // primaryChunks.forEach((chunk, index) => {
      //   defer(function () {
      //     if (space.id !== context.state.id) { return }
      //     if (!isRemote && isLoadingRemoteSpace) { return }
      //     // primary
      //     if (primaryIsCards) {
      //       context.commit('currentCards/restore', chunk, { root: true })

      //     } else {
      //       context.commit('currentConnections/restore', chunk, { root: true })
      //     }
      //     // secondary
      //     chunk = secondaryChunks[index]
      //     if (chunk && primaryIsCards) {
      //       context.commit('currentConnections/restore', chunk, { root: true })
      //     } else if (chunk) {
      //       context.commit('currentCards/restore', chunk, { root: true })

      //     }
      //     // complete
      //     const isRestoreComplete = index === primaryChunks.length - 1
      //     if (isRestoreComplete) {
      //       context.dispatch('restoreRemoteSpaceComplete', { space, isRemote, timeStart })
      //     }
      //   })
      // })
    },

    // merge into restorespace
    restoreRemoteSpaceComplete: async (context, { space, isRemote }) => {
      context.dispatch('history/reset', null, { root: true })
      postMessage.send({ name: 'restoreRemoteSpaceComplete', value: true })
      // const timeEnd = utils.unixTime()
      // let emoji = '🌳'
      // if (isRemote) {
      //   emoji = '🌳🌏'
      // }
      // const cards = cardStore.allIds.length
      // const connections = context.rootState.currentConnections.ids.length
      // const boxes = context.rootState.currentBoxes.ids.length
      // console.info(`${emoji} Restore space complete in ${timeEnd - timeStart}ms,`, {
      //   cards,
      //   connections,
      //   boxes,
      //   spaceName: space.name,
      //   isRemote
      // })

      const itemsRect = utils.pageSizeFromItems(space.cards)
      context.commit('resetPageSizes', null, { root: true })
      context.commit('updatePageSizes', itemsRect, { root: true })
      context.dispatch('updatePageSizes', null, { root: true }) // ?

      if (isRemote) {
        context.dispatch('checkIfShouldNotifySignUpToEditSpace', space)
        context.dispatch('checkIfShouldNotifySpaceIsRemoved', space)
        context.commit('broadcast/joinSpaceRoom', null, { root: true })
      }
      nextTick(() => {
        context.dispatch('scrollCardsIntoView')
        // deferrable async tasks
        context.dispatch('updateOtherUsers')
        context.dispatch('checkIfShouldResetDimensions')
        nextTick(() => {
          context.dispatch('checkIfShouldPauseConnectionDirections')
        })
      })
      context.dispatch('checkIfIsLoadingSpace', isRemote)
      if (!isRemote) { return }
      // increment visits
      await context.dispatch('api/addToQueue', {
        name: 'incrementVisits',
        body: { spaceId: space.id }
      }, { root: true })
      // preview image
      context.dispatch('updateSpacePreviewImage')
    },
    loadSpace: async (context, { space }) => {
      space.connections = utils.migrationConnections(space.connections)
      if (!context.rootState.isEmbedMode) {
        context.commit('triggerSpaceZoomReset', null, { root: true })
      }
      context.commit('isAddPage', false, { root: true })
      const cachedSpace = await cache.space(space.id) || space
      cachedSpace.id = cachedSpace.id || space.id
      space = utils.normalizeSpace(cachedSpace)
      context.dispatch('clearStateMeta')
      context.commit('resetPageSizes', null, { root: true })
      // load local space while fetching remote space
      try {
        const [localData, remoteData] = await Promise.all([
          context.dispatch('restoreSpaceLocal', space),
          context.dispatch('loadRemoteSpace', space)
        ])
        // restore remote space
        const remoteSpace = remoteData
        console.info('🎑 remoteSpace', remoteSpace)
        if (!remoteSpace) { return }
        context.commit('triggerUpdateWindowTitle', null, { root: true })
        context.dispatch('groups/loadGroup', remoteSpace, { root: true })
        const spaceIsUnchanged = utils.spaceIsUnchanged(cachedSpace, remoteSpace)
        if (spaceIsUnchanged) {
          context.commit('isLoadingSpace', false, { root: true })
          context.dispatch('updateSpacePreviewImage')
          // merge metadata into local
          await context.dispatch('updateSpaceLocalOnly', { drawingImage: remoteSpace.drawingImage })
          context.commit('triggerDrawingRedraw', null, { root: true })
          return
        }
        context.dispatch('restoreSpaceRemote', remoteSpace)
        context.dispatch('saveCurrentSpaceToCache')
        context.dispatch('notifySpaceIsOpen')
      } catch (error) {
        console.error('🚒 Error fetching remoteSpace', error)
      }
      context.dispatch('updateCurrentSpaceIsUnavailableOffline', space.id, { root: true })
      context.dispatch('updateCurrentUserIsInvitedButCannotEditCurrentSpace', space, { root: true })
      // focus card
      const cardId = context.rootState.focusOnCardId
      if (cardId) {
        context.commit('triggerScrollCardIntoView', cardId, { root: true })
      }
    },
    saveCurrentSpaceToCache: (context) => {
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember(context.space)
      if (!isSpaceMember) { return }
      if (context.state.isRemoved) { return }
      cache.saveSpace(context.space)
    },
    notifySpaceIsOpen: (context) => {
      if (context.state.isRemoved) { return }
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember(context.space)
      const spaceIsOpen = context.state.privacy === 'open'
      if (!isSpaceMember && spaceIsOpen) {
        context.commit('addNotification', { message: 'This space is open to comments', icon: 'comment', type: 'success' }, { root: true })
      }
    },
    clearStateMeta: (context) => {
      const userStore = useUserStore()
      const user = { id: userStore.id }
      isLoadingRemoteSpace = false
      context.commit('notifySpaceIsRemoved', false, { root: true })
      context.commit('spaceUrlToLoad', '', { root: true })
      context.commit('userHasScrolled', false, { root: true })
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      context.commit('clearAllNotifications', null, { root: true })
      context.commit('clearSpaceFilters', null, { root: true })
      context.commit('clearSearch', null, { root: true })
      context.commit('shouldPreventNextEnterKey', false, { root: true })
    },
    restoreSpaceLocal: (context, space) => {
      const emptySpace = utils.emptySpace(space.id)
      context.commit('restoreSpace', emptySpace)
      context.dispatch('history/reset', null, { root: true })
      context.dispatch('restoreSpace', { space })
      console.info('🎑 local space', space)
      return space
    },
    restoreSpaceRemote: async (context, remoteSpace) => {
      const cardStore = useCardStore()
      isLoadingRemoteSpace = true // TODO why is this a local var?? instead of store state
      remoteSpace = utils.normalizeSpace(remoteSpace)

      // cards
      // const prevCards = cardStore.getAllCards
      // const selectedCardIds = context.rootState.multipleCardsSelectedIds.concat(context.rootState.multipleCardsSelectedIdsToLoad)
      // const cardDiffs = utils.diffSpaceItems({ prevItems: prevCards, newItems: remoteSpace.cards, selectedItemIds: selectedCardIds })
      // cardDiffs.addItems.forEach(prevCard => {
      //   remoteSpace.cards.push(prevCard)
      // })
      // cardDiffs.updateItems.forEach(update => {
      //   // const newCard = context.getters.byId(newCard.id)

      //   // remoteSpace.cards
      // })

      // removeSpace.cards

      // context.dispatch('currentCards/mergeUnique', cardResults.updateItems, { root: true })
      // context.dispatch('currentCards/mergeRemove', cardResults.removeItems, { root: true })

      // // connectionTypes
      // const connectionTypes = context.rootGetters['currentConnections/allTypes']
      // const selectedConnectionTypeIds = context.rootState.multipleConnectionTypesSelectedIdsToLoad
      // const connectionTypeReults = utils.mergeSpaceKeyValues({ prevItems: connectionTypes, newItems: remoteSpace.connectionTypes, selectedItemIds: selectedConnectionTypeIds })
      // context.dispatch('currentConnections/mergeUnique', { newItems: connectionTypeReults.updateItems, itemType: 'type' }, { root: true })
      // context.dispatch('currentConnections/mergeRemove', { removeItems: connectionTypeReults.removeItems, itemType: 'type' }, { root: true })
      // // connections
      // const connections = context.rootGetters['currentConnections/all']
      // const selectedConnectionIds = context.rootState.multipleConnectionsSelectedIds.concat(context.rootState.multipleConnectionsSelectedIdsToLoad)
      // const connectionResults = utils.mergeSpaceKeyValues({ prevItems: connections, newItems: remoteSpace.connections, selectedItemIds: selectedConnectionIds })
      // context.dispatch('currentConnections/mergeUnique', { newItems: connectionResults.updateItems, itemType: 'connection' }, { root: true })
      // context.dispatch('currentConnections/mergeRemove', { removeItems: connectionResults.removeItems, itemType: 'connection' }, { root: true })
      // // boxes
      // const boxes = context.rootGetters['currentBoxes/all']
      // const selectedBoxIds = context.rootState.multipleBoxesSelectedIds.concat(context.rootState.multipleBoxesSelectedIdsToLoad)
      // const boxResults = utils.mergeSpaceKeyValues({ prevItems: boxes, newItems: remoteSpace.boxes, selectedItemIds: selectedBoxIds })
      // context.dispatch('currentBoxes/mergeUnique', { newItems: boxResults.updateItems, itemType: 'box' }, { root: true })
      // context.dispatch('currentBoxes/mergeRemove', { removeItems: boxResults.removeItems, itemType: 'box' }, { root: true })
      // context.dispatch('history/redoLocalUpdates', null, { root: true })
      // console.info('🎑 merged remote space', {
      //   remoteSpace,
      //   cards: cardResults,
      //   types: connectionTypeReults,
      //   connections: connectionResults,
      //   boxes: boxResults
      // })

      // TODO merge changed items in localspace session (from history??) into remotespace

      context.dispatch('restoreSpace', { space: remoteSpace, isRemote: true })
      // addCards: cardResults.addItems,
      // addConnectionTypes: connectionTypeReults.addItems,
      // addConnections: connectionResults.addItems,
      // addBoxes: boxResults.addItems
      // context.commit('triggerRestoreSpaceRemoteComplete', null, { root: true })
    },
    loadLastSpace: async (context, prevFailedSpace) => {
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
        await context.dispatch('loadSpace', { space })
        context.dispatch('updateUserLastSpaceId')
      } else {
        context.dispatch('init')
      }
    },
    loadPrevSpaceInSession: async (context) => {
      const prevSpaceIdInSession = context.rootState.prevSpaceIdInSession
      const prevSpacePosition = context.rootState.prevSpaceIdInSessionPagePosition
      if (!prevSpaceIdInSession) { return }
      let space = await cache.space(prevSpaceIdInSession)
      if (space.id) {
        await context.dispatch('changeSpace', space)
      } else if (prevSpaceIdInSession) {
        space = { id: prevSpaceIdInSession }
        await context.dispatch('changeSpace', space)
      }
      window.scroll({
        left: prevSpacePosition.x,
        top: prevSpacePosition.y,
        behavior: 'instant'
      })
    },
    updateSpace: async (context, updates) => {
      updates.id = context.state.id
      context.commit('updateSpace', updates)
      await cache.updateSpaceByUpdates(updates, context.state.id)
      context.dispatch('broadcast/update', { updates, type: 'updateSpace' }, { root: true })
      await context.dispatch('api/addToQueue', {
        name: 'updateSpace',
        body: updates
      }, { root: true })
    },
    updateSpaceLocalOnly: async (context, updates) => {
      updates.id = context.state.id
      context.commit('updateSpace', updates)
      await cache.updateSpaceByUpdates(updates, context.state.id)
    },
    changeSpace: async (context, space) => {
      const userStore = useUserStore()
      context.dispatch('prevSpaceIdInSession', context.state.id, { root: true })
      context.commit('clearAllInteractingWithAndSelected', null, { root: true })
      console.info('🚟 Change space', space)
      context.commit('isLoadingSpace', true, { root: true })
      context.commit('notifySpaceIsRemoved', false, { root: true })
      context.commit('currentUserToolbar', 'card', { root: true })
      space = utils.clone(space)
      space = utils.migrationEnsureRemovedCards(space)
      await context.dispatch('loadSpace', { space })
      context.commit('triggerUpdateWindowHistory', space, { root: true })
      const userIsMember = userStore.getUserIsSpaceMember()
      if (!userIsMember) { return }
      context.commit('parentCardId', '', { root: true })
      context.dispatch('updateUserLastSpaceId')
      const cardId = context.rootState.loadSpaceFocusOnCardId
      if (cardId) {
        context.dispatch('focusOnCardId', cardId, { root: true })
      }
      context.commit('restoreMultipleSelectedItemsToLoad', null, { root: true })
      const body = { id: space.id, updatedAt: new Date() }
      await context.dispatch('api/addToQueue', {
        name: 'updateSpace',
        body
      }, { root: true })
      await cache.updateSpace('updatedAt', body.updatedAt, space.id)
    },
    updateUserLastSpaceId: (context) => {
      const userStore = useUserStore()
      const currentUserIsSignedIn = userStore.getUserIsSignedIn
      const isPrivate = context.state.privacy === 'private'
      const canEdit = userStore.getUserCanEditSpace()
      const spaceIsReadOnlyInvite = isPrivate && !canEdit
      if (spaceIsReadOnlyInvite) { return }
      const space = context.state
      userStore.updateUser({ lastSpaceId: space.id })
    },
    removeCurrentSpace: async (context) => {
      const space = utils.clone(context.state)
      context.dispatch('decrementCardsCreatedCountFromSpace', space)
      cache.removeSpace(space)
      context.commit('prevSpaceIdInSession', '', { root: true })
      await context.dispatch('api/addToQueue', {
        name: 'removeSpace',
        body: { id: space.id }
      }, { root: true })
    },
    deleteSpace: async (context, space) => {
      cache.deleteSpace(space)
      context.commit('prevSpaceIdInSession', '', { root: true })
      await context.dispatch('api/addToQueue', {
        name: 'deleteSpace',
        body: space
      }, { root: true })
    },
    restoreRemovedSpace: async (context, space) => {
      cache.restoreRemovedSpace(space)
      const restoredSpace = await context.dispatch('api/restoreRemovedSpace', space, { root: true })
      space = restoredSpace || space
      context.dispatch('incrementCardsCreatedCountFromSpace', space)
      context.dispatch('changeSpace', space)
    },
    deleteAllRemovedSpaces: async (context) => {
      const userStore = useUserStore()
      const userId = userStore.id
      const removedSpaces = cache.getAllRemovedSpaces()
      removedSpaces.forEach(space => cache.deleteSpace(space))
      await context.dispatch('api/addToQueue', { name: 'deleteAllRemovedSpaces', body: { userId } }, { root: true })
    },
    checkIfShouldNotifySpaceIsRemoved: (context, space) => {
      const userStore = useUserStore()
      const canEdit = userStore.getUserCanEditSpace()
      if (space.isRemoved && canEdit) {
        context.commit('notifySpaceIsRemoved', true, { root: true })
      } else {
        context.commit('notifySpaceIsRemoved', false, { root: true })
      }
    },
    checkIfShouldPauseConnectionDirections: (context) => {
      const userStore = useUserStore()
      const prefersReducedMotion = consts.userPrefersReducedMotion()
      const userSetting = userStore.shouldPauseConnectionDirections
      const isInteracting = context.rootGetters.isInteractingWithItem
      const shouldPause = prefersReducedMotion || userSetting || isInteracting
      if (shouldPause) {
        context.dispatch('pauseConnectionDirections')
      } else {
        context.dispatch('unpauseConnectionDirections')
      }
    },
    checkIfShouldShowExploreOnLoad: (context) => {
      const shouldShow = context.rootState.shouldShowExploreOnLoad
      if (shouldShow) {
        context.commit('triggerExploreIsVisible', null, { root: true })
      }
      context.commit('shouldShowExploreOnLoad', false, { root: true })
    },
    checkIfIsLoadingSpace: (context, isRemote) => {
      const isOffline = !context.rootState.isOnline
      const currentSpaceIsRemote = context.rootGetters['currentSpace/isRemote']
      if (isOffline) {
        context.commit('isLoadingSpace', false, { root: true })
      } else if (!currentSpaceIsRemote) {
        context.commit('isLoadingSpace', false, { root: true })
      } else if (currentSpaceIsRemote && isRemote) {
        context.commit('isLoadingSpace', false, { root: true })
      }
    },
    pauseConnectionDirections: (context, space) => {
      const svgs = document.querySelectorAll('svg.connection')
      svgs.forEach(svg => {
        svg.pauseAnimations()
        svg.setCurrentTime(1.5)
      })
    },
    unpauseConnectionDirections: (context, space) => {
      const svgs = document.querySelectorAll('svg.connection')
      svgs.forEach(svg => {
        svg.unpauseAnimations()
      })
    },
    checkIfShouldNotifySignUpToEditSpace: async (context, space) => {
      const spaceIsOpen = space.privacy === 'open'
      const userStore = useUserStore()
      const currentUserIsSignedIn = userStore.getUserIsSignedIn
      await context.dispatch('updateCurrentUserIsInvitedButCannotEditCurrentSpace', space, { root: true })
      const currentUserIsInvitedButCannotEditSpace = context.state.currentUserIsInvitedButCannotEditCurrentSpace
      const currentUserIsReadOnlyInvitedToSpace = userStore.getUserIsReadOnlyInvitedToSpace(space)
      const currentUserIsInvitedToEdit = currentUserIsInvitedButCannotEditSpace && !currentUserIsSignedIn && !currentUserIsReadOnlyInvitedToSpace
      if (spaceIsOpen && !currentUserIsSignedIn) {
        context.commit('notifySignUpToEditSpace', true, { root: true })
      } else if (currentUserIsInvitedToEdit) {
        context.commit('notifySignUpToEditSpace', true, { root: true })
      } else {
        context.commit('notifySignUpToEditSpace', false, { root: true })
      }
    },
    removeCollaboratorFromSpace: (context, user) => {
      const userStore = useUserStore()
      const space = utils.clone(context.state)
      const userName = user.name || 'User'
      context.dispatch('broadcast/update', { user, type: 'userLeftSpace' }, { root: true })
      context.dispatch('api/removeSpaceCollaborator', { space, user }, { root: true })
      context.commit('removeCollaboratorFromSpace', user)
      const isCurrentUser = userStore.getUserIsCurrentUser(user)
      if (isCurrentUser) {
        context.dispatch('loadLastSpace')
        cache.removeInvitedSpace(space)
        cache.deleteSpace(space)
        context.commit('addNotification', { message: `You left ${space.name}`, type: 'success' }, { root: true })
      } else {
        context.commit('addNotification', { message: `${userName} removed from space`, type: 'success' }, { root: true })
      }
    },
    scrollCardsIntoView: (context) => {
      if (context.rootState.userHasScrolled) { return }
      const origin = { x: window.scrollX, y: window.scrollY }
      let cards = utils.clone(context.rootGetters['currentCards/all'])
      cards = cards.map(card => {
        card = {
          x: card.x,
          y: card.y,
          distanceFromOrigin: utils.distanceBetweenTwoPoints(card, origin),
          name: card.name //
        }
        return card
      })
      cards = sortBy(cards, ['distanceFromOrigin'])
      const card = cards[0]
      if (!card) { return }
      const xIsVisible = utils.isBetween({ value: card.x, min: origin.x, max: context.rootState.viewportWidth + origin.x })
      const yIsVisible = utils.isBetween({ value: card.y, min: origin.y, max: context.rootState.viewportHeight + origin.y })
      if (xIsVisible && yIsVisible) { return }
      const position = {
        x: Math.max(card.x - 100, 0),
        y: Math.max(card.y - 100, 0)
      }
      nextTick(() => {
        window.scrollTo(position.x, position.y)
      })
    },

    // User Card Count

    checkIfShouldNotifyCardsCreatedIsNearLimit: (context) => {
      const userStore = useUserStore()
      const spaceCreatorIsUpgraded = context.getters.spaceCreatorIsUpgraded
      if (spaceCreatorIsUpgraded) { return }
      if (userStore.isUpgraded) { return }
      const cardsCreatedLimit = consts.cardsCreatedLimit
      const value = cardsCreatedLimit - userStore.cardsCreatedCount
      if (utils.isBetween({ value, min: 0, max: 15 })) {
        context.commit('notifyCardsCreatedIsNearLimit', true, { root: true })
      }
    },
    incrementCardsCreatedCountFromSpace (context, space) {
      const userStore = useUserStore()
      const updatedCards = space.cards.filter(card => {
        return userStore.getUserIsCurrentUser({ id: card.userId })
      })
      userStore.updateUserCardsCreatedCount(updatedCards)
    },
    decrementCardsCreatedCountFromSpace (context, space) {
      const userStore = useUserStore()
      space.cards = space.cards.filter(card => {
        return userStore.getUserIsCurrentUser({ id: card.userId })
      })
      userStore.updateUserCardsCreatedCount(space.cards, true)
    },

    // Tags

    addTag: async (context, tag) => {
      let tagsInCard = context.getters.tagsInCard({ id: tag.cardId })
      tagsInCard = tagsInCard.map(card => card.name)
      if (tagsInCard.includes(tag.name)) { return }
      context.commit('addTag', tag)
      const update = { name: 'addTag', body: tag }
      const broadcastUpdate = { updates: tag, type: 'addTag' }
      context.dispatch('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
      await context.dispatch('api/addToQueue', update, { root: true })
      await context.dispatch('updateTags', null, { root: true })
    },
    removeTag: async (context, tag) => {
      context.commit('removeTag', tag)
      const update = { name: 'removeTag', body: tag }
      const broadcastUpdate = { updates: tag, type: 'removeTag' }
      context.dispatch('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
      await context.dispatch('api/addToQueue', update, { root: true })
      await context.dispatch('updateTags', null, { root: true })
    },
    removeTags: async (context, tag) => {
      context.commit('removeTags', tag)
      const update = { name: 'removeTags', body: tag }
      context.commit('remoteTagsIsFetched', false, { root: true })
      await context.dispatch('api/addToQueue', update, { root: true })
      await context.dispatch('updateTags', null, { root: true })
    },
    updateTagNameColor: async (context, tag) => {
      context.commit('updateTagNameColor', tag)
      const update = { name: 'updateTagNameColor', body: tag }
      const broadcastUpdate = { updates: tag, type: 'updateTagNameColor' }
      context.dispatch('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
      await context.dispatch('api/addToQueue', update, { root: true })
      await context.dispatch('updateTags', null, { root: true })
    },
    removeUnusedTagsFromCard: async (context, cardId) => {
      const card = context.rootGetters['currentCards/byId'](cardId)
      if (!card) { return }
      const cardTagNames = utils.tagsFromStringWithoutBrackets(card.name) || []
      const tagsInCard = context.getters.tagsInCard({ id: cardId })
      const tagsToRemove = tagsInCard.filter(tag => !cardTagNames.includes(tag.name))
      for (const tag of tagsToRemove) {
        await context.dispatch('removeTag', tag)
      }
    },

    // items

    addItems: (context, items) => {
      const { cards, boxes, connections, connectionTypes, tags } = items
      cards.forEach(card => context.dispatch('currentCards/add', { card }, { root: true }))
      boxes.forEach(box => context.dispatch('currentBoxes/add', { box }, { root: true }))
      connections.forEach(connection => {
        let type = connectionTypes.find(connectionType => connectionType.id === connection.connectionTypeId)
        const prevTypeInCurrentSpace = context.rootGetters['currentConnections/typeByName'](type.name)
        type = prevTypeInCurrentSpace || type
        context.dispatch('currentConnections/addType', type, { root: true })
        connection.connectionTypeId = type.id
        context.dispatch('currentConnections/add', { connection, type }, { root: true })
      })
      const userStore = useUserStore()
      tags.forEach(tag => {
        tag.userId = userStore.id
        context.dispatch('addTag', tag)
      })
    },

    // async getters

    spaceIsNotCached: async (context, spaceId) => {
      const spaceCardsCount = await cache.space(spaceId).cards?.length
      return Boolean(!spaceCardsCount)
    },
    newItems: async (context, { items, spaceId }) => {
      items = items || context.getters.selectedItems
      items = utils.clone(items)
      spaceId = spaceId || context.state.id
      let newItems = await utils.uniqueSpaceItems(items)
      newItems = await utils.updateSpaceItemsSpaceId(newItems, spaceId)
      return newItems
    }
  },

  getters: {
    all: (state, getters, rootState, rootGetters) => {
      const space = utils.clone(state)
      space.cards = rootGetters['currentCards/all']
      space.connections = rootGetters['currentConnections/all']
      space.connectionTypes = rootGetters['currentConnections/allTypes']
      space.boxes = rootGetters['currentBoxes/all']
      return space
    },

    // meta

    isHelloKinopio: (state) => {
      return state.name === 'Hello Kinopio'
    },
    isRemote: (state, getters, rootState, rootGetters) => {
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember()
      const isOtherSpace = !isSpaceMember
      const currentUserIsSignedIn = userStore.getUserIsSignedIn
      return isOtherSpace || currentUserIsSignedIn
    },
    shouldBroadcast: (state) => {
      const users = state.users.length
      const collaborators = state.collaborators.length
      const spectators = state.spectators.length
      const clients = state.clients.length
      const total = users + collaborators + spectators + clients
      const shouldBroadcast = Boolean(total > 2) // currentUser and currentClient
      return shouldBroadcast
    },
    shouldUpdateApi: (state, getters, rootState, rootGetters) => {
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember()
      const isSignedIn = userStore.getUserIsSignedIn
      return isSpaceMember && isSignedIn
    },
    isFavorite: (state, getters, rootState) => (spaceId) => {
      const userStore = useUserStore()
      spaceId = spaceId || state.id
      const favoriteSpaces = userStore.favoriteSpaces
      let value = favoriteSpaces.find(favoriteSpace => favoriteSpace.id === spaceId)
      value = Boolean(value)
      return value
    },
    isHidden: (state, getters, rootState) => (spaceId) => {
      const userStore = useUserStore()
      spaceId = spaceId || state.id
      const hiddenSpaces = userStore.hiddenSpaces || []
      let value = hiddenSpaces.find(hiddenSpace => hiddenSpace?.id === spaceId)
      value = Boolean(value)
      return value
    },
    isInbox: (state, getters, rootState) => (spaceName) => {
      spaceName = spaceName || state.name
      return spaceName === 'Inbox'
    },
    url: (state) => {
      const domain = consts.kinopioDomain()
      const spaceUrl = utils.url({ name: state.name, id: state.id })
      return `${domain}/${spaceUrl}`
    },
    itemColors: (state, getters, rootState, rootGetters) => {
      const cardColors = rootGetters['currentCards/colors']
      const boxColors = rootGetters['currentBoxes/colors']
      const colors = cardColors.concat(boxColors)
      return uniq(colors)
    },

    // tags

    tagByName: (state, getters, rootState, rootGetters) => (name) => {
      let tags = rootGetters.allTags
      tags = tags.find(tag => {
        return tag.name === name
      })
      return tags
    },
    tagsInCard: (state, getters, rootState, rootGetters) => (card) => {
      const tags = rootGetters.allTags
      return tags.filter(tag => tag.cardId === card.id)
    },
    spaceTags: (state, getters) => {
      let tags = state.tags
      tags = uniqBy(tags, 'name')
      return tags
    },

    // users

    allUsers: (state, getters, rootState) => (excludeCurrentUser) => {
      const userStore = useUserStore()
      let users = getters.members()
      users = users.concat(state.spectators)
      if (excludeCurrentUser) {
        users = users.filter(user => user.id !== userStore.id)
      }
      return users
    },
    members: (state, getters, rootState) => (excludeCurrentUser) => {
      const userStore = useUserStore()
      let users = state.users
      const collaborators = state.collaborators || []
      users = users.concat(collaborators)
      if (excludeCurrentUser) {
        users = users.filter(user => user.id !== userStore.id)
      }
      return users
    },
    creator: (state, getters) => {
      return getters.memberById(state.userId)
    },
    memberById: (state, getters, rootState) => (userId) => {
      const members = getters.members()
      const member = members.find(member => member.id === userId)
      return member
    },
    userById: (state, getters, rootState, rootGetters) => (userId) => {
      const userStore = useUserStore()
      // current user
      if (userStore.id === userId) {
        return userStore
      }
      // collaborators
      const user = getters.memberById(userId)
      if (user?.id === userId) {
        return user
      }
      // commenters
      const otherUser = rootGetters.otherUserById(userId)
      if (otherUser) {
        return otherUser
      }
      // group user
      const groupUser = rootGetters['groups/groupUser']({ userId })
      return groupUser
    },
    spaceCreatorIsUpgraded: (state, getters, rootState, rootGetters) => {
      const creatorUser = getters.creator
      return creatorUser?.isUpgraded
    },
    spaceCreatorIsCurrentUser: (state, getters, rootState) => {
      const userStore = useUserStore()
      const creatorUser = getters.creator
      return userStore.getUserIsCurrentUser(creatorUser)
    },
    shouldPreventAddCard: (state, getters, rootState, rootGetters) => {
      const userStore = useUserStore()
      const cardsCreatedIsOverLimit = userStore.getUserCardsCreatedIsOverLimit
      const spaceCreatorIsUpgraded = getters.spaceCreatorIsUpgraded
      return cardsCreatedIsOverLimit && !spaceCreatorIsUpgraded
    },
    readOnlyKey: (state, getters, rootState, rootGetters) => (space) => {
      const readOnlyKey = rootState.spaceReadOnlyKey
      if (space.id === readOnlyKey.spaceId) {
        return readOnlyKey.key
      } else {
        return null
      }
    },

    // copy, paste

    selectedItems: (state, getters, rootState, rootGetters) => {
      const cards = rootState.multipleCardsSelectedIds.map(cardId => {
        return rootGetters['currentCards/byId'](cardId)
      })
      const boxes = rootState.multipleBoxesSelectedIds.map(boxId => {
        return rootGetters['currentBoxes/byId'](boxId)
      })
      const connections = rootGetters['currentConnections/all'].filter(connection => {
        const selectedIds = rootState.multipleCardsSelectedIds.concat(rootState.multipleBoxesSelectedIds)
        const isStartCardMatch = selectedIds.includes(connection.startItemId)
        const isEndCardMatch = selectedIds.includes(connection.endItemId)
        return isStartCardMatch && isEndCardMatch
      })
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const connectionTypes = connectionTypeIds.map(id => rootGetters['currentConnections/typeByTypeId'](id))
      return { cards, connectionTypes, connections, boxes }
    },

    // items

    itemById: (state, getters, rootState, rootGetters) => (itemId) => {
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      if (!itemId) { return }
      const card = cardStore.getCard(itemId)
      const box = connectionStore.getConnection(itemId)
      return card || box
    }
  }
}

export default currentSpace
