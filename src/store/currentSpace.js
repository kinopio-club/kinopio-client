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
      context.commit('isLoadingSpace', true, { root: true })
      const spaceUrl = context.rootState.spaceUrlToLoad
      const loadInboxSpace = context.rootState.loadInboxSpace
      const loadBlogSpace = context.rootState.loadBlogSpace
      const loadNewSpace = context.rootState.loadNewSpace
      const user = context.rootState.currentUser
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
      } else if (user?.lastSpaceId) {
        console.info('🚃 Restore last space', user.lastSpaceId)
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
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      const isPrivate = context.state.privacy === 'private'
      if (!currentUserIsSignedIn) { return }
      if (!canEditSpace) { return }
      if (isPrivate) { return }
      const response = await context.dispatch('api/updateSpacePreviewImage', context.state.id, { root: true })
      console.info('🙈 updated space preview image', response?.urls)
    }, 10 * 1000), // 10 seconds
    updateInboxCache: async (context) => {
      const currentSpaceIsInbox = context.state.name === 'Inbox'
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
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
      const cards = utils.clone(context.rootGetters['currentCards/all'])
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
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
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
        const otherItemIds = context.rootGetters['currentCards/linkedItems']
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
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const spaces = await cache.getAllSpaces()
      if (currentUserIsSignedIn) { return }
      if (spaces.length) { return }
      await context.dispatch('createNewInboxSpace', true)
      await context.dispatch('createNewHelloSpace')
      context.dispatch('updateUserLastSpaceId')
    },
    createNewHelloSpace: async (context) => {
      const user = context.rootState.currentUser
      let space = utils.newHelloSpace(user)
      space = utils.updateSpaceCardsCreatedThroughPublicApi(space)
      space.id = nanoid()
      space.collaboratorKey = nanoid()
      space.readOnlyKey = nanoid()
      if (shouldLoadNewHelloSpace) {
        space = await cache.updateIdsInSpace(space)
        context.commit('clearSearch', null, { root: true })
        context.commit('resetPageSizes', null, { root: true })
        context.dispatch('restoreSpaceInChunks', { space })
        context.commit('addUserToSpace', user)
        context.dispatch('updateOtherUsers')
        context.dispatch('updateOtherItems')
      } else {
        space.users = [context.rootState.currentUser]
        const nullCardUsers = true
        await cache.updateIdsInSpace(space, nullCardUsers)
      }
      context.commit('triggerUpdateWindowTitle', null, { root: true })
    },
    createNewSpace: async (context, space) => {
      const currentUser = context.rootState.currentUser
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
      const shouldHideTutorialCards = currentUser.shouldHideTutorialCards
      if (shouldHideTutorialCards) {
        space.connectionTypes = []
        space.connections = []
        space.cards = []
        space.boxes = []
      } else {
        space.connectionTypes[0].color = randomColor({ luminosity: 'light' })
      }
      const shouldHideDateCards = currentUser.shouldHideDateCards
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
      space.userId = currentUser.id
      space = utils.newSpaceBackground(space, currentUser)
      space.background = space.background || consts.defaultSpaceBackground
      space.isTemplate = false
      space.isHidden = false
      space.previewImage = null
      space.previewThumbnailImage = null
      const nullCardUsers = true
      const uniqueNewSpace = await cache.updateIdsInSpace(space, nullCardUsers)
      context.commit('clearSearch', null, { root: true })
      isLoadingRemoteSpace = false
      context.commit('resetPageSizes', null, { root: true })
      context.dispatch('restoreSpaceInChunks', { space: uniqueNewSpace })
    },
    createNewInboxSpace: async (context, shouldCreateWithoutLoading) => {
      let space = utils.clone(inboxSpace)
      space.id = nanoid()
      space.createdAt = new Date()
      space.editedAt = new Date()
      space.userId = context.rootState.currentUser.id
      space.cards = space.cards.map(card => {
        card.id = nanoid()
        card.userId = context.rootState.currentUser.id
        return card
      })
      space = utils.updateSpaceCardsCreatedThroughPublicApi(space)
      if (shouldCreateWithoutLoading) {
        space.users = [context.rootState.currentUser]
        const nullCardUsers = true
        await cache.updateIdsInSpace(space, nullCardUsers) // saves space
      } else {
        context.commit('isLoadingSpace', true, { root: true })
        context.commit('clearSearch', null, { root: true })
        isLoadingRemoteSpace = false
        context.commit('resetPageSizes', null, { root: true })
        context.dispatch('restoreSpaceInChunks', { space })
        nextTick(() => {
          context.dispatch('currentCards/updateDimensions', {}, { root: true })
        })
      }
    },
    saveNewSpace: async (context) => {
      const space = utils.clone(context.state)
      const user = context.rootState.currentUser
      console.info('✨ saveNewSpace', space, user)
      cache.saveSpace(space)
      context.commit('addUserToSpace', user)
      nextTick(() => {
        context.dispatch('currentCards/updateDimensions', {}, { root: true })
      })
      context.dispatch('updateModulesSpaceId', space)
      context.dispatch('incrementCardsCreatedCountFromSpace', space)
      context.commit('isLoadingSpace', false, { root: true })
      context.commit('triggerUpdateWindowHistory', null, { root: true })
      await context.dispatch('api/addToQueue', {
        name: 'createSpace',
        body: space
      }, { root: true })
    },
    saveSpace: async (context, space) => {
      const user = context.rootState.currentUser
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      cache.saveSpace(space)
      if (currentUserIsSignedIn) {
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
      const user = { id: context.rootState.currentUser.id }
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      let uniqueNewSpace = utils.resetSpaceMeta({ space, user: context.rootState.currentUser, type: 'copy' })
      uniqueNewSpace = await cache.updateIdsInSpace(space)
      context.commit('clearSearch', null, { root: true })
      isLoadingRemoteSpace = false
      context.commit('resetPageSizes', null, { root: true })
      context.dispatch('restoreSpaceInChunks', { space: uniqueNewSpace })
      await context.dispatch('saveNewSpace')
      context.commit('addNotification', { message: 'Duplicated Space', type: 'success' }, { root: true })
    },
    addSpace: async (context, space) => {
      const user = { id: context.rootState.currentUser.id }
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      await context.dispatch('createNewSpace', space)
      await context.dispatch('saveNewSpace')
      context.dispatch('updateUserLastSpaceId')
      context.commit('notifySignUpToEditSpace', false, { root: true })
    },
    addInboxSpace: async (context) => {
      const user = { id: context.rootState.currentUser.id }
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      await context.dispatch('createNewInboxSpace')
      await context.dispatch('saveNewSpace')
      context.dispatch('updateUserLastSpaceId')
      context.commit('notifySignUpToEditSpace', false, { root: true })
    },
    getRemoteSpace: async (context, space) => {
      const collaboratorKey = context.rootState.spaceCollaboratorKeys.find(key => key.spaceId === space.id)
      if (collaboratorKey) {
        space.collaboratorKey = collaboratorKey.collaboratorKey
      }
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const currentSpaceIsRemote = context.rootGetters['currentSpace/isRemote']
      let remoteSpace
      try {
        if (currentUserIsSignedIn) {
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
          context.dispatch('currentUser/updateFavoriteSpace', { space, value: false }, { root: true })
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
      const cachedSpace = await cache.space(space.id)
      const currentUserIsRemovedFromSpace = utils.objectHasKeys(cachedSpace)
      context.dispatch('currentUser/updateFavoriteSpace', { space, value: false }, { root: true })
      if (currentUserIsRemovedFromSpace) {
        context.dispatch('currentUser/resetLastSpaceId', null, { root: true })
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
      const cards = context.rootGetters['currentCards/all']
      cards.forEach(card => {
        if (!card.name) {
          context.dispatch('currentCards/remove', card, { root: true })
        }
      })
    },
    checkIfShouldResetDimensions: (context) => {
      const shouldReset = context.rootState.shouldResetDimensionsOnLoad
      if (!shouldReset) { return }
      const cardIds = context.rootState.currentCards.ids
      context.dispatch('currentCards/resetDimensions', { cardIds }, { root: true })
      context.commit('shouldResetDimensionsOnLoad', false, { root: true })
    },
    loadInboxSpace: async (context) => {
      const inboxSpace = await context.dispatch('currentUser/inboxSpace', null, { root: true })
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
      space = space || context.state
      console.info('💕 update modules space id', space.id)
      context.dispatch('currentCards/updateSpaceId', space.id, { root: true })
      context.dispatch('currentConnections/updateSpaceId', space.id, { root: true })
      context.dispatch('currentBoxes/updateSpaceId', space.id, { root: true })
    },
    restoreSpaceInChunks: (context, { space, isRemote, addCards, addConnections, addConnectionTypes, addBoxes }) => {
      if (!utils.objectHasKeys(space)) { return }
      space.connections = utils.migrationConnections(space.connections)
      addConnections = utils.migrationConnections(addConnections)
      console.info('🌱 Restoring space', space, { isRemote, addCards, addConnections, addConnectionTypes, addBoxes })
      context.commit('isLoadingSpace', true, { root: true })
      const chunkSize = 50
      const timeStart = utils.unixTime()
      const origin = { x: window.scrollX, y: window.scrollY }
      // init items
      let cards = addCards || space.cards || []
      let connectionTypes = addConnectionTypes || space.connectionTypes || []
      connectionTypes = connectionTypes.filter(type => Boolean(type))
      let connections = addConnections || space.connections || []
      cards = utils.normalizeItems(cards)
      connections = utils.normalizeItems(connections)
      const boxes = addBoxes || space.boxes || []
      // sort cards
      const cardIds = Object.keys(cards)
      cards = cardIds.map(id => {
        const card = cards[id]
        card.distanceFromOrigin = utils.distanceBetweenTwoPoints(card, origin)
        return card
      })
      cards = sortBy(cards, ['distanceFromOrigin'])
      // page size
      const itemsRect = utils.pageSizeFromItems(cards)
      context.commit('resetPageSizes', null, { root: true })
      context.commit('updatePageSizes', itemsRect, { root: true })
      // sort connections
      const connectionIds = Object.keys(connections)
      connections = connectionIds.map(id => {
        const connection = connections[id]
        const pathIsEmpty = connection.path === 'm0,0 q00,00 0,0'
        if (connection.path && !pathIsEmpty) {
          const coords = utils.startCoordsFromConnectionPath(connection.path)
          connection.distanceFromOrigin = utils.distanceBetweenTwoPoints(coords, origin)
        }
        return connection
      })
      connections = sortBy(connections, ['distanceFromOrigin'])
      // restore space
      if (!isRemote) {
        context.commit('currentCards/clear', null, { root: true })
        context.commit('currentConnections/clear', null, { root: true })
        context.commit('currentBoxes/clear', null, { root: true })
        context.dispatch('updateModulesSpaceId', space)
      }
      context.commit('isLoadingSpace', true, { root: true })
      context.commit('restoreSpace', space)
      // split into chunks
      const cardChunks = utils.splitArrayIntoChunks(cards, chunkSize)
      const connectionChunks = utils.splitArrayIntoChunks(connections, chunkSize)
      let primaryIsCards = true
      let primaryChunks = cardChunks
      let secondaryChunks = connectionChunks
      if (connectionChunks.length > cardChunks.length) {
        primaryIsCards = false
        primaryChunks = connectionChunks
        secondaryChunks = cardChunks
      }
      // restore space
      if (!primaryChunks.length) {
        context.commit('currentBoxes/restore', boxes, { root: true })
        context.commit('currentConnections/restoreTypes', connectionTypes, { root: true })
        context.dispatch('restoreSpaceComplete', { space, isRemote, timeStart })
        return
      }
      // restore types
      context.commit('currentConnections/restoreTypes', connectionTypes, { root: true })
      // restore boxes
      context.commit('currentBoxes/restore', boxes, { root: true })
      // restore chunks
      primaryChunks.forEach((chunk, index) => {
        defer(function () {
          if (space.id !== context.state.id) { return }
          if (!isRemote && isLoadingRemoteSpace) { return }
          // primary
          if (primaryIsCards) {
            context.commit('currentCards/restore', chunk, { root: true })
          } else {
            context.commit('currentConnections/restore', chunk, { root: true })
          }
          // secondary
          chunk = secondaryChunks[index]
          if (chunk && primaryIsCards) {
            context.commit('currentConnections/restore', chunk, { root: true })
          } else if (chunk) {
            context.commit('currentCards/restore', chunk, { root: true })
          }
          // complete
          const isRestoreComplete = index === primaryChunks.length - 1
          if (isRestoreComplete) {
            context.dispatch('restoreSpaceComplete', { space, isRemote, timeStart })
          }
        })
      })
    },
    restoreSpaceComplete: async (context, { space, isRemote, timeStart }) => {
      context.dispatch('history/reset', null, { root: true })
      postMessage.send({ name: 'restoreSpaceComplete', value: true })
      const timeEnd = utils.unixTime()
      let emoji = '🌳'
      if (isRemote) {
        emoji = '🌳🌏'
      }
      const cards = context.rootState.currentCards.ids.length
      const connections = context.rootState.currentConnections.ids.length
      const boxes = context.rootState.currentBoxes.ids.length
      console.info(`${emoji} Restore space complete in ${timeEnd - timeStart}ms,`, {
        cards,
        connections,
        boxes,
        spaceName: space.name,
        isRemote,
        cardUsers: context.rootGetters['currentCards/userIds']
      })
      context.dispatch('updatePageSizes', null, { root: true })
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
      const space = utils.clone(context.state)
      const isSpaceMember = context.rootGetters['currentUser/isSpaceMember'](space)
      if (!isSpaceMember) { return }
      if (context.state.isRemoved) { return }
      cache.saveSpace(space)
    },
    notifySpaceIsOpen: (context) => {
      if (context.state.isRemoved) { return }
      const isSpaceMember = context.rootGetters['currentUser/isSpaceMember'](context.state)
      const spaceIsOpen = context.state.privacy === 'open'
      if (!isSpaceMember && spaceIsOpen) {
        context.commit('addNotification', { message: 'This space is open to comments', icon: 'comment', type: 'success' }, { root: true })
      }
    },
    clearStateMeta: (context) => {
      const user = context.rootState.currentUser
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
      console.time('🎑⏱️ restoreSpaceLocal')
      const emptySpace = utils.emptySpace(space.id)
      context.commit('restoreSpace', emptySpace)
      context.dispatch('history/reset', null, { root: true })
      context.dispatch('restoreSpaceInChunks', { space })
      console.info('🎑 local space', space)
      context.commit('triggerRestoreSpaceLocalComplete', null, { root: true })
      console.timeEnd('🎑⏱️ restoreSpaceLocal')
      return space
    },
    restoreSpaceRemote: async (context, remoteSpace) => {
      console.time('🎑⏱️ restoreSpaceRemote')
      isLoadingRemoteSpace = true
      remoteSpace = utils.normalizeSpace(remoteSpace)
      // cards
      const cards = context.rootGetters['currentCards/all']
      const selectedCardIds = context.rootState.multipleCardsSelectedIds.concat(context.rootState.multipleCardsSelectedIdsToLoad)
      const cardResults = utils.mergeSpaceKeyValues({ prevItems: cards, newItems: remoteSpace.cards, selectedItemIds: selectedCardIds })
      context.dispatch('currentCards/mergeUnique', cardResults.updateItems, { root: true })
      context.dispatch('currentCards/mergeRemove', cardResults.removeItems, { root: true })
      // connectionTypes
      const connectionTypes = context.rootGetters['currentConnections/allTypes']
      const selectedConnectionTypeIds = context.rootState.multipleConnectionTypesSelectedIdsToLoad
      const connectionTypeReults = utils.mergeSpaceKeyValues({ prevItems: connectionTypes, newItems: remoteSpace.connectionTypes, selectedItemIds: selectedConnectionTypeIds })
      context.dispatch('currentConnections/mergeUnique', { newItems: connectionTypeReults.updateItems, itemType: 'type' }, { root: true })
      context.dispatch('currentConnections/mergeRemove', { removeItems: connectionTypeReults.removeItems, itemType: 'type' }, { root: true })
      // connections
      const connections = context.rootGetters['currentConnections/all']
      const selectedConnectionIds = context.rootState.multipleConnectionsSelectedIds.concat(context.rootState.multipleConnectionsSelectedIdsToLoad)
      const connectionResults = utils.mergeSpaceKeyValues({ prevItems: connections, newItems: remoteSpace.connections, selectedItemIds: selectedConnectionIds })
      context.dispatch('currentConnections/mergeUnique', { newItems: connectionResults.updateItems, itemType: 'connection' }, { root: true })
      context.dispatch('currentConnections/mergeRemove', { removeItems: connectionResults.removeItems, itemType: 'connection' }, { root: true })
      // boxes
      const boxes = context.rootGetters['currentBoxes/all']
      const selectedBoxIds = context.rootState.multipleBoxesSelectedIds.concat(context.rootState.multipleBoxesSelectedIdsToLoad)
      const boxResults = utils.mergeSpaceKeyValues({ prevItems: boxes, newItems: remoteSpace.boxes, selectedItemIds: selectedBoxIds })
      context.dispatch('currentBoxes/mergeUnique', { newItems: boxResults.updateItems, itemType: 'box' }, { root: true })
      context.dispatch('currentBoxes/mergeRemove', { removeItems: boxResults.removeItems, itemType: 'box' }, { root: true })
      context.dispatch('history/redoLocalUpdates', null, { root: true })
      console.info('🎑 merged remote space', {
        cards: cardResults,
        types: connectionTypeReults,
        connections: connectionResults,
        boxes: boxResults
      })
      context.dispatch('restoreSpaceInChunks', {
        space: remoteSpace,
        isRemote: true,
        addCards: cardResults.addItems,
        addConnectionTypes: connectionTypeReults.addItems,
        addConnections: connectionResults.addItems,
        addBoxes: boxResults.addItems
      })
      context.commit('triggerRestoreSpaceRemoteComplete', null, { root: true })
      console.timeEnd('🎑⏱️ restoreSpaceRemote')
    },
    loadLastSpace: async (context, prevFailedSpace) => {
      let space
      const user = context.rootState.currentUser
      let spaceToRestore = await cache.space(user.lastSpaceId)
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
      } else if (user.lastSpaceId) {
        space = { id: user.lastSpaceId }
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
    updateSpaceIsHidden: async (context, { spaceId, isHidden }) => {
      context.commit('updateSpace', { isHidden })
      await cache.updateSpace('isHidden', isHidden, spaceId)
      await context.dispatch('api/addToQueue', {
        name: 'updateSpaceIsHidden',
        body: {
          spaceId,
          isHidden
        }
      }, { root: true })
    },
    changeSpace: async (context, space) => {
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
      const userIsMember = context.rootGetters['currentUser/isSpaceMember']()
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
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const isPrivate = context.state.privacy === 'private'
      const canEdit = context.rootGetters['currentUser/canEditSpace']()
      const spaceIsReadOnlyInvite = isPrivate && !canEdit
      if (spaceIsReadOnlyInvite) { return }
      const space = context.state
      context.dispatch('currentUser/lastSpaceId', space.id, { root: true })
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
      const userId = context.rootState.currentUser.id
      const removedSpaces = cache.getAllRemovedSpaces()
      removedSpaces.forEach(space => cache.deleteSpace(space))
      await context.dispatch('api/addToQueue', { name: 'deleteAllRemovedSpaces', body: { userId } }, { root: true })
    },
    checkIfShouldNotifySpaceIsRemoved: (context, space) => {
      const canEdit = context.rootGetters['currentUser/canEditSpace']()
      if (space.isRemoved && canEdit) {
        context.commit('notifySpaceIsRemoved', true, { root: true })
      } else {
        context.commit('notifySpaceIsRemoved', false, { root: true })
      }
    },
    checkIfShouldPauseConnectionDirections: (context) => {
      const prefersReducedMotion = consts.userPrefersReducedMotion()
      const userSetting = context.rootState.currentUser.shouldPauseConnectionDirections
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
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      await context.dispatch('updateCurrentUserIsInvitedButCannotEditCurrentSpace', space, { root: true })
      const currentUserIsInvitedButCannotEditSpace = context.state.currentUserIsInvitedButCannotEditCurrentSpace
      const currentUserIsReadOnlyInvitedToSpace = context.rootGetters['currentUser/isReadOnlyInvitedToSpace'](space)
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
      const space = utils.clone(context.state)
      const userName = user.name || 'User'
      context.dispatch('broadcast/update', { user, type: 'userLeftSpace' }, { root: true })
      context.dispatch('api/removeSpaceCollaborator', { space, user }, { root: true })
      context.commit('removeCollaboratorFromSpace', user)
      const isCurrentUser = user.id === context.rootState.currentUser.id
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
      const spaceCreatorIsUpgraded = context.getters.spaceCreatorIsUpgraded
      if (spaceCreatorIsUpgraded) { return }
      const currentUser = context.rootState.currentUser
      if (currentUser.isUpgraded) { return }
      const cardsCreatedLimit = context.rootState.cardsCreatedLimit
      const value = cardsCreatedLimit - currentUser.cardsCreatedCount
      if (utils.isBetween({ value, min: 0, max: 15 })) {
        context.commit('notifyCardsCreatedIsNearLimit', true, { root: true })
      }
    },
    incrementCardsCreatedCountFromSpace (context, space) {
      const user = context.rootState.currentUser
      const updatedCards = space.cards.filter(card => {
        return card.userId === user.id
      })
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        cards: updatedCards
      }, { root: true })
    },
    decrementCardsCreatedCountFromSpace (context, space) {
      const user = context.rootState.currentUser
      space.cards = space.cards.filter(card => {
        return card.userId === user.id
      })
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        cards: space.cards,
        shouldDecrement: true
      }, { root: true })
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
      tags.forEach(tag => {
        tag.userId = context.rootState.currentUser.id
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
      const isSpaceMember = rootGetters['currentUser/isSpaceMember']()
      const isOtherSpace = !isSpaceMember
      const currentUserIsSignedIn = rootGetters['currentUser/isSignedIn']
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
      const isSpaceMember = rootGetters['currentUser/isSpaceMember']()
      const isSignedIn = rootGetters['currentUser/isSignedIn']
      return isSpaceMember && isSignedIn
    },
    isFavorite: (state, getters, rootState) => {
      const favoriteSpaces = rootState.currentUser.favoriteSpaces
      let isFavoriteSpace = favoriteSpaces.find(space => space.id === state.id)
      isFavoriteSpace = Boolean(isFavoriteSpace)
      return isFavoriteSpace
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
      let users = getters.members()
      users = users.concat(state.spectators)
      if (excludeCurrentUser) {
        users = users.filter(user => user.id !== rootState.currentUser.id)
      }
      return users
    },
    members: (state, getters, rootState) => (excludeCurrentUser) => {
      let users = state.users
      const collaborators = state.collaborators || []
      users = users.concat(collaborators)
      if (excludeCurrentUser) {
        users = users.filter(user => user.id !== rootState.currentUser.id)
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
      // current user
      if (rootState.currentUser.id === userId) {
        return rootState.currentUser
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
      const currentUser = rootState.currentUser
      const creatorUser = getters.creator
      return currentUser.id === creatorUser?.id
    },
    shouldPreventAddCard: (state, getters, rootState, rootGetters) => {
      const cardsCreatedIsOverLimit = rootGetters['currentUser/cardsCreatedIsOverLimit']
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
      if (!itemId) { return }
      const card = rootGetters['currentCards/byId'](itemId)
      const box = rootGetters['currentBoxes/byId'](itemId)
      return card || box
    }
  }
}

export default currentSpace
