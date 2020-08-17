import Vue from 'vue'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import random from 'lodash-es/random'
import last from 'lodash-es/last'

import utils from '@/utils.js'
import cache from '@/cache.js'
import words from '@/words.js'

import helloSpace from '@/spaces/hello.json'
import newSpace from '@/spaces/new.json'

export default {
  namespaced: true,
  state: helloSpace,
  mutations: {

    restoreSpace: (state, space) => {
      space = utils.removeRemovedCardsFromSpace(space)
      Object.assign(state, space)
    },
    // Added aug 2019, can safely remove this in aug 2020
    updateBetaSpace: (state) => {
      if (state.id === '1') {
        const newId = nanoid()
        state.id = newId
        state.name = 'Hello Kinopio'
        cache.updateBetaSpaceId(newId)
        cache.updateSpace('name', state.name, state.id)
      }
    },

    // Users

    addUserToSpace: (state, newUser) => {
      utils.typeCheck(newUser, 'object')
      const userExists = state.users.find(user => user.id === newUser.id)
      if (userExists) { return }
      state.users.push(newUser)
      cache.updateSpace('users', state.users, state.id)
    },
    addCollaboratorToSpace: (state, newUser) => {
      utils.typeCheck(newUser, 'object')
      const collaboratorExists = state.collaborators.find(collaborator => collaborator.id === newUser.id)
      if (collaboratorExists) { return }
      state.collaborators.push(newUser)
      const space = utils.clone(state)
      cache.saveSpace(space)
      cache.updateSpace('collaborators', space.collaborators, space.id)
    },
    addSpectatorToSpace: (state, update) => {
      utils.typeCheck(update, 'object')
      const newUser = update.user || update
      const userExists = state.users.find(user => user.id === newUser.id)
      const collaboratorExists = state.collaborators.find(collaborator => collaborator.id === newUser.id)
      const spectatorExists = state.spectators.find(spectator => spectator.id === newUser.id)
      if (userExists || collaboratorExists || spectatorExists) { return }
      state.spectators.push(newUser)
    },
    removeSpectatorFromSpace: (state, oldUser) => {
      utils.typeCheck(oldUser, 'object')
      if (!state.spectators) { return }
      state.spectators = state.spectators.filter(user => {
        return user.id !== oldUser.id
      })
    },
    removeUserFromSpace: (state, oldUser) => {
      utils.typeCheck(oldUser, 'object')
      state.users = state.users.filter(user => {
        return user.id !== oldUser.id
      })
      cache.updateSpace('users', state.users, state.id)
    },
    removeCollaboratorFromSpace: (state, oldUser) => {
      utils.typeCheck(oldUser, 'object')
      state.collaborators = state.collaborators.filter(user => {
        return user.id !== oldUser.id
      })
      const updatedSpace = utils.clone(state)
      // same as updateSpace() to force reactivity
      const updates = Object.keys(updatedSpace)
      updates.forEach(key => {
        Vue.set(state, key, updatedSpace[key])
        cache.updateSpace(key, state[key], state.id)
      })
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
        Vue.set(state, key, updatedSpace[key])
        cache.updateSpace(key, state[key], state.id)
      })
    },

    // Cards

    incrementCardZ: (state, cardId) => {
      state.cards.map((card, index) => {
        card.z = index
        if (card.id === cardId) {
          card.z = state.cards.length + 1
        }
      })
      cache.updateSpace('cards', state.cards, state.id)
    },
    updateCard: (state, updatedCard) => {
      state.cards.map(card => {
        if (card.id === updatedCard.id) {
          const updates = Object.keys(updatedCard)
          updates.forEach(key => {
            Vue.set(card, key, updatedCard[key])
          })
        }
      })
      cache.updateSpace('cards', state.cards, state.id)
    },
    moveCard: (state, { cardId, delta }) => {
      const maxOffset = 0
      state.cards.map(card => {
        if (card.id === cardId) {
          card.x += delta.x || 0
          card.y += delta.y || 0
          card.x = Math.max(card.x, maxOffset)
          card.y = Math.max(card.y, maxOffset)
        }
      })
      cache.updateSpace('cards', state.cards, state.id)
    },
    createCard: (state, card) => {
      state.cards.push(card)
      cache.updateSpace('cards', state.cards, state.id)
    },
    removeCard: (state, cardToRemove) => {
      if (!state.removedCards) {
        // migration oct 2019
        Vue.set(state, 'removedCards', [])
      }
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
      state.connections.map(connection => {
        if (connection.id === updatedConnection.id) {
          const updates = Object.keys(updatedConnection)
          updates.forEach(key => {
            // update properties differently depending on whether it's existing or new
            if (connection[key]) {
              connection[key] = updatedConnection[key]
            } else {
              Vue.set(connection, key, updatedConnection[key])
            }
          })
        }
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
          // update properties differently depending on whether it's existing or new
          if (connection.labelIsVisible) {
            connection.labelIsVisible = labelIsVisible
          } else {
            Vue.set(connection, 'labelIsVisible', labelIsVisible)
          }
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
    }
  },

  actions: {
    init: (context) => {
      const spaceUrl = context.rootState.spaceUrlToLoad
      const user = context.rootState.currentUser
      // restore from url
      if (spaceUrl) {
        console.log('🚃 Restore space from url', spaceUrl)
        const spaceId = utils.idFromUrl(spaceUrl)
        context.dispatch('loadSpace', { id: spaceId })
      // restore last space
      } else if (user.lastSpaceId) {
        console.log('🚃 Restore last space', user.lastSpaceId)
        context.dispatch('loadLastSpace')
      // hello kinopio
      } else {
        console.log('🚃 Create new Hello Kinopio space')
        context.dispatch('createNewHelloSpace')
        context.dispatch('updateUserLastSpaceId')
      }
    },

    // Users

    addUserToJoinedSpace: (context, newUser) => {
      if (newUser.isCollaborator) {
        context.commit('addCollaboratorToSpace', newUser)
        context.commit('removeSpectatorFromSpace', newUser)
      } else {
        context.commit('addSpectatorToSpace', newUser)
      }
    },

    // Space

    createNewHelloSpace: (context) => {
      const user = context.rootState.currentUser
      let space = utils.clone(helloSpace)
      space.id = nanoid()
      space = cache.updateIdsInSpace(space)
      context.commit('restoreSpace', space)
      context.commit('addUserToSpace', user)
    },
    createNewSpace: (context) => {
      let space = utils.clone(newSpace)
      space.name = words.randomUniqueName()
      space.id = nanoid()
      space.connectionTypes[0].color = randomColor({ luminosity: 'light' })
      space.cards[1].x = random(180, 200)
      space.cards[1].y = random(160, 180)
      space.userId = context.rootState.currentUser.id
      const uniqueNewSpace = cache.updateIdsInSpace(space)
      context.commit('restoreSpace', uniqueNewSpace)
    },
    saveNewSpace: (context) => {
      const space = utils.clone(context.state)
      const user = context.rootState.currentUser
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      cache.saveSpace(space)
      context.dispatch('api/addToQueue', {
        name: 'createSpace',
        body: space
      }, { root: true })
      utils.updateWindowUrlAndTitle({ space, currentUserIsSignedIn })
      context.commit('addUserToSpace', user)
    },
    duplicateSpace: (context) => {
      let space = utils.clone(context.state)
      space.id = nanoid()
      space.users = []
      space.collaborators = []
      space.showInExplore = false
      const uniqueNewSpace = cache.updateIdsInSpace(space)
      context.commit('restoreSpace', uniqueNewSpace)
      Vue.nextTick(() => {
        context.dispatch('updateUserLastSpaceId')
        context.dispatch('saveNewSpace')
        context.commit('notifyNewUser', false, { root: true })
      })
    },
    addSpace: (context) => {
      context.dispatch('createNewSpace')
      Vue.nextTick(() => {
        context.dispatch('updateCardConnectionPaths', { cardId: context.state.cards[1].id, connections: context.state.connections })
        context.dispatch('saveNewSpace')
        context.dispatch('updateUserLastSpaceId')
        context.commit('notifyNewUser', false, { root: true })
        context.commit('notifySignUpToEditSpace', false, { root: true })
      })
    },
    getRemoteSpace: async (context, space) => {
      const collaboratorKey = context.rootState.spaceCollaboratorKeys.find(key => key.spaceId === space.id)
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      const currentSpaceHasUrl = utils.currentSpaceHasUrl(space)
      let remoteSpace
      try {
        context.commit('isLoadingSpace', true, { root: true })
        if (currentUserIsSignedIn) {
          remoteSpace = await context.dispatch('api/getSpace', space, { root: true })
        } else if (collaboratorKey) {
          space.collaboratorKey = collaboratorKey
          remoteSpace = await context.dispatch('api/getSpaceAnonymously', space, { root: true })
          cache.saveInvitedSpace(remoteSpace)
          context.commit('collaboratorKey', '', { root: true })
        } else if (currentSpaceHasUrl) {
          remoteSpace = await context.dispatch('api/getSpaceAnonymously', space, { root: true })
        }
      } catch (error) {
        console.error(error)
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
      context.commit('isLoadingSpace', false, { root: true })
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
        context.commit('notifySpaceIsOpenAndEditable', true, { root: true })
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
        const emptySpace = { id: space.id, cards: [], connections: [], users: [], collaborators: [], spectators: [] }
        context.commit('restoreSpace', emptySpace)
      }
    },
    updateSpacePageSize: (context) => {
      Vue.nextTick(() => {
        context.dispatch('updateSpacePageSize', null, { root: true })
      })
    },
    removeEmptyCards: (context) => {
      let cards = context.state.cards
      cards.forEach(card => {
        if (!card.name) {
          context.dispatch('removeCardPermanent', card)
        }
      })
    },
    loadSpace: async (context, space) => {
      const emptySpace = { id: space.id, cards: [], connections: [], spectators: [] }
      const cachedSpace = cache.space(space.id)
      context.commit('clearAllNotifications', null, { root: true })
      context.commit('clearAllFilters', null, { root: true })
      // restore local
      context.commit('restoreSpace', emptySpace)
      context.commit('restoreSpace', utils.normalizeSpace(cachedSpace))
      context.dispatch('updateSpacePageSize')
      context.dispatch('loadBackground', context.state.background)
      context.commit('history/clear', null, { root: true })
      // restore remote
      const remoteSpace = await context.dispatch('getRemoteSpace', space)
      if (remoteSpace) {
        context.commit('restoreSpace', utils.normalizeSpace(remoteSpace))
        context.dispatch('history/playback', null, { root: true })
        context.dispatch('checkIfShouldNotifySignUpToEditSpace', remoteSpace)
        utils.updateWindowUrlAndTitle({
          space: remoteSpace,
          shouldUpdateUrl: true
        })
        context.commit('broadcast/joinSpaceRoom', null, { root: true })
        if (!space.isRemoved && remoteSpace.isRemoved) {
          context.commit('notifySpaceIsRemoved', false, { root: true })
        } else {
          context.dispatch('checkIfShouldNotifySpaceIsRemoved', remoteSpace)
        }
        if (cache.getAllSpaces().length) {
          context.commit('notifyNewUser', false, { root: true })
        } else {
          context.commit('notifyNewUser', true, { root: true })
        }
      } else {
        utils.updateWindowUrlAndTitle({
          space,
          shouldUpdateUrl: false
        })
      }
      context.commit('spaceUrlToLoad', '', { root: true })
      context.dispatch('updateSpacePageSize')
      context.dispatch('loadBackground', context.state.background)
      context.dispatch('removeEmptyCards')
    },
    loadLastSpace: (context) => {
      const user = context.rootState.currentUser
      let spaceToRestore = cache.space(user.lastSpaceId)
      if (!spaceToRestore.id) {
        spaceToRestore = { id: user.lastSpaceId }
      }
      context.dispatch('loadSpace', spaceToRestore)
      context.dispatch('updateUserLastSpaceId')
    },
    updateSpace: async (context, updates) => {
      const space = utils.clone(context.state)
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      updates.id = space.id
      if (updates.name) {
        const updatedSpace = utils.clone(space)
        updatedSpace.name = updates.name
        utils.updateWindowUrlAndTitle({
          space: updatedSpace,
          currentUserIsSignedIn
        })
      }
      context.commit('updateSpace', updates)
      context.commit('broadcast/update', { updates, type: 'updateSpace' }, { root: true })
      context.dispatch('api/addToQueue', {
        name: 'updateSpace',
        body: updates
      }, { root: true })
    },
    changeSpace: async (context, { space, isRemote }) => {
      if (isRemote) {
        utils.updateWindowUrlAndTitle({
          space: space,
          shouldUpdateUrl: true
        })
      }
      const user = context.rootState.currentUser
      context.commit('broadcast/update', { user, type: 'userLeftRoom' }, { root: true })
      space = utils.clone(space)
      space = utils.migrationEnsureRemovedCards(space)
      await context.dispatch('loadSpace', space)
      const canEdit = context.rootGetters['currentUser/canEditSpace']()
      if (!canEdit) { return }
      context.dispatch('api/addToQueue', {
        name: 'updateSpace',
        body: { id: space.id, updatedAt: new Date() }
      }, { root: true })
      context.commit('parentCardId', '', { root: true })
      context.dispatch('updateUserLastSpaceId')
    },
    updateUserLastSpaceId: (context) => {
      const space = context.state
      const canEdit = context.rootGetters['currentUser/canEditSpace']()
      if (space.isRemoved || !canEdit) { return }
      context.dispatch('currentUser/lastSpaceId', space.id, { root: true })
    },
    removeCurrentSpace: (context) => {
      const space = utils.clone(context.state)
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
    checkIfShouldnotifyCardsCreatedIsNearLimit: (context) => {
      const currentUser = context.rootState.currentUser
      if (currentUser.isUpgraded) { return }
      const cardsCreatedLimit = 150
      const value = cardsCreatedLimit - currentUser.cardsCreatedCount
      if (utils.isBetween({ value, min: 0, max: 15 })) {
        context.commit('notifyCardsCreatedIsNearLimit', true, { root: true })
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

    // Cards

    addCard: (context, { position, isParentCard, name, id }) => {
      utils.typeCheck(position, 'object')
      if (context.rootGetters['currentUser/cardsCreatedIsOverLimit']) {
        context.commit('notifyCardsCreatedIsOverLimit', true, { root: true })
        context.commit('notifyCardsCreatedIsNearLimit', false, { root: true })
        return
      }
      let cards = context.state.cards
      let card = {
        id: id || nanoid(),
        x: position.x,
        y: position.y,
        z: cards.length + 1,
        name: name || '',
        frameId: 0,
        userId: context.rootState.currentUser.id
      }
      context.commit('cardDetailsIsVisibleForCardId', card.id, { root: true })
      context.commit('createCard', card)
      card.spaceId = context.state.id
      card = utils.clone(card)
      const update = { name: 'createCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'createCard' }, { root: true })
      context.commit('history/add', update, { root: true })
      if (isParentCard) { context.commit('parentCardId', card.id, { root: true }) }
      context.dispatch('currentUser/cardsCreatedCount', { shouldIncrement: true }, { root: true })
      context.dispatch('checkIfShouldnotifyCardsCreatedIsNearLimit')
    },
    addMultipleCards: (context, newCards) => {
      newCards.forEach(card => {
        card = {
          id: nanoid(),
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
        context.commit('history/add', update, { root: true })
      })
    },
    // shim for history/playback
    createCard: (context, card) => {
      context.commit('createCard', card)
    },
    pasteCard: (context, card) => {
      utils.typeCheck(card, 'object')
      card = utils.clone(card)
      card.id = nanoid()
      card.spaceId = context.state.id
      const existingCards = context.rootState.currentSpace.cards
      utils.uniqueCardPosition(card, existingCards)
      context.commit('createCard', card)
      const update = { name: 'createCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'createCard' }, { root: true })
      context.commit('history/add', update, { root: true })
      context.dispatch('currentUser/cardsCreatedCount', { shouldIncrement: true }, { root: true })
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
      context.commit('updateCard', card)
      const update = { name: 'updateCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'updateCard' }, { root: true })
      context.commit('history/add', update, { root: true })
    },
    toggleCardChecked (context, { cardId, value }) {
      utils.typeCheck(value, 'boolean')
      utils.typeCheck(cardId, 'string')
      const card = context.getters.cardById(cardId)
      let name = card.name
      const checkbox = utils.checkboxFromString(name)
      name = name.replace(checkbox, '')
      if (value) {
        name = `[x] ${name}`
      } else {
        name = `[] ${name}`
      }
      context.dispatch('updateCard', { id: cardId, name })
    },
    incrementCardZ: (context, cardId) => {
      let cards = context.rootState.currentSpace.cards
      cards = cards.map((card, index) => {
        card = utils.clone(card)
        card.z = index
        if (card.id === cardId) {
          card.z = cards.length + 1
          const update = { name: 'updateCard', body: { id: card.id, z: card.z } }
          context.dispatch('api/addToQueue', update, { root: true })
          context.commit('broadcast/update', { updates: update.body, type: 'updateCard' }, { root: true })
        }
      })
      context.commit('incrementCardZ', cardId)
    },
    removeCard: (context, card) => {
      const cardHasContent = Boolean(card.name)
      if (cardHasContent) {
        context.commit('removeCard', card)
        const update = { name: 'removeCard', body: card }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('history/add', update, { root: true })
      } else {
        context.dispatch('removeCardPermanent', card)
      }
      context.commit('broadcast/update', { updates: card, type: 'removeCard' }, { root: true })
      context.dispatch('removeConnectionsFromCard', card)
      context.commit('triggerUpdatePositionInVisualViewport', null, { root: true })
      context.dispatch('currentUser/cardsCreatedCount', { shouldIncrement: false }, { root: true })
      if (!context.rootGetters['currentUser/cardsCreatedIsOverLimit']) {
        context.commit('notifyCardsCreatedIsOverLimit', false, { root: true })
      }
    },
    removeCardPermanent: (context, card) => {
      context.commit('removeCardPermanent', card)
      context.dispatch('api/addToQueue', { name: 'removeCardPermanent', body: card }, { root: true })
    },
    removeAllRemovedCardsPermanent: (context) => {
      context.commit('removeAllRemovedCardsPermanent')
      context.dispatch('api/addToQueue', { name: 'removeAllRemovedCardsPermanentFromSpace', body: {} }, { root: true })
    },
    restoreRemovedCard: (context, card) => {
      context.commit('restoreRemovedCard', card)
      const update = { name: 'restoreRemovedCard', body: card }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: card, type: 'restoreRemovedCard' }, { root: true })
      context.commit('history/add', update, { root: true })
    },
    restoreRemovedSpace: (context, space) => {
      cache.restoreRemovedSpace(space)
      context.dispatch('api/addToQueue', { name: 'restoreRemovedSpace',
        body: {
          id: space.id
        } }, { root: true })
      space.isRemoved = false
      context.dispatch('changeSpace', { space })
    },
    dragCards: (context, options) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const { delta, endCursor, prevCursor } = options
      options.delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      if (multipleCardsSelectedIds.length) {
        context.dispatch('dragMultipleCards', options)
      } else {
        context.dispatch('dragSingleCard', options)
      }
    },
    dragMultipleCards: (context, { endCursor, prevCursor, delta }) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const cards = context.rootState.currentSpace.cards.filter(card => multipleCardsSelectedIds.includes(card.id))
      cards.forEach(card => {
        const update = { cardId: card.id, delta }
        context.commit('moveCard', update)
        context.commit('broadcast/update', { updates: update, type: 'moveCard' }, { root: true })
        context.dispatch('updateCardConnectionPaths', { cardId: card.id })
      })
    },
    dragSingleCard: (context, { endCursor, delta, shouldUpdateApi }) => {
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const update = { cardId: currentDraggingCardId, delta }
      context.commit('moveCard', update)
      context.commit('broadcast/update', { updates: update, type: 'moveCard' }, { root: true })
      context.dispatch('updateCardConnectionPaths', { cardId: currentDraggingCardId })
    },
    updateAfterDragWithPositions: (context) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      let cards = []
      if (multipleCardsSelectedIds.length) {
        cards = context.rootState.currentSpace.cards.filter(card => multipleCardsSelectedIds.includes(card.id))
      } else {
        const card = context.rootState.currentSpace.cards.find(card => currentDraggingCardId === card.id)
        if (!card) { return }
        cards.push(card)
      }
      cards.forEach(card => {
        card = utils.clone(card)
        const update = { name: 'updateCard',
          body: {
            id: card.id,
            x: card.x,
            y: card.y,
            z: card.z
          }
        }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('history/add', update, { root: true })
        context.dispatch('updateCardConnectionPaths', { cardId: card.id, shouldUpdateApi: true })
      })
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
        context.commit('history/add', { name: 'addConnection', body: connection }, { root: true })
        context.commit('broadcast/update', { updates: connection, type: 'addConnection' }, { root: true })
        context.commit('addConnection', connection)
      }
    },
    updateCardConnectionPaths: (context, { cardId, shouldUpdateApi, connections }) => {
      const spaceId = context.state.id
      connections = utils.clone(connections || context.getters.cardConnections(cardId) || context.rootState.currentConnectionsDragging)
      connections.map(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        connection.spaceId = spaceId
        if (shouldUpdateApi) {
          context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
        }
        context.commit('broadcast/update', { updates: connection, type: 'updateConnection' }, { root: true })
        context.commit('updateConnection', connection)
      })
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
      context.commit('history/add', update, { root: true })
    },
    updateConnectionTypeForConnection: (context, { connectionId, connectionTypeId }) => {
      const updates = { connectionId, connectionTypeId }
      const connection = {
        id: connectionId,
        connectionTypeId
      }
      const update = { name: 'updateConnection', body: connection }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('history/add', update, { root: true })
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
      context.commit('history/add', update, { root: true })
      context.commit('updateLabelIsVisibleForConnection', updates)
      context.commit('broadcast/update', { updates, type: 'updateLabelIsVisibleForConnection' }, { root: true })
    },

    // Connection Types

    addConnectionType: (context) => {
      const types = context.state.connectionTypes
      const connectionType = {
        id: nanoid(),
        name: `Connection ${types.length + 1}`,
        color: randomColor({ luminosity: 'light' }),
        spaceId: context.state.id
      }
      context.commit('addConnectionType', connectionType)
      context.commit('broadcast/update', { updates: connectionType, type: 'addConnectionType' }, { root: true })
      context.dispatch('api/addToQueue', { name: 'createConnectionType', body: connectionType }, { root: true })
      context.commit('history/add', { name: 'addConnectionType', body: connectionType }, { root: true })
    },
    updateConnectionType: (context, connectionType) => {
      context.commit('updateConnectionType', connectionType)
      context.commit('broadcast/update', { updates: connectionType, type: 'updateConnectionType' }, { root: true })
      const update = { name: 'updateConnectionType', body: connectionType }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('history/add', update, { root: true })
    },
    removeUnusedConnectionTypes: (context) => {
      const connectionTypes = context.state.connectionTypes
      const connections = context.state.connections
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const removeConnectionTypes = connectionTypes.filter(type => !connectionTypeIds.includes(type.id))
      removeConnectionTypes.forEach(type => {
        const update = { name: 'removeConnectionType', body: type }
        context.dispatch('api/addToQueue', update, { root: true })
        context.commit('history/add', update, { root: true })
        context.commit('removeConnectionType', type)
        context.commit('broadcast/update', { updates: type, type: 'removeConnectionType' }, { root: true })
      })
    },

    // background

    loadBackground: (context, background) => {
      const currentBackground = utils.urlFromString(document.body.style.backgroundImage)
      if (background === currentBackground) { return }
      if (utils.urlIsImage(background)) {
        utils.updateBackground(background)
      } else {
        document.body.style.backgroundImage = ''
      }
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
      const total = users + collaborators + spectators
      return Boolean(total > 1)
    },

    // Cards
    cardById: (state) => (id) => {
      return state.cards.find(card => card.id === id)
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
      const typePref = rootState.currentUser.defaultConnectionTypeId
      const defaultType = getters.connectionTypeById(typePref)
      if (defaultType) {
        return defaultType
      } else {
        const lastConnectionType = getters.lastConnectionType
        return lastConnectionType
      }
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
    }
  }
}
