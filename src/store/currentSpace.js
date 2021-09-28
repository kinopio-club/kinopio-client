import helloSpace from '@/data/hello.json'
import newSpace from '@/data/new.json'

import words from '@/data/words.js'
import moonphase from '@/moonphase.js'
import utils from '@/utils.js'
import cache from '@/cache.js'

import { nextTick } from 'vue'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import random from 'lodash-es/random'
import last from 'lodash-es/last'
import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'
import sortBy from 'lodash-es/sortBy'
import defer from 'lodash-es/defer'
import dayjs from 'dayjs'

let otherSpacesQueue = [] // id
let spectatorIdleTimers = []
let notifiedCardAdded = []

export default {
  namespaced: true,
  state: helloSpace,
  mutations: {

    restoreSpace: (state, space) => {
      space = utils.removeRemovedCardsFromSpace(space)
      Object.assign(state, space)
    },
    restoreCards: (state, cards) => {
      state.cards = state.cards.concat(cards)
    },
    restoreConnections: (state, connections) => {
      state.connections = state.connections.concat(connections)
    },

    // Users

    addUserToSpace: (state, newUser) => {
      utils.typeCheck({ value: newUser, type: 'object', origin: 'addUserToSpace' })
      const userExists = state.users.find(user => user.id === newUser.id)
      if (userExists) { return }
      state.users.push(newUser)
      cache.updateSpace('users', state.users, state.id)
    },
    addCollaboratorToSpace: (state, newUser) => {
      utils.typeCheck({ value: newUser, type: 'object', origin: 'addCollaboratorToSpace' })
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
      utils.typeCheck({ value: updates, type: 'array', origin: 'updateSpaceClients' })
      state.clients = state.clients.concat(updates)
    },
    removeClientsFromSpace: (state) => {
      state.clients = []
    },
    removeSpectatorFromSpace: (state, oldUser) => {
      utils.typeCheck({ value: oldUser, type: 'object', origin: 'removeSpectatorFromSpace' })
      if (!state.spectators) { return }
      state.spectators = state.spectators.filter(user => {
        return user.id !== oldUser.id
      })
    },
    removeUserFromSpace: (state, oldUser) => {
      utils.typeCheck({ value: oldUser, type: 'object', origin: 'removeUserFromSpace' })
      state.users = state.users.filter(user => {
        return user.id !== oldUser.id
      })
      cache.updateSpace('users', state.users, state.id)
    },
    removeCollaboratorFromSpace: (state, oldUser) => {
      utils.typeCheck({ value: oldUser, type: 'object', origin: 'removeCollaboratorFromSpace' })
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

    // Cards

    updateCard: (state, updatedCard) => {
      if (updatedCard.x) {
        updatedCard.x = Math.round(updatedCard.x)
      }
      if (updatedCard.y) {
        updatedCard.y = Math.round(updatedCard.y)
      }
      state.cards = state.cards.map(card => {
        if (card.id === updatedCard.id) {
          const updates = Object.keys(updatedCard)
          updates.forEach(key => {
            card[key] = updatedCard[key]
          })
        }
        return card
      })
      cache.updateSpace('cards', state.cards, state.id)
    },
    moveCards: (state, { cards, delta }) => {
      const maxOffset = 0
      cards.forEach(card => {
        card.x += delta.x || 0
        card.y += delta.y || 0
        card.x = Math.max(card.x, maxOffset)
        card.y = Math.max(card.y, maxOffset)
      })
      cache.updateSpaceCardsDebounced(state.cards, state.id)
    },
    moveCardsBroadcast: (state, { cards, delta }) => {
      cards.forEach(updated => {
        const card = state.cards.find(card => card.id === updated.id)
        if (!card) { return }
        card.x = updated.x
        card.y = updated.y
      })
      cache.updateSpace('cards', state.cards, state.id)
    },
    createCard: (state, card) => {
      state.cards.push(card)
      cache.updateSpace('cards', state.cards, state.id)
    },
    removeCard: (state, cardToRemove) => {
      const card = state.cards.find(card => card.id === cardToRemove.id)
      state.cards = state.cards.filter(card => card.id !== cardToRemove.id)
      state.removedCards.unshift(card)
      cache.updateSpace('removedCards', state.removedCards, state.id)
      cache.updateSpace('cards', state.cards, state.id)
    },
    removedCards: (state, removedCards) => {
      state.removedCards = removedCards
    },
    removeCardPermanent: (state, cardToRemove) => {
      state.cards = state.cards.filter(card => card.id !== cardToRemove.id)
      const fromRemovedCards = state.removedCards.find(card => card.id === cardToRemove.id)
      if (fromRemovedCards) {
        state.removedCards = state.removedCards.filter(card => card.id !== cardToRemove.id)
        cache.updateSpace('removedCards', state.removedCards, state.id)
      } else {
        cache.updateSpace('cards', state.cards, state.id)
      }
    },
    removeAllRemovedCardsPermanent: (state) => {
      state.removedCards = []
      cache.updateSpace('removedCards', state.removedCards, state.id)
    },
    restoreRemovedCard: (state, cardToRestore) => {
      const index = state.removedCards.findIndex(card => card.id === cardToRestore.id)
      const card = state.removedCards[index]
      state.cards.push(card)
      state.removedCards.splice(index, 1)
      cache.updateSpace('cards', state.cards, state.id)
      cache.updateSpace('removedCards', state.removedCards, state.id)
    },

    // Connections

    updateConnection: (state, updatedConnection) => {
      // ⤵ same as updateConnectionReadOnly, but with cache.updateSpace
      state.connections.map(connection => {
        if (connection.id === updatedConnection.id) {
          const updates = Object.keys(updatedConnection)
          updates.forEach(key => {
            connection[key] = updatedConnection[key]
          })
        }
      })
      cache.updateSpace('connections', state.connections, state.id)
    },
    updateConnectionReadOnly: (state, updatedConnection) => {
      // ⤴ same as updateConnection, without cache.updateSpace
      state.connections.map(connection => {
        if (connection.id === updatedConnection.id) {
          const updates = Object.keys(updatedConnection)
          updates.forEach(key => {
            connection[key] = updatedConnection[key]
          })
        }
      })
    },
    updateConnectionPaths: (state, connections) => {
      connections.forEach(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        connection.spaceId = state.id
      })
      cache.updateSpaceConnectionsDebounced(state.connections, state.id)
    },
    updateConnectionPathsBroadcast: (state, { connections }) => {
      connections.forEach(updated => {
        state.connections.find(connection => connection.id === updated.id).path = updated.path
      })
      cache.updateSpace('connections', state.connections, state.id)
    },
    addConnection: (state, connection) => {
      state.connections.push(connection)
      cache.updateSpace('connections', state.connections, state.id)
    },
    removeConnection: (state, connectionToRemove) => {
      const connections = state.connections.filter(connection => {
        return connection.id !== connectionToRemove.id
      })
      state.connections = connections
      cache.updateSpace('connections', state.connections, state.id)
    },
    updateConnectionTypeForConnection: (state, { connectionId, connectionTypeId }) => {
      state.connections.map(connection => {
        if (connection.id === connectionId) {
          connection.connectionTypeId = connectionTypeId
        }
      })
      cache.updateSpace('connections', state.connections, state.id)
    },
    updateLabelIsVisibleForConnection: (state, { connectionId, labelIsVisible }) => {
      state.connections.map(connection => {
        if (connection.id === connectionId) {
          connection.labelIsVisible = labelIsVisible
        }
      })
      cache.updateSpace('connections', state.connections, state.id)
    },

    // Connection Types

    addConnectionType: (state, connectionType) => {
      state.connectionTypes.push(connectionType)
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    removeConnectionType: (state, connectionType) => {
      state.connectionTypes = state.connectionTypes.filter(type => {
        return connectionType.id !== type.id
      })
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    updateConnectionType: (state, updatedType) => {
      state.connectionTypes.map(type => {
        if (type.id === updatedType.id) {
          const updates = Object.keys(updatedType)
          updates.forEach(key => {
            type[key] = updatedType[key]
          })
        }
      })
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    reorderConnectionTypeToLast: (state, connectionType) => {
      state.connectionTypes = state.connectionTypes.filter(type => {
        return connectionType.id !== type.id
      })
      state.connectionTypes.push(connectionType)
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
    removeTagsFromAllRemovedCardsPermanent: (state) => {
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
      const spaceUrl = context.rootState.spaceUrlToLoad
      const loadJournalSpace = context.rootState.loadJournalSpace
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
        console.log('🚃 Create new Hello Kinopio space')
        await context.dispatch('createNewHelloSpace')
        context.dispatch('updateUserLastSpaceId')
      }
      context.commit('triggerUpdateWindowHistory', { isRemote }, { root: true })
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const shouldShow = context.rootState.currentUser.shouldShowNewUserNotification
      if (!currentUserIsSignedIn && shouldShow) {
        context.commit('notifyNewUser', true, { root: true })
      } else {
        context.commit('notifyNewUser', false, { root: true })
      }
    },

    // Users and otherSpaces

    updateUserPresence: (context, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'updateUserPresence' })
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
    updateOtherUsers: async (context) => {
      const cards = utils.clone(context.state.cards)
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
      const users = await context.dispatch('api/getPublicUsers', otherUserIds, { root: true })
      users.forEach(user => {
        context.commit('updateOtherUsers', user, { root: true })
      })
    },
    updateOtherSpaces: async (context, spaceId) => {
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      let links
      if (spaceId) {
        links = [{ linkToSpaceId: spaceId }]
      } else {
        links = context.getters.cardsWithSpaceLinks
      }
      if (!links.length) { return }
      links.forEach(link => {
        const spaceId = link.linkToSpaceId
        context.dispatch('saveOtherSpace', { spaceId, shouldAddToQueue: true })
      })
      otherSpacesQueue = uniq(otherSpacesQueue)
      let spaces = await context.dispatch('api/getSpaces', { spaceIds: otherSpacesQueue, shouldRequestRemote: true }, { root: true })
      if (!spaces) { return }
      spaces = spaces.filter(space => space.id)
      spaces.forEach(space => {
        space = utils.normalizeSpaceMetaOnly(space)
        context.commit('updateOtherSpaces', space, { root: true })
        const linkedCard = links.find(link => link.linkToSpaceId === space.id)
        if (!linkedCard) { return }
        nextTick(() => {
          context.dispatch('updateCardConnectionPaths', { cardId: linkedCard.id, shouldUpdateApi: canEditSpace })
        })
      })
      otherSpacesQueue = []
    },
    saveOtherSpace: async (context, { spaceId, shouldAddToQueue }) => {
      const cachedSpace = cache.space(spaceId)
      const spaceIsCached = Boolean(cachedSpace.id)
      if (spaceIsCached) {
        const space = utils.normalizeSpaceMetaOnly(cachedSpace)
        context.commit('updateOtherSpaces', space, { root: true })
      } else if (shouldAddToQueue) {
        otherSpacesQueue.push(spaceId)
      } else {
        try {
          const space = { id: spaceId }
          let remoteSpace = await context.dispatch('api/getSpace', { space, shouldRequestRemote: true }, { root: true })
          remoteSpace = utils.normalizeSpaceMetaOnly(remoteSpace)
          context.commit('updateOtherSpaces', remoteSpace, { root: true })
        } catch (error) {
          console.warn('🚑 otherSpace not found', error, spaceId)
        }
      }
    },

    // Space

    createNewHelloSpace: (context) => {
      const user = context.rootState.currentUser
      let space = utils.clone(helloSpace)
      space.id = nanoid()
      space = cache.updateIdsInSpace(space)
      context.commit('clearSearch', null, { root: true })
      context.commit('restoreSpace', space)
      context.commit('addUserToSpace', user)
      context.dispatch('updateOtherUsers')
      context.dispatch('updateOtherSpaces')
    },
    createNewSpace: (context) => {
      let space = utils.clone(newSpace)
      space.name = words.randomUniqueName()
      space.id = nanoid()
      const newSpacesAreBlank = context.rootState.currentUser.newSpacesAreBlank
      if (newSpacesAreBlank) {
        space.connectionTypes = []
        space.connections = []
        space.cards = []
      } else {
        space.connectionTypes[0].color = randomColor({ luminosity: 'light' })
        space.cards[1].x = random(180, 200)
        space.cards[1].y = random(180, 200)
      }
      space.userId = context.rootState.currentUser.id
      const nullCardUsers = true
      const uniqueNewSpace = cache.updateIdsInSpace(space, nullCardUsers)
      context.commit('clearSearch', null, { root: true })
      context.commit('restoreSpace', uniqueNewSpace)
      context.dispatch('loadBackground')
    },
    saveNewSpace: (context) => {
      const space = utils.clone(context.state)
      const user = context.rootState.currentUser
      cache.saveSpace(space)
      context.dispatch('api/addToQueue', {
        name: 'createSpace',
        body: space
      }, { root: true })
      context.commit('addUserToSpace', user)
      nextTick(() => {
        context.dispatch('updateCardsDimensions')
      })
    },
    saveImportedSpace: async (context) => {
      const space = utils.clone(context.state)
      const user = context.rootState.currentUser
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      cache.saveSpace(space)
      if (currentUserIsSignedIn) {
        await context.dispatch('api/createSpace', space, { root: true })
      }
      context.commit('triggerUpdateWindowHistory', { space, isRemote: currentUserIsSignedIn }, { root: true })
      context.commit('addUserToSpace', user)
      context.dispatch('loadBackground')
      nextTick(() => {
        context.dispatch('updateCardsDimensions')
      })
    },
    duplicateSpace: (context) => {
      const user = context.rootState.currentUser
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      let space = utils.clone(context.state)
      space = utils.clearSpaceMeta(space, 'copy')
      const nullCardUsers = true
      const uniqueNewSpace = cache.updateIdsInSpace(space, nullCardUsers)
      context.commit('clearSearch', null, { root: true })
      context.commit('restoreSpace', uniqueNewSpace)
      nextTick(() => {
        context.dispatch('updateUserLastSpaceId')
        context.dispatch('saveNewSpace')
        context.commit('notifyNewUser', false, { root: true })
        context.commit('triggerFocusSpaceDetailsName', null, { root: true })
      })
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      context.commit('triggerUpdateWindowHistory', { space, isRemote: currentUserIsSignedIn }, { root: true })
    },
    addSpace: (context) => {
      const user = context.rootState.currentUser
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      context.dispatch('createNewSpace')
      const cards = context.state.cards
      nextTick(() => {
        if (cards.length) {
          context.dispatch('updateCardConnectionPaths', { cardId: cards[1].id, connections: context.state.connections })
        }
        context.dispatch('saveNewSpace')
        context.dispatch('updateUserLastSpaceId')
        context.commit('notifyNewUser', false, { root: true })
        context.commit('notifySignUpToEditSpace', false, { root: true })
        context.commit('triggerUpdateWindowHistory', {}, { root: true })
      })
    },
    addNewJournalSpace: (context) => {
      const user = context.rootState.currentUser
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      // journal date
      let date = dayjs(new Date())
      if (context.rootState.loadJournalSpaceTomorrow) {
        date = date.add(1, 'day')
      }
      const moonPhase = moonphase(date)
      const day = `${moonPhase.emoji} ${date.format('dddd')}` // 🌘 Tuesday
      // space meta
      const spaceId = nanoid()
      let space = utils.emptySpace(spaceId)
      space.name = utils.journalSpaceName(context.rootState.loadJournalSpaceTomorrow)
      space.privacy = 'private'
      space.moonPhase = moonPhase.name
      space.removedCards = []
      // cards
      space.cards.push({ id: nanoid(), name: day, x: 60, y: 100, frameId: 0 })
      const userPrompts = context.rootState.currentUser.journalPrompts
      userPrompts.forEach(prompt => {
        if (!prompt.name) { return }
        let card = { id: nanoid() }
        if (prompt.packId) {
          const pack = context.rootGetters['currentUser/packById'](prompt.packId)
          const randomPrompt = utils.randomPrompt(pack)
          const tag = utils.packTag(pack, card.id, space)
          if (tag) { space.tags.push(tag) }
          card.name = `[[${prompt.name}]] ${randomPrompt}`
        } else {
          card.name = prompt.name
        }
        const position = utils.promptCardPosition(space.cards, card.name)
        card.x = position.x
        card.y = position.y
        card.z = 0
        card.spaceId = spaceId
        space.cards.push(card)
      })
      context.commit('clearSearch', null, { root: true })
      context.commit('restoreSpace', space)
      context.dispatch('saveNewSpace')
      context.dispatch('currentUser/lastSpaceId', space.id, { root: true })
      context.commit('triggerUpdateWindowHistory', {}, { root: true })
      context.dispatch('loadBackground')
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
          context.commit('collaboratorKey', '', { root: true })
        } else if (currentSpaceIsRemote) {
          remoteSpace = await context.dispatch('api/getSpaceAnonymously', space, { root: true })
        }
      } catch (error) {
        console.warn('🚑', error.status, error)
        if (error.status === 404) {
          context.commit('notifySpaceNotFound', true, { root: true })
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
        console.log('🌌', remoteSpace)
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
        cache.removeSpacePermanent(space)
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
    updateSpacePageSize: (context) => {
      nextTick(() => {
        context.commit('updateSpacePageSize', null, { root: true })
      })
    },
    removeEmptyCards: (context) => {
      let cards = context.state.cards
      cards.forEach(card => {
        if (!card.name) {
          context.dispatch('removeCard', card)
        }
      })
    },
    loadJournalSpace: async (context) => {
      const spaces = cache.getAllSpaces()
      const journalName = utils.journalSpaceName(context.rootState.loadJournalSpaceTomorrow)
      const journalSpace = spaces.find(space => space.name === journalName)
      if (journalSpace) {
        const space = { id: journalSpace.id }
        context.dispatch('changeSpace', { space })
      } else {
        context.dispatch('addNewJournalSpace')
      }
      context.commit('loadJournalSpace', false, { root: true })
      context.commit('loadJournalSpaceTomorrow', false, { root: true })
    },
    restoreSpaceInChunks: (context, { space, isRemote }) => {
      if (!utils.objectHasKeys(space)) { return }
      const chunkSize = 50
      const cards = space.cards
      const connections = space.connections
      const timeStart = utils.normalizeToUnixTime(new Date())
      space.cards = []
      space.connections = []
      context.commit('isLoadingSpace', true, { root: true })
      context.commit('restoreSpace', space)
      // restore cards
      let chunks = utils.splitArrayIntoChunks(cards, chunkSize)
      chunks.forEach(chunk => {
        defer(function () {
          context.commit('restoreCards', chunk)
        })
      })
      // restore connections
      chunks = utils.splitArrayIntoChunks(connections, chunkSize)
      if (!chunks.length) {
        context.dispatch('restoreSpaceComplete', { space, isRemote, timeStart })
        return
      }
      chunks.forEach((chunk, index) => {
        defer(function () {
          context.commit('restoreConnections', chunk)
          const isRestoreComplete = index === chunks.length - 1
          if (isRestoreComplete) {
            context.dispatch('restoreSpaceComplete', { space, isRemote, timeStart })
          }
        })
      })
    },
    restoreSpaceComplete: (context, { space, isRemote, timeStart }) => {
      context.commit('isLoadingSpace', false, { root: true })
      const timeEnd = utils.normalizeToUnixTime(new Date())
      console.log(`🐇 space: ${space.name}, loaded in ${timeEnd - timeStart}ms, cards ${context.state.cards.length}, connections ${context.state.connections.length}`, '🌏 is remote: ', isRemote)
    },
    loadSpace: async (context, { space }) => {
      const emptySpace = utils.emptySpace(space.id)
      const cachedSpace = cache.space(space.id)
      const user = context.rootState.currentUser
      // clear state
      context.commit('clearCardMap', null, { root: true })
      context.commit('userHasScrolled', false, { root: true })
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      context.commit('clearAllNotifications', null, { root: true })
      context.commit('clearSpaceFilters', null, { root: true })
      context.commit('clearSearch', null, { root: true })
      // restore local space
      context.commit('restoreSpace', emptySpace)
      context.dispatch('restoreSpaceInChunks', { space: utils.normalizeSpace(cachedSpace) })
      context.dispatch('updateSpacePageSize')
      context.dispatch('loadBackground')
      context.commit('undoHistory/clear', null, { root: true })
      // restore remote space
      const remoteSpace = await context.dispatch('getRemoteSpace', space)
      const remoteSpaceIsUpdated = remoteSpace.editedAt !== cachedSpace.editedAt
      if (remoteSpace && remoteSpaceIsUpdated) {
        context.commit('restoreSpace', emptySpace)
        context.dispatch('restoreSpaceInChunks', { space: utils.normalizeSpace(remoteSpace), isRemote: true })
        context.dispatch('undoHistory/playback', null, { root: true })
        context.dispatch('checkIfShouldNotifySignUpToEditSpace', remoteSpace)
        context.commit('broadcast/joinSpaceRoom', null, { root: true })
        context.dispatch('checkIfShouldNotifySpaceIsRemoved', remoteSpace)
        if (cache.getAllSpaces().length) {
          context.commit('notifyNewUser', false, { root: true })
        } else {
          context.commit('notifyNewUser', true, { root: true })
        }
      }
      context.commit('spaceUrlToLoad', '', { root: true })
      context.dispatch('updateSpacePageSize')
      context.dispatch('loadBackground')
      context.dispatch('updateOtherUsers')
      context.dispatch('updateOtherSpaces')
      const cardId = context.rootState.loadSpaceShowDetailsForCardId
      if (cardId) {
        context.dispatch('showCardDetails', cardId)
      }
      context.commit('currentUser/updateFavoriteSpaceIsEdited', space.id, { root: true })
      nextTick(() => {
        context.dispatch('updateIncorrectCardConnectionPaths', { shouldUpdateApi: Boolean(remoteSpace) })
        context.dispatch('scrollCardsIntoView')
        context.dispatch('updatePageSizes', null, { root: true })
      })
    },
    loadLastSpace: (context) => {
      const user = context.rootState.currentUser
      let spaceToRestore = cache.space(user.lastSpaceId)
      if (!spaceToRestore.id) {
        spaceToRestore = { id: user.lastSpaceId }
      }
      context.dispatch('loadSpace', { space: spaceToRestore })
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
      context.commit('broadcast/update', { updates, type: 'updateSpace' }, { root: true })
      context.dispatch('api/addToQueue', {
        name: 'updateSpace',
        body: updates
      }, { root: true })
    },
    changeSpace: async (context, { space, isRemote }) => {
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
        context.dispatch('showCardDetails', cardId)
      }
    },
    updateUserLastSpaceId: (context) => {
      const space = context.state
      const canEdit = context.rootGetters['currentUser/canEditSpace']()
      if (space.isRemoved || !canEdit) { return }
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
    removeSpacePermanent: (context, space) => {
      cache.removeSpacePermanent(space)
      context.dispatch('api/addToQueue', {
        name: 'removeSpacePermanent',
        body: space
      }, { root: true })
    },
    removeAllRemovedSpacesPermanent: (context) => {
      const userId = context.rootState.currentUser.id
      const removedSpaces = cache.getAllRemovedSpaces()
      removedSpaces.forEach(space => cache.removeSpacePermanent(space))
      context.dispatch('api/addToQueue', { name: 'removeAllRemovedSpacesPermanentFromUser', body: { userId } }, { root: true })
    },
    checkIfShouldNotifySpaceIsRemoved: (context, space) => {
      const canEdit = context.rootGetters['currentUser/canEditSpace']()
      if (space.isRemoved && canEdit) {
        context.commit('notifySpaceIsRemoved', true, { root: true })
      } else {
        context.commit('notifySpaceIsRemoved', false, { root: true })
      }
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
      context.commit('broadcast/update', { user, type: 'userLeftSpace' }, { root: true })
      context.dispatch('api/removeSpaceCollaborator', { space, user }, { root: true })
      context.commit('removeCollaboratorFromSpace', user)
      const isCurrentUser = user.id === context.rootState.currentUser.id
      if (isCurrentUser) {
        context.dispatch('loadLastSpace')
        cache.removeInvitedSpace(space)
        cache.removeSpacePermanent(space)
        context.commit('addNotification', { message: `You left ${space.name}`, type: 'success' }, { root: true })
      } else {
        context.commit('addNotification', { message: `${userName} removed from space`, type: 'success' }, { root: true })
      }
    },
    scrollCardsIntoView: (context) => {
      if (context.rootState.userHasScrolled) { return }
      const origin = { x: 0, y: 0 }
      let cards = utils.clone(context.state.cards)
      cards = cards.map(card => {
        card = {
          x: card.x,
          y: card.y,
          distanceFromOrigin: utils.distanceBetweenTwoPoints(card, origin)
        }
        return card
      })
      cards = sortBy(cards, ['distanceFromOrigin'])
      const card = cards[0]
      if (!card) { return }
      const xIsVisible = context.rootState.viewportWidth + window.scrollX > card.x
      const yIsVisible = context.rootState.viewportHeight + window.scrollY > card.y
      if (xIsVisible && yIsVisible) { return }
      const position = {
        x: Math.max(card.x - 100, 0),
        y: Math.max(card.y - 100, 0)
      }
      nextTick(() => {
        window.scrollTo(position.x, position.y)
      })
    },

    // Card Count

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

    // Cards

    addCard: (context, { position, isParentCard, name, id }) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'addCard' })
      if (context.getters.shouldPreventAddCard) {
        context.commit('notifyCardsCreatedIsOverLimit', true, { root: true })
        return
      }
      let cards = context.state.cards
      const highestCardZ = utils.highestCardZ(cards)
      let card = {
        id: id || nanoid(),
        x: position.x,
        y: position.y,
        z: highestCardZ + 1,
        name: name || '',
        frameId: 0,
        userId: context.rootState.currentUser.id,
        urlPreviewIsVisible: true,
        commentIsVisible: true,
        width: utils.emptyCard().width,
        height: utils.emptyCard().height
      }
      context.commit('cardDetailsIsVisibleForCardId', card.id, { root: true })
      context.commit('createCard', card)
      card.spaceId = context.state.id
      card = utils.clone(card)
      const update = { name: 'createCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'createCard' }, { root: true })
      context.commit('undoHistory/add', update, { root: true })
      if (isParentCard) { context.commit('parentCardId', card.id, { root: true }) }
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: 1
      }, { root: true })
      context.dispatch('checkIfShouldNotifyCardsCreatedIsNearLimit')
      context.dispatch('notifyCollaboratorsCardUpdated', { cardId: id, type: 'createCard' })
    },
    addMultipleCards: (context, newCards) => {
      newCards.forEach(card => {
        card = {
          id: card.id || nanoid(),
          x: card.x,
          y: card.y,
          z: context.state.cards.length + 1,
          name: card.name,
          frameId: card.frameId || 0,
          userId: context.rootState.currentUser.id
        }
        context.commit('createCard', card)
        const update = { name: 'createCard', body: card }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('broadcast/update', { updates: card, type: 'createCard' }, { root: true })
        context.commit('undoHistory/add', update, { root: true })
      })
    },
    // shim for history/playback
    createCard: (context, card) => {
      context.commit('createCard', card)
    },
    pasteCard: (context, { card, cardId }) => {
      utils.typeCheck({ value: card, type: 'object', origin: 'pasteCard' })
      card = utils.clone(card)
      card.id = cardId || nanoid()
      card.spaceId = context.state.id
      const existingCards = context.state.cards
      utils.uniqueCardPosition(card, existingCards)
      const tags = utils.tagsFromStringWithoutBrackets(card.name)
      if (tags) {
        tags.forEach(tag => {
          tag = utils.newTag({
            name: tag,
            defaultColor: context.rootState.currentUser.color,
            cardId: card.id,
            spaceId: context.state.id
          })
          context.dispatch('addTag', tag)
        })
      }
      context.commit('createCard', card)
      const update = { name: 'createCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'createCard' }, { root: true })
      context.commit('undoHistory/add', update, { root: true })
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: 1
      }, { root: true })
    },
    repaceInCardName: (context, { cardId, match, replace }) => {
      const card = context.getters.cardById(cardId)
      const name = card.name.replace(match, replace)
      context.dispatch('updateCard', {
        id: cardId,
        name
      })
    },
    updateCard: (context, card) => {
      card = utils.clone(card)
      context.commit('updateCard', card)
      // prevent null position
      const cardKeys = Object.keys(card)
      if (cardKeys.includes('x') || cardKeys.includes('y')) {
        if (!card.x) {
          delete card.x
        }
        if (!card.y) {
          delete card.y
        }
      }
      card = utils.updateCardDimentions(card)
      const update = { name: 'updateCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'updateCard' }, { root: true })
      context.commit('undoHistory/add', update, { root: true })
    },
    updateCardsDimensions: (context) => {
      let cards = utils.clone(context.state.cards)
      cards.forEach(card => {
        const prevDimensions = {
          width: card.width,
          height: card.height
        }
        card = utils.updateCardDimentions(card)
        const dimensionsChanged = card.width !== prevDimensions.width || card.height !== prevDimensions.height
        if (dimensionsChanged) {
          const body = {
            id: card.id,
            width: Math.ceil(card.width),
            height: Math.ceil(card.height)
          }
          const update = { name: 'updateCard', body }
          context.dispatch('api/addToQueue', update, { root: true })
          context.commit('broadcast/update', { updates: body, type: 'updateCard' }, { root: true })
          context.commit('updateCard', body)
        }
      })
    },
    toggleCardChecked (context, { cardId, value }) {
      utils.typeCheck({ value, type: 'boolean', origin: 'toggleCardChecked' })
      utils.typeCheck({ value: cardId, type: 'string', origin: 'toggleCardChecked' })
      const card = context.getters.cardById(cardId)
      let name = card.name
      const checkbox = utils.checkboxFromString(name)
      name = name.replace(checkbox, '')
      if (value) {
        name = `[x] ${name}`
      } else {
        name = `[] ${name}`
      }
      context.dispatch('updateCard', {
        id: cardId,
        name,
        nameUpdatedAt: new Date()
      })
    },
    clearAllCardsZ: (context) => {
      let cards = context.state.cards
      cards.forEach(card => {
        const body = { id: card.id, z: 0 }
        const update = { name: 'updateCard', body }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('broadcast/update', { updates: body, type: 'updateCard' }, { root: true })
        context.commit('updateCard', body)
      })
    },
    incrementCardZ: (context, cardId) => {
      const maxInt = Number.MAX_SAFE_INTEGER - 1000
      let cards = context.state.cards
      let highestCardZ = utils.highestCardZ(cards)
      if (highestCardZ > maxInt) {
        context.dispatch('clearAllCardsZ')
        highestCardZ = 1
      }
      const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
      const body = { id: cardId, z: highestCardZ + 1 }
      const update = { name: 'updateCard', body }
      context.commit('updateCard', body)
      if (!userCanEdit) { return }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: body, type: 'updateCard' }, { root: true })
    },
    removeCard: (context, card) => {
      const cardHasContent = Boolean(card.name)
      if (cardHasContent) {
        context.commit('removeCard', card)
        const update = { name: 'removeCard', body: card }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('undoHistory/add', update, { root: true })
      } else {
        context.dispatch('removeCardPermanent', card)
      }
      context.commit('broadcast/update', { updates: card, type: 'removeCard' }, { root: true })
      context.dispatch('removeConnectionsFromCard', card)
      context.commit('triggerUpdatePositionInVisualViewport', null, { root: true })
      const cardIsUpdatedByCurrentUser = card.userId === context.rootState.currentUser.id
      if (cardIsUpdatedByCurrentUser) {
        context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
          delta: -1
        }, { root: true })
      }
      if (!context.rootGetters['currentUser/cardsCreatedIsOverLimit']) {
        context.commit('notifyCardsCreatedIsOverLimit', false, { root: true })
      }
    },
    removeCardPermanent: (context, card) => {
      context.commit('removeCardPermanent', card)
      context.commit('removeTagsFromCard', card)
      context.dispatch('api/addToQueue', { name: 'removeCardPermanent', body: card }, { root: true })
    },
    removeAllRemovedCardsPermanent: (context) => {
      context.commit('removeTagsFromAllRemovedCardsPermanent')
      context.commit('removeAllRemovedCardsPermanent')
      context.dispatch('api/addToQueue', { name: 'removeAllRemovedCardsPermanentFromSpace', body: {} }, { root: true })
    },
    restoreRemovedCard: (context, card) => {
      context.commit('restoreRemovedCard', card)
      const update = { name: 'restoreRemovedCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'restoreRemovedCard' }, { root: true })
      context.commit('undoHistory/add', update, { root: true })
    },
    restoreRemovedSpace: (context, space) => {
      cache.restoreRemovedSpace(space)
      context.dispatch('incrementCardsCreatedCountFromSpace', space)
      context.dispatch('api/addToQueue', { name: 'restoreRemovedSpace',
        body: {
          id: space.id
        } }, { root: true })
      space.isRemoved = false
      context.dispatch('changeSpace', { space })
    },
    dragCards: (context, { endCursor, prevCursor, delta }) => {
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const zoom = context.rootGetters.spaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      endCursor = {
        x: endCursor.x * zoom,
        y: endCursor.y * zoom
      }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      let cards
      let connections = []
      if (multipleCardsSelectedIds.length) {
        cards = multipleCardsSelectedIds
      } else {
        cards = [currentDraggingCardId]
      }
      cards = cards.map(cardId => context.getters.cardById(cardId))
      // prevent cards bunching up at 0
      cards.forEach(card => {
        if (card.x === 0) { delta.x = Math.max(0, delta.x) }
        if (card.y === 0) { delta.y = Math.max(0, delta.y) }
        connections = connections.concat(context.getters.cardConnections(card.id))
      })
      connections = uniqBy(connections, 'id')
      context.commit('moveCards', { cards, delta })
      context.commit('cardsWereDragged', true, { root: true })
      context.commit('updateConnectionPaths', connections)
      context.commit('broadcast/update', { updates: { cards, delta }, type: 'moveCards' }, { root: true })
      context.commit('broadcast/update', { updates: { connections }, type: 'updateConnectionPaths' }, { root: true })
      connections.forEach(connection => {
        context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
      })
    },
    updateAfterDragWithPositions: (context) => {
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      let cards
      let connections = []
      if (multipleCardsSelectedIds.length) {
        cards = multipleCardsSelectedIds
      } else {
        cards = [currentDraggingCardId]
      }
      cards = cards.map(cardId => context.getters.cardById(cardId))
      cards = cards.filter(card => card)
      cards.forEach(card => {
        const update = { name: 'updateCard',
          body: {
            id: card.id,
            x: card.x,
            y: card.y,
            z: card.z
          }
        }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('undoHistory/add', update, { root: true })
        connections = connections.concat(context.getters.cardConnections(card.id))
      })
      connections = uniqBy(connections, 'id')
      context.commit('updateConnectionPaths', connections)
      context.commit('broadcast/update', { updates: { connections }, type: 'updateConnectionPaths' }, { root: true })
    },
    incrementSelectedCardsZ: (context) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      if (multipleCardsSelectedIds.length) {
        multipleCardsSelectedIds.forEach(cardId => context.dispatch('incrementCardZ', cardId))
      } else {
        context.dispatch('incrementCardZ', currentDraggingCardId)
      }
    },
    showCardDetails: (context, cardId) => {
      context.dispatch('incrementCardZ', cardId)
      context.commit('cardDetailsIsVisibleForCardId', cardId, { root: true })
      context.commit('parentCardId', cardId, { root: true })
      context.commit('loadSpaceShowDetailsForCardId', '', { root: true })
    },
    notifyCollaboratorsCardUpdated: (context, { cardId, type }) => {
      if (context.state.name === 'Hello Kinopio') { return }
      if (notifiedCardAdded.includes(cardId)) { return }
      const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
      if (!userCanEdit) { return }
      const userId = context.rootState.currentUser.id
      let recipientUserIds = context.getters.userIdsToNotify
      recipientUserIds = recipientUserIds.filter(recipientUserId => recipientUserId !== userId)
      recipientUserIds = recipientUserIds.filter(id => Boolean(id))
      if (!recipientUserIds.length) { return }
      const notification = {
        type, // 'createCard' or 'updateCard'
        cardId,
        userId,
        recipientUserIds,
        spaceId: context.state.id
      }
      context.dispatch('api/addToQueue', { name: 'createCardNotifications', body: notification }, { root: true })
      notifiedCardAdded.push(cardId)
    },

    // Comments

    toggleCommentIsVisible: (context, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'toggleCommentIsVisible' })
      const card = context.getters.cardById(cardId)
      const value = !card.commentIsVisible
      context.dispatch('updateCard', {
        id: cardId,
        commentIsVisible: value
      })
    },

    // Connections

    addConnection: (context, { connection, connectionType }) => {
      const connectionAlreadyExists = context.getters.connectionAlreadyExists({
        startCardId: connection.startCardId,
        endCardId: connection.endCardId
      })
      if (!connectionAlreadyExists) {
        connection.id = connection.id || nanoid()
        connection.spaceId = context.state.id
        connection.userId = context.rootState.currentUser.id
        connection.connectionTypeId = connectionType.id
        context.dispatch('api/addToQueue', { name: 'createConnection', body: connection }, { root: true })
        context.commit('undoHistory/add', { name: 'addConnection', body: connection }, { root: true })
        context.commit('broadcast/update', { updates: connection, type: 'addConnection' }, { root: true })
        context.commit('addConnection', connection)
      }
    },
    updateCardConnectionPaths: (context, { cardId, shouldUpdateApi, connections }) => {
      const spaceId = context.state.id
      connections = utils.clone(connections || context.getters.cardConnections(cardId))
      connections.map(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        connection.spaceId = spaceId
        if (shouldUpdateApi) {
          context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
        }
        context.commit('broadcast/update', { updates: connection, type: 'updateConnection' }, { root: true })
        const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
        if (userCanEdit) {
          context.commit('updateConnection', connection)
        } else {
          context.commit('updateConnectionReadOnly', connection)
        }
      })
    },
    updateIncorrectCardConnectionPaths: (context, { shouldUpdateApi }) => {
      if (!context.rootState.webfontIsLoaded) { return }
      const cardIds = context.state.cards.map(card => card.id)
      let connections = []
      context.state.connections.forEach(connection => {
        const startCardExists = cardIds.includes(connection.startCardId)
        const endCardExists = cardIds.includes(connection.endCardId)
        if (!startCardExists || !endCardExists) {
          context.dispatch('removeOrphanConnections', { connection, shouldUpdateApi })
          return
        }
        const updatedPath = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        if (!updatedPath) { return }
        if (updatedPath === connection.path) { return }
        connections.push(connection)
      })
      context.dispatch('updateCardConnectionPaths', { connections, shouldUpdateApi })
    },
    removeOrphanConnections: (context, { connection, shouldUpdateApi }) => {
      if (shouldUpdateApi) {
        context.dispatch('removeConnection', connection)
      } else {
        context.commit('removeConnection', connection)
      }
    },
    removeConnectionsFromCard: (context, card) => {
      context.state.connections.forEach(connection => {
        if (connection.startCardId === card.id || connection.endCardId === card.id) {
          context.dispatch('removeConnection', connection)
        }
      })
    },
    removeSelectedConnectionsFromCard: (context, cardId) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const connections = context.state.connections
      connections.map(connection => {
        const { startCardId, endCardId } = connection
        const startMatch = startCardId === cardId && multipleCardsSelectedIds.includes(endCardId)
        const endMatch = endCardId === cardId && multipleCardsSelectedIds.includes(startCardId)
        const connectedToSelected = startMatch || endMatch
        if (connectedToSelected) {
          context.commit('removeFromMultipleConnectionsSelected', connection.id, { root: true })
          context.dispatch('removeConnection', connection)
        }
      })
    },
    removeConnection: (context, connection) => {
      context.commit('removeConnection', connection)
      const update = { name: 'removeConnection', body: connection }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: connection, type: 'removeConnection' }, { root: true })
      context.commit('undoHistory/add', update, { root: true })
    },
    updateConnectionTypeForConnection: (context, { connectionId, connectionTypeId }) => {
      const updates = { connectionId, connectionTypeId }
      const connection = {
        id: connectionId,
        connectionTypeId
      }
      const update = { name: 'updateConnection', body: connection }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('undoHistory/add', update, { root: true })
      context.commit('updateConnectionTypeForConnection', updates)
      context.commit('broadcast/update', { updates, type: 'updateConnectionTypeForConnection' }, { root: true })
    },
    updateLabelIsVisibleForConnection: (context, { connectionId, labelIsVisible }) => {
      const updates = { connectionId, labelIsVisible }
      const connection = {
        id: connectionId,
        labelIsVisible
      }
      const update = { name: 'updateConnection', body: connection }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('undoHistory/add', update, { root: true })
      context.commit('updateLabelIsVisibleForConnection', updates)
      context.commit('broadcast/update', { updates, type: 'updateLabelIsVisibleForConnection' }, { root: true })
    },

    // Connection Types

    addConnectionType: (context, options) => {
      const types = context.state.connectionTypes
      let connectionType = {
        id: nanoid(),
        name: `Connection Type ${types.length + 1}`,
        color: randomColor({ luminosity: 'light' }),
        spaceId: context.state.id
      }
      if (options) {
        const keys = Object.keys(options)
        keys.forEach(key => {
          connectionType[key] = options[key]
        })
      }
      context.commit('addConnectionType', connectionType)
      context.commit('broadcast/update', { updates: connectionType, type: 'addConnectionType' }, { root: true })
      context.dispatch('api/addToQueue', { name: 'createConnectionType', body: connectionType }, { root: true })
      context.commit('undoHistory/add', { name: 'addConnectionType', body: connectionType }, { root: true })
    },
    updateConnectionType: (context, connectionType) => {
      context.commit('updateConnectionType', connectionType)
      context.commit('broadcast/update', { updates: connectionType, type: 'updateConnectionType' }, { root: true })
      const update = { name: 'updateConnectionType', body: connectionType }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('undoHistory/add', update, { root: true })
    },
    removeUnusedConnectionTypes: (context) => {
      const connectionTypes = context.state.connectionTypes
      const connections = context.state.connections
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const removeConnectionTypes = connectionTypes.filter(type => !connectionTypeIds.includes(type.id))
      removeConnectionTypes.forEach(type => {
        const update = { name: 'removeConnectionType', body: type }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('undoHistory/add', update, { root: true })
        context.commit('removeConnectionType', type)
        context.commit('broadcast/update', { updates: type, type: 'removeConnectionType' }, { root: true })
      })
    },

    // Background

    loadBackground: (context) => {
      const element = document.querySelector('.app')
      if (!element) { return }
      const background = context.state.background
      if (utils.urlIsImage(background)) {
        element.style.backgroundImage = `url(${background})`
      } else {
        element.style.backgroundImage = ''
      }
      context.dispatch('updateBackgroundZoom')
    },
    updateBackgroundZoom: async (context) => {
      const element = document.querySelector('.app')
      if (!element) { return }
      const defaultBackground = {
        width: 310,
        height: 200
      }
      const spaceZoomDecimal = context.rootGetters.spaceZoomDecimal
      let backgroundImage = element.style.backgroundImage
      backgroundImage = utils.urlFromCSSBackgroundImage(backgroundImage)
      let image = new Image()
      let width, height
      if (backgroundImage) {
        image.src = backgroundImage
        width = image.width
        height = image.height
      } else {
        width = defaultBackground.width
        height = defaultBackground.height
      }
      width = width * spaceZoomDecimal
      height = height * spaceZoomDecimal
      if (width === 0 || height === 0) {
        element.style.backgroundSize = 'initial'
        return
      }
      element.style.backgroundSize = `${width}px ${height}px`
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
      context.commit('undoHistory/add', update, { root: true })
      context.commit('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
    },
    removeTag: (context, tag) => {
      context.commit('removeTag', tag)
      const update = { name: 'removeTag', body: tag }
      const broadcastUpdate = { updates: tag, type: 'removeTag' }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('undoHistory/add', update, { root: true })
      context.commit('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
    },
    removeTags: (context, tag) => {
      context.commit('removeTags', tag)
      const update = { name: 'removeTags', body: tag }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('undoHistory/add', update, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
    },
    updateTagNameColor: (context, tag) => {
      context.commit('updateTagNameColor', tag)
      const update = { name: 'updateTagNameColor', body: tag }
      const broadcastUpdate = { updates: tag, type: 'updateTagNameColor' }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('undoHistory/add', update, { root: true })
      context.commit('broadcast/update', broadcastUpdate, { root: true })
      context.commit('remoteTagsIsFetched', false, { root: true })
    },
    removeUnusedTagsFromCard: (context, cardId) => {
      const card = context.getters.cardById(cardId)
      if (!card) { return }
      const cardTagNames = utils.tagsFromStringWithoutBrackets(card.name) || []
      const tagsInCard = context.getters.tagsInCard({ id: cardId })
      const tagsToRemove = tagsInCard.filter(tag => !cardTagNames.includes(tag.name))
      tagsToRemove.forEach(tag => context.dispatch('removeTag', tag))
    }
  },

  getters: {
    // Meta
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

    // Cards
    cardById: (state) => (id) => {
      return state.cards.find(card => card.id === id)
    },
    cardsWithSpaceLinks: (state) => {
      let cards = state.cards
      let links = cards.filter(card => utils.idIsValid(card.linkToSpaceId))
      return links
    },
    cardsWithTagName: (state, getters) => (tagName) => {
      let cards = state.cards
      return cards.filter(card => {
        const tags = utils.tagsFromStringWithoutBrackets(card.name)
        if (tags) {
          return tags.includes(tagName)
        }
      })
    },

    // Tags
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
    spaceTags: (state, getters) => (card) => {
      let tags = state.tags
      tags = uniqBy(tags, 'name')
      tags.reverse()
      return tags
    },

    // Connections
    connectionAlreadyExists: (state) => ({ startCardId, endCardId }) => {
      const existing = state.connections.filter(connection => {
        let start = connection.startCardId === startCardId
        let end = connection.endCardId === endCardId
        return start && end
      })
      return Boolean(existing.length)
    },
    cardConnections: (state) => (cardId) => {
      return state.connections.filter(connection => {
        let start = connection.startCardId === cardId
        let end = connection.endCardId === cardId
        return start || end
      })
    },
    connectionById: (state) => (id) => {
      return state.connections.find(connection => connection.id === id)
    },

    // Connection Types
    connectionTypeById: (state) => (id) => {
      return state.connectionTypes.find(type => type.id === id)
    },
    lastConnectionType: (state) => {
      return last(state.connectionTypes)
    },
    cardConnectionTypes: (state, getters) => (cardId) => {
      const connections = getters.cardConnections(cardId)
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      return state.connectionTypes.filter(type => {
        return connectionTypeIds.includes(type.id)
      })
    },
    connectionTypeForNewConnections: (state, getters, rootState) => {
      const lastConnectionType = getters.lastConnectionType
      return lastConnectionType
    },

    // Users
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
    },
    userIdsToNotify: (state, getters, rootState, rootGetters) => {
      let clients = state.clients.map(client => client.id)
      let members = getters.members(true)
      let contributors = [] // for open spaces
      members = members.map(member => member.id)
      contributors = state.cards.map(card => card.userId)
      let userIds = members.concat(contributors)
      userIds = uniq(userIds)
      // exclude currently connected userIds
      userIds = userIds.filter(userId => !clients.includes(userId))
      return userIds
    }
  }
}
