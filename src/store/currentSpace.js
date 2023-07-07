import helloSpace from '@/data/hello.json'
import inboxSpace from '@/data/inbox.json'
import newSpace from '@/data/new.json'

import words from '@/data/words.js'
import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'

import { nextTick } from 'vue'
import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'
import random from 'lodash-es/random'
import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'
import sortBy from 'lodash-es/sortBy'
import defer from 'lodash-es/defer'

let spectatorIdleTimers = []
let isLoadingRemoteSpace, shouldLoadNewHelloSpace

const currentSpace = {
  namespaced: true,
  state: utils.clone(helloSpace),
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
    removeSpectatorFromSpace: (state, oldUser) => {
      utils.typeCheck({ value: oldUser, type: 'object' })
      if (!state.spectators) { return }
      state.spectators = state.spectators.filter(user => {
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
        cache.updateSpace(key, state[key], state.id)
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
      const loadJournalSpace = context.rootState.loadJournalSpace
      const loadInboxSpace = context.rootState.loadInboxSpace
      const loadNewSpace = context.rootState.loadNewSpace
      const user = context.rootState.currentUser
      let isRemote
      // restore from url
      if (spaceUrl) {
        console.log('🚃 Restore space from url', spaceUrl)
        const spaceId = utils.spaceIdFromUrl(spaceUrl)
        const space = { id: spaceId }
        isRemote = true
        await context.dispatch('loadSpace', { space })
      // restore or create journal space
      } else if (loadJournalSpace) {
        console.log('🚃 Restore journal space')
        await context.dispatch('loadJournalSpace')
      // restore inbox space
      } else if (loadInboxSpace) {
        console.log('🚃 Restore inbox space')
        await context.dispatch('loadInboxSpace')
      // create new space
      } else if (loadNewSpace) {
        console.log('🚃 Create new space')
        await context.dispatch('addSpace')
        context.commit('loadNewSpace', false, { root: true })
      // restore last space
      } else if (user.lastSpaceId) {
        console.log('🚃 Restore last space', user.lastSpaceId)
        await context.dispatch('loadLastSpace')
      // hello kinopio
      } else {
        console.log('🚃 Create and restore hello space')
        shouldLoadNewHelloSpace = true
      }
      context.dispatch('checkIfShouldCreateNewUserSpaces')
      context.dispatch('updateModulesSpaceId')
      context.commit('triggerUpdateWindowHistory', { isRemote }, { root: true })
      context.dispatch('checkIfShouldShowExploreOnLoad')
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
        clearTimeout(spectatorIdleTimers[newUser.id])
        const removeIdleSpectator = (newUser) => {
          context.commit('removeSpectatorFromSpace', newUser)
        }
        spectatorIdleTimers[newUser.id] = setTimeout(() => {
          removeIdleSpectator(newUser)
        }, 60 * 1000) // 60 seconds
      }
    },
    addUserToJoinedSpace: (context, newUser) => {
      if (newUser.isCollaborator) {
        context.commit('addCollaboratorToSpace', newUser)
        context.commit('removeSpectatorFromSpace', newUser)
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
          const space = context.rootGetters['otherSpaceById'](spaceId)
        } else if (cardId) {
          const card = context.rootGetters['otherCardById'](cardId)
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
      if (!cardIds.length && !spaceIds.length && !invites.length) { return }
      if (options) { context.commit('isLoadingOtherItems', true, { root: true }) }
      try {
        // get items
        const data = await context.dispatch('api/getOtherItems', { spaceIds, cardIds, invites }, { root: true })
        console.log('👯‍♀️ otherItems', { spaceIds, cardIds, invites }, data)
        if (!data) {
          context.commit('isLoadingOtherItems', false, { root: true })
          return
        }
        // update items
        context.commit('updateOtherItems', data, { root: true })
        // update card dimensions
        const cardsInCurrentSpace = context.rootGetters['currentCards/all']
        data.spaces.forEach(space => {
          const linkedCard = cardsInCurrentSpace.find(card => {
            return card.linkToSpaceId === space.id
          })
          if (!linkedCard) { return }
          nextTick(() => {
            context.dispatch('currentConnections/updatePaths', { cardId: linkedCard.id, shouldUpdateApi: canEditSpace }, { root: true })
            context.dispatch('currentCards/updateDimensions', { cardId: linkedCard.id }, { root: true })
            context.commit('isLoadingOtherItems', false, { root: true })
          })
        })
      } catch (error) {
        console.error('🚒 updateOtherItems', error, { spaceIds, cardIds, invites })
        context.commit('isLoadingOtherItems', false, { root: true })
      }
    },

    // Space

    checkIfShouldCreateNewUserSpaces: (context) => {
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const spaces = cache.getAllSpaces()
      if (currentUserIsSignedIn) { return }
      if (spaces.length) { return }
      context.dispatch('createNewInboxSpace', true)
      context.dispatch('createNewHelloSpace')
      context.dispatch('updateUserLastSpaceId')
    },
    createNewHelloSpace: (context) => {
      const user = context.rootState.currentUser
      let space = utils.clone(helloSpace)
      space.id = nanoid()
      if (shouldLoadNewHelloSpace) {
        space = cache.updateIdsInSpace(space)
        context.commit('clearSearch', null, { root: true })
        context.dispatch('restoreSpaceInChunks', { space })
        context.commit('addUserToSpace', user)
        context.dispatch('updateOtherUsers')
        context.dispatch('updateOtherItems')
      } else {
        space.users = [context.rootState.currentUser]
        const nullCardUsers = true
        cache.updateIdsInSpace(space, nullCardUsers)
      }
    },
    createNewSpace: (context, space) => {
      context.commit('triggerSpaceZoomReset', null, { root: true })
      let name
      if (space) {
        name = space.name
      }
      space = utils.clone(newSpace)
      space.name = name || words.randomUniqueName()
      space.id = nanoid()
      space.createdAt = new Date()
      space.editedAt = new Date()
      const newSpacesAreBlank = context.rootState.currentUser.newSpacesAreBlank
      if (newSpacesAreBlank) {
        space.connectionTypes = []
        space.connections = []
        space.cards = []
        space.boxes = []
      } else {
        space.connectionTypes[0].color = randomColor({ luminosity: 'light' })
        space.cards[1].x = random(180, 200)
        space.cards[1].y = random(180, 200)
      }
      space.userId = context.rootState.currentUser.id
      space = utils.spaceDefaultBackground(space, context.rootState.currentUser)
      space.isTemplate = false
      space.isHidden = false
      const nullCardUsers = true
      const uniqueNewSpace = cache.updateIdsInSpace(space, nullCardUsers)
      context.commit('clearSearch', null, { root: true })
      isLoadingRemoteSpace = false
      context.dispatch('restoreSpaceInChunks', { space: uniqueNewSpace })
      context.commit('triggerUpdateBackground', null, { root: true })
    },
    createNewJournalSpace: async (context) => {
      const isTomorrow = context.rootState.loadJournalSpaceTomorrow
      const currentUser = utils.clone(context.rootState.currentUser)
      context.commit('isLoadingSpace', true, { root: true })
      // weather
      let weather = context.rootState.currentUser.weather
      if (!weather) {
        weather = await context.dispatch('api/weather', null, { root: true })
      }
      // daily prompt
      let options = { currentUser, isTomorrow, weather }
      if (currentUser.shouldCreateJournalsWithDailyPrompt) {
        options.dailyPrompt = currentUser.journalDailyPrompt
      }
      // create space
      const space = utils.journalSpace(options)
      context.commit('clearSearch', null, { root: true })
      context.commit('shouldResetDimensionsOnLoad', true, { root: true })
      isLoadingRemoteSpace = false
      // load space
      context.dispatch('restoreSpaceInChunks', { space })
      context.commit('triggerUpdateBackground', null, { root: true })
    },
    createNewInboxSpace: (context, shouldCreateWithoutLoading) => {
      let space = utils.clone(inboxSpace)
      space.id = nanoid()
      space.createdAt = new Date()
      space.editedAt = new Date()
      space.userId = context.rootState.currentUser.id
      space.cards = space.cards.map(card => {
        card.id = nanoid()
        return card
      })
      if (shouldCreateWithoutLoading) {
        space.users = [context.rootState.currentUser]
        const nullCardUsers = true
        cache.updateIdsInSpace(space, nullCardUsers) // saves space
      } else {
        context.commit('isLoadingSpace', true, { root: true })
        context.commit('clearSearch', null, { root: true })
        isLoadingRemoteSpace = false
        context.dispatch('restoreSpaceInChunks', { space })
        context.commit('triggerUpdateBackground', null, { root: true })
        nextTick(() => {
          context.dispatch('currentCards/updateDimensions', {}, { root: true })
        })
      }
    },
    saveNewSpace: (context) => {
      const space = utils.clone(context.state)
      const user = context.rootState.currentUser
      console.log('✨ saveNewSpace', space, user)
      cache.saveSpace(space)
      context.dispatch('api/addToQueue', {
        name: 'createSpace',
        body: space
      }, { root: true })
      context.commit('addUserToSpace', user)
      nextTick(() => {
        context.dispatch('currentCards/updateDimensions', {}, { root: true })
      })
      context.dispatch('updateModulesSpaceId', space)
    },
    saveImportedSpace: async (context) => {
      context.commit('isLoadingSpace', true, { root: true })
      const space = utils.clone(context.state)
      const user = context.rootState.currentUser
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      cache.saveSpace(space)
      if (currentUserIsSignedIn) {
        await context.dispatch('api/createSpace', space, { root: true })
      }
      context.commit('triggerUpdateWindowHistory', { space, isRemote: currentUserIsSignedIn }, { root: true })
      context.commit('addUserToSpace', user)
      context.commit('triggerUpdateBackground', null, { root: true })
      context.dispatch('updateModulesSpaceId', space)
      nextTick(() => {
        context.dispatch('currentCards/updateDimensions', {}, { root: true })
        context.commit('isLoadingSpace', false, { root: true })
      })
      context.dispatch('incrementCardsCreatedCountFromSpace', space)
    },
    duplicateSpace: async (context) => {
      let space = utils.clone(context.state)
      const user = context.rootState.currentUser
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      context.commit('clearSearch', null, { root: true })
      space = utils.clearSpaceMeta(space, 'copy')
      const nullCardUsers = true
      const uniqueNewSpace = cache.updateIdsInSpace(space, nullCardUsers)
      isLoadingRemoteSpace = false
      context.dispatch('loadSpace', { space: uniqueNewSpace, isLocalSpaceOnly: true })
      await context.dispatch('saveImportedSpace')
      context.commit('addNotification', { message: `${space.name} is now yours to edit`, type: 'success' }, { root: true })
    },
    addSpace: (context, space) => {
      const user = context.rootState.currentUser
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      context.dispatch('createNewSpace', space)
      const cards = context.rootGetters['currentCards/all']
      if (cards.length) {
        context.dispatch('currentConnections/updatePaths', { cardId: cards[1].id, connections: context.rootGetters['currentConnections/all'] }, { root: true })
      }
      context.dispatch('saveNewSpace')
      context.dispatch('updateUserLastSpaceId')
      context.commit('notifySignUpToEditSpace', false, { root: true })
      context.commit('triggerUpdateWindowHistory', {}, { root: true })
    },
    addJournalSpace: async (context) => {
      const user = context.rootState.currentUser
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      await context.dispatch('createNewJournalSpace')
      context.dispatch('saveNewSpace')
      context.dispatch('updateUserLastSpaceId')
      context.commit('notifySignUpToEditSpace', false, { root: true })
      context.commit('triggerUpdateWindowHistory', {}, { root: true })
    },

    addInboxSpace: (context) => {
      const user = context.rootState.currentUser
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      context.dispatch('createNewInboxSpace')
      context.dispatch('saveNewSpace')
      context.dispatch('updateUserLastSpaceId')
      context.commit('notifySignUpToEditSpace', false, { root: true })
      context.commit('triggerUpdateWindowHistory', {}, { root: true })
    },
    getRemoteSpace: async (context, space) => {
      const collaboratorKey = context.rootState.spaceCollaboratorKeys.find(key => key.spaceId === space.id)
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const user = context.rootState.currentUser
      const currentSpaceIsRemote = utils.currentSpaceIsRemote(space, user)
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
      } catch (error) {
        console.warn('🚑 getRemoteSpace', error.status, error)
        if (error.status === 404) {
          context.commit('notifySpaceNotFound', true, { root: true })
          context.dispatch('loadLastSpace')
        }
        if (error.status === 401) {
          context.commit('notifySpaceNotFound', true, { root: true })
          context.dispatch('removeLocalSpaceIfUserIsRemoved', space)
          context.dispatch('loadLastSpace')
          cache.removeInvitedSpace(space)
        }
        if (error.status === 500) {
          context.commit('notifyConnectionError', true, { root: true })
        }
      }
      if (!remoteSpace) { return }
      // only restore current space
      if (remoteSpace.id !== context.state.id) { return }
      // only cache spaces you can edit
      const isSpaceMember = context.rootGetters['currentUser/isSpaceMember'](remoteSpace)
      const canEditSpace = context.rootGetters['currentUser/canEditSpace'](remoteSpace)
      if (isSpaceMember && !remoteSpace.isRemoved) {
        cache.saveSpace(remoteSpace)
      } else if (!isSpaceMember && canEditSpace) {
        context.commit('addNotification', { message: 'This space is open, which means you can add to it too', icon: 'open', type: 'success' }, { root: true })
      }
      return utils.normalizeRemoteSpace(remoteSpace)
    },
    removeLocalSpaceIfUserIsRemoved: (context, space) => {
      const cachedSpace = cache.space(space.id)
      const currentUserIsRemovedFromSpace = utils.objectHasKeys(cachedSpace)
      context.dispatch('currentUser/removeFavorite', { type: 'space', item: space }, { root: true })
      if (currentUserIsRemovedFromSpace) {
        context.commit('currentUser/resetLastSpaceId', null, { root: true })
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
      let cards = context.rootGetters['currentCards/all']
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
    loadJournalSpace: async (context) => {
      const spaces = cache.getAllSpaces()
      const journalName = utils.journalSpaceName({ isTomorrow: context.rootState.loadJournalSpaceTomorrow })
      const journalSpace = spaces.find(space => space.name === journalName && !space.isRemoved)
      if (journalSpace) {
        const space = { id: journalSpace.id }
        context.dispatch('changeSpace', { space })
      } else {
        await context.dispatch('addJournalSpace')
        context.commit('triggerSpaceDetailsUpdateLocalSpaces', null, { root: true })
      }
      context.commit('loadJournalSpace', false, { root: true })
      context.commit('loadJournalSpaceTomorrow', false, { root: true })
    },
    loadInboxSpace: async (context) => {
      const inboxSpace = await context.dispatch('currentUser/inboxSpace', null, { root: true })
      if (inboxSpace) {
        const space = { id: inboxSpace.id }
        context.dispatch('changeSpace', { space })
      } else {
        context.commit('addNotification', { message: 'Inbox space not found', type: 'danger' }, { root: true })
        context.dispatch('loadLastSpace')
      }
      context.commit('loadInboxSpace', false, { root: true })
    },
    updateModulesSpaceId: (context, space) => {
      space = space || context.state
      console.log('💕 update modules space id', space.id)
      context.dispatch('currentCards/updateSpaceId', space.id, { root: true })
      context.dispatch('currentConnections/updateSpaceId', space.id, { root: true })
      context.dispatch('currentBoxes/updateSpaceId', space.id, { root: true })
    },
    restoreSpaceInChunks: (context, { space, isRemote, addCards, addConnections, addConnectionTypes, addBoxes }) => {
      if (!utils.objectHasKeys(space)) { return }
      console.log('🌱 Restoring space', space, { 'isRemote': isRemote, addCards, addConnections, addConnectionTypes, addBoxes })
      const chunkSize = 50
      const timeStart = utils.normalizeToUnixTime(new Date())
      const origin = { x: window.scrollX, y: window.scrollY }
      // init items
      let cards = addCards || space.cards || []
      let connectionTypes = addConnectionTypes || space.connectionTypes || []
      connectionTypes = connectionTypes.filter(type => Boolean(type))
      let connections = addConnections || space.connections || []
      cards = utils.normalizeItems(cards)
      connections = utils.normalizeItems(connections)
      let boxes = addBoxes || space.boxes || []
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
      context.commit('updatePageSizes', itemsRect, { root: true })
      // sort connections
      const connectionIds = Object.keys(connections)
      connections = connectionIds.map(id => {
        const connection = connections[id]
        const pathIsEmpty = connection.path === 'm0,0 q00,00 0,0'
        if (connection.path && !pathIsEmpty) {
          const coords = utils.coordsFromConnectionPath(connection.path)
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
      context.commit('triggerUpdateBackground', null, { root: true })
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
    restoreSpaceComplete: (context, { space, isRemote, timeStart }) => {
      context.dispatch('history/reset', null, { root: true })
      const timeEnd = utils.normalizeToUnixTime(new Date())
      let emoji = '🌳'
      if (isRemote) {
        emoji = '🌳🌏'
      }
      let cards = context.rootState.currentCards.ids.length
      let connections = context.rootState.currentConnections.ids.length
      let boxes = context.rootState.currentBoxes.ids.length
      console.log(`${emoji} Restore space complete in ${timeEnd - timeStart}ms,`, {
        cards,
        connections,
        boxes,
        spaceName: space.name,
        isRemote,
        cardUsers: context.rootGetters['currentCards/userIds']
      })
      if (isRemote) {
        context.dispatch('checkIfShouldNotifySignUpToEditSpace', space)
        context.dispatch('checkIfShouldNotifySpaceIsRemoved', space)
      }
      context.commit('broadcast/joinSpaceRoom', null, { root: true })
      context.commit('currentUser/updateFavoriteSpaceIsEdited', space.id, { root: true })
      nextTick(() => {
        context.dispatch('scrollCardsIntoView')
        // deferrable async tasks
        context.dispatch('updateOtherUsers')
        context.dispatch('updateOtherItems')
        context.dispatch('currentConnections/correctPaths', { shouldUpdateApi: isRemote }, { root: true })
        context.dispatch('currentCards/updateDimensions', {}, { root: true })
        context.dispatch('checkIfShouldResetDimensions')
        nextTick(() => {
          context.dispatch('currentConnections/correctPaths', { shouldUpdateApi: isRemote }, { root: true })
          context.dispatch('checkIfShouldPauseConnectionDirections')
          context.dispatch('checkIfShouldUpdateNewTweetCards', space)
          context.dispatch('api/addToQueue', {
            name: 'incrementVisits',
            body: { spaceId: space.id }
          }, { root: true })
          // referral
          nextTick(() => {
            context.dispatch('currentUser/validateReferral', null, { root: true })
            context.dispatch('currentUser/validateReferralByName', null, { root: true })
          })
        })
      })
      context.commit('isLoadingSpace', false, { root: true })
    },
    loadSpace: async (context, { space, isLocalSpaceOnly }) => {
      if (!context.rootState.isEmbedMode) {
        context.commit('triggerSpaceZoomReset', null, { root: true })
      }
      context.commit('resetPageSizes', null, { root: true })
      context.commit('isLoadingSpace', true, { root: true })
      context.commit('isAddPage', false, { root: true })
      const emptySpace = utils.emptySpace(space.id)
      const cachedSpace = cache.space(space.id) || space
      const user = context.rootState.currentUser
      cachedSpace.id = cachedSpace.id || space.id
      // clear state
      isLoadingRemoteSpace = false
      context.commit('notifySpaceIsRemoved', false, { root: true })
      context.commit('spaceUrlToLoad', '', { root: true })
      context.commit('userHasScrolled', false, { root: true })
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      context.commit('clearAllNotifications', null, { root: true })
      context.commit('clearSpaceFilters', null, { root: true })
      context.commit('clearSearch', null, { root: true })
      context.commit('shouldPreventNextEnterKey', false, { root: true })
      // restore local space
      context.commit('restoreSpace', emptySpace)
      context.dispatch('history/reset', null, { root: true })
      space = utils.normalizeSpace(cachedSpace)
      context.dispatch('restoreSpaceInChunks', { space })
      // merge with remote space items updated, added, removed
      if (isLocalSpaceOnly) { return }
      let remoteSpace = await context.dispatch('getRemoteSpace', space)
      if (!remoteSpace) { return }
      const spaceIsUnchanged = utils.spaceIsUnchanged(cachedSpace, remoteSpace)
      if (spaceIsUnchanged) { return }
      isLoadingRemoteSpace = true
      remoteSpace = utils.normalizeSpace(remoteSpace)
      // cards
      const cards = context.rootGetters['currentCards/all']
      const cardResults = utils.mergeSpaceKeyValues({ prevItems: cards, newItems: remoteSpace.cards })
      context.dispatch('currentCards/mergeUnique', cardResults.updateItems, { root: true })
      context.dispatch('currentCards/mergeRemove', cardResults.removeItems, { root: true })
      // connectionTypes
      const connectionTypes = context.rootGetters['currentConnections/allTypes']
      const connectionTypeReults = utils.mergeSpaceKeyValues({ prevItems: connectionTypes, newItems: remoteSpace.connectionTypes })
      context.dispatch('currentConnections/mergeUnique', { newItems: connectionTypeReults.updateItems, itemType: 'type' }, { root: true })
      context.dispatch('currentConnections/mergeRemove', { removeItems: connectionTypeReults.removeItems, itemType: 'type' }, { root: true })
      // connections
      const connections = context.rootGetters['currentConnections/all']
      const connectionResults = utils.mergeSpaceKeyValues({ prevItems: connections, newItems: remoteSpace.connections })
      context.dispatch('currentConnections/mergeUnique', { newItems: connectionResults.updateItems, itemType: 'connection' }, { root: true })
      context.dispatch('currentConnections/mergeRemove', { removeItems: connectionResults.removeItems, itemType: 'connection' }, { root: true })
      // boxes
      const boxes = context.rootGetters['currentBoxes/all']
      const boxResults = utils.mergeSpaceKeyValues({ prevItems: boxes, newItems: remoteSpace.boxes })
      context.dispatch('currentBoxes/mergeUnique', { newItems: boxResults.updateItems, itemType: 'box' }, { root: true })
      context.dispatch('currentBoxes/mergeRemove', { removeItems: boxResults.removeItems, itemType: 'box' }, { root: true })
      console.log('🎑 Merge space', {
        cards: cardResults,
        types: connectionTypeReults,
        connections: connectionResults,
        boxes: boxResults,
        localSpace: space,
        space: remoteSpace
      })
      context.dispatch('restoreSpaceInChunks', {
        space: remoteSpace,
        isRemote: true,
        addCards: cardResults.addItems,
        addConnectionTypes: connectionTypeReults.addItems,
        addConnections: connectionResults.addItems,
        addBoxes: boxResults.addItems
      })
    },
    loadLastSpace: async (context) => {
      let space
      const user = context.rootState.currentUser
      let spaceToRestore = cache.space(user.lastSpaceId)
      if (spaceToRestore.id) {
        space = spaceToRestore
      } else if (user.lastSpaceId) {
        space = { id: user.lastSpaceId }
      }
      if (space) {
        context.dispatch('loadSpace', { space })
      } else {
        context.dispatch('createNewHelloSpace')
      }
      context.dispatch('updateUserLastSpaceId')
    },
    updateSpace: async (context, updates) => {
      const space = utils.clone(context.state)
      updates.id = space.id
      if (updates.name) {
        const updatedSpace = utils.clone(space)
        updatedSpace.name = updates.name
      }
      context.commit('updateSpace', updates)
      context.dispatch('broadcast/update', { updates, type: 'updateSpace' }, { root: true })
      context.dispatch('api/addToQueue', {
        name: 'updateSpace',
        body: updates
      }, { root: true })
    },
    changeSpace: async (context, { space, isRemote }) => {
      console.log('🚟 Change space', { space, isRemote })
      context.commit('isLoadingSpace', true, { root: true })
      context.commit('notifySpaceNotFound', false, { root: true })
      context.commit('notifySpaceIsRemoved', false, { root: true })
      space = utils.clone(space)
      space = utils.migrationEnsureRemovedCards(space)
      await context.dispatch('loadSpace', { space })
      context.commit('triggerUpdateWindowHistory', { space, isRemote }, { root: true })
      const userIsMember = context.rootGetters['currentUser/isSpaceMember']
      if (!userIsMember) { return }
      context.dispatch('api/addToQueue', {
        name: 'updateSpace',
        body: { id: space.id, updatedAt: new Date() }
      }, { root: true })
      context.commit('parentCardId', '', { root: true })
      context.dispatch('updateUserLastSpaceId')
      const cardId = context.rootState.loadSpaceShowDetailsForCardId
      if (cardId) {
        context.dispatch('currentCards/showCardDetails', cardId, { root: true })
      }
    },
    updateUserLastSpaceId: (context) => {
      const space = context.state
      context.dispatch('currentUser/lastSpaceId', space.id, { root: true })
    },
    removeCurrentSpace: (context) => {
      const space = utils.clone(context.state)
      context.dispatch('decrementCardsCreatedCountFromSpace', space)
      cache.removeSpace(space)
      context.dispatch('api/addToQueue', {
        name: 'removeSpace',
        body: { id: space.id }
      }, { root: true })
    },
    deleteSpace: (context, space) => {
      cache.deleteSpace(space)
      context.dispatch('api/addToQueue', {
        name: 'deleteSpace',
        body: space
      }, { root: true })
    },
    restoreRemovedSpace: async (context, space) => {
      cache.restoreRemovedSpace(space)
      const restoredSpace = await context.dispatch('api/restoreRemovedSpace', space, { root: true })
      space = restoredSpace || space
      context.dispatch('incrementCardsCreatedCountFromSpace', space)
      context.dispatch('changeSpace', { space })
    },
    deleteAllRemovedSpaces: (context) => {
      const userId = context.rootState.currentUser.id
      const removedSpaces = cache.getAllRemovedSpaces()
      removedSpaces.forEach(space => cache.deleteSpace(space))
      context.dispatch('api/addToQueue', { name: 'deleteAllRemovedSpaces', body: { userId } }, { root: true })
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
        context.commit('triggerShowExplore', null, { root: true })
      }
      context.commit('shouldShowExploreOnLoad', false, { root: true })
    },
    checkIfShouldUpdateNewTweetCards: (context, space) => {
      if (!space.isFromTweet) { return }
      if (space.updateHash) { return }
      const cards = space.cards.reverse()
      console.log('🕊 updating tweet space', cards)
      const isUrlPreviews = cards.find(card => utils.urlFromString(card.name))
      if (isUrlPreviews) {
        context.commit('isLoadingSpace', true, { root: true })
      }
      context.commit('newTweetCards', cards, { root: true })
    },
    pauseConnectionDirections: (context, space) => {
      const svg = document.querySelector('svg.connections')
      svg.pauseAnimations()
      svg.setCurrentTime(1.5)
    },
    unpauseConnectionDirections: (context, space) => {
      const svg = document.querySelector('svg.connections')
      svg.unpauseAnimations()
    },
    checkIfShouldNotifySignUpToEditSpace: (context, space) => {
      const spaceIsOpen = space.privacy === 'open'
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const currentUserIsInvitedButCannotEditSpace = context.rootGetters['currentUser/isInvitedButCannotEditSpace'](space)
      if (spaceIsOpen && !currentUserIsSignedIn) {
        context.commit('notifySignUpToEditSpace', true, { root: true })
      } else if (currentUserIsInvitedButCannotEditSpace) {
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
      const spaceUserIsUpgraded = context.getters.spaceUserIsUpgraded
      if (spaceUserIsUpgraded) { return }
      const currentUser = context.rootState.currentUser
      if (currentUser.isUpgraded) { return }
      const cardsCreatedLimit = context.rootState.cardsCreatedLimit
      const value = cardsCreatedLimit - currentUser.cardsCreatedCount
      if (utils.isBetween({ value, min: 0, max: 10 })) {
        context.commit('notifyCardsCreatedIsNearLimit', true, { root: true })
      }
    },
    incrementCardsCreatedCountFromSpace (context, space) {
      const user = context.rootState.currentUser
      const incrementCardsCreatedCountBy = space.cards.filter(card => {
        return card.userId === user.id
      }).length
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: incrementCardsCreatedCountBy
      }, { root: true })
    },
    decrementCardsCreatedCountFromSpace (context, space) {
      const user = context.rootState.currentUser
      const decrementCardsCreatedCountBy = space.cards.filter(card => {
        return card.userId === user.id
      }).length
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: -decrementCardsCreatedCountBy
      }, { root: true })
    },

    // Tags

    addTag: (context, tag) => {
      let tagsInCard = context.getters.tagsInCard({ id: tag.cardId })
      tagsInCard = tagsInCard.map(card => card.name)
      if (tagsInCard.includes(tag.name)) { return }
      context.commit('addTag', tag)
      const update = { name: 'addTag', body: tag }
      const broadcastUpdate = { updates: tag, type: 'addTag' }
      context.dispatch('api/addToQueue', update, { root: true })
      context.dispatch('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
    },
    removeTag: (context, tag) => {
      context.commit('removeTag', tag)
      const update = { name: 'removeTag', body: tag }
      const broadcastUpdate = { updates: tag, type: 'removeTag' }
      context.dispatch('api/addToQueue', update, { root: true })
      context.dispatch('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
    },
    removeTags: (context, tag) => {
      context.commit('removeTags', tag)
      const update = { name: 'removeTags', body: tag }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
    },
    updateTagNameColor: (context, tag) => {
      context.commit('updateTagNameColor', tag)
      const update = { name: 'updateTagNameColor', body: tag }
      const broadcastUpdate = { updates: tag, type: 'updateTagNameColor' }
      context.dispatch('api/addToQueue', update, { root: true })
      context.dispatch('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
    },
    removeUnusedTagsFromCard: (context, cardId) => {
      const card = context.rootGetters['currentCards/byId'](cardId)
      if (!card) { return }
      const cardTagNames = utils.tagsFromStringWithoutBrackets(card.name) || []
      const tagsInCard = context.getters.tagsInCard({ id: cardId })
      const tagsToRemove = tagsInCard.filter(tag => !cardTagNames.includes(tag.name))
      tagsToRemove.forEach(tag => context.dispatch('removeTag', tag))
    }
  },

  getters: {
    all: (state, getters, rootState, rootGetters) => {
      let space = utils.clone(state)
      space.cards = utils.clone(rootGetters['currentCards/all'])
      space.connections = utils.clone(rootGetters['currentConnections/all'])
      space.connectionTypes = utils.clone(rootGetters['currentConnections/allTypes'])
      return space
    },

    // meta

    isHelloKinopio: (state) => {
      return state.name === 'Hello Kinopio'
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
      const isSpaceMember = rootGetters['currentUser/isSpaceMember']
      const isSignedIn = rootGetters['currentUser/isSignedIn']
      return isSpaceMember && isSignedIn
    },
    isFavorite: (state, getters, rootState) => {
      const favoriteSpaces = rootState.currentUser.favoriteSpaces
      const isFavoriteSpace = favoriteSpaces.filter(space => space.id === state.id)
      return Boolean(isFavoriteSpace.length)
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

    tags: (state, getters, rootState) => {
      const mergedTags = utils.mergeArrays({ previous: rootState.otherTags, updated: state.tags, key: 'name' })
      return mergedTags
    },
    tagByName: (state, getters) => (name) => {
      const tags = getters.tags
      return tags.find(tag => {
        return tag.name === name
      })
    },
    tagsInCard: (state, getters) => (card) => {
      const tags = getters.tags
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
      const users = state.users
      const collaborators = state.collaborators || []
      let members = []
      users.forEach(user => {
        members.push(user)
      })
      collaborators.forEach(user => {
        members.push(user)
      })
      if (excludeCurrentUser) {
        members = members.filter(user => user.id !== rootState.currentUser.id)
      }
      return members
    },
    memberById: (state, getters, rootState) => (id) => {
      const members = getters.members()
      return members.find(member => member.id === id)
    },
    userById: (state, getters, rootState, rootGetters) => (id) => {
      let user = getters.memberById(id) || rootGetters.otherUserById(id)
      if (rootState.currentUser.id === id) {
        user = rootState.currentUser
      }
      return user
    },
    spaceUserIsUpgraded: (state, getters, rootState) => {
      const currentUser = rootState.currentUser
      const users = state.users
      const userIds = users.map(user => user.id)
      if (userIds.includes(currentUser.id)) { return }
      let userIsUpgraded
      users.forEach(user => {
        if (user.isUpgraded) { userIsUpgraded = true }
      })
      return userIsUpgraded
    },
    spaceUserIsCurrentUser: (state, getters, rootState) => {
      const currentUser = rootState.currentUser
      const users = state.users
      const userIds = users.map(user => user.id)
      return userIds.includes(currentUser.id)
    },
    shouldPreventAddCard: (state, getters, rootState, rootGetters) => {
      const cardsCreatedIsOverLimit = rootGetters['currentUser/cardsCreatedIsOverLimit']
      const spaceUserIsUpgraded = getters.spaceUserIsUpgraded
      return cardsCreatedIsOverLimit && !spaceUserIsUpgraded
    }
  }
}

export default currentSpace
