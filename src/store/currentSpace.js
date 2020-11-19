import helloSpace from '@/data/hello.json'
import newSpace from '@/data/new.json'

import words from '@/data/words.js'
import moonphase from '@/moonphase.js'
import utils from '@/utils.js'
import cache from '@/cache.js'

import Vue from 'vue'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import random from 'lodash-es/random'
import last from 'lodash-es/last'
import uniqBy from 'lodash-es/uniqBy'
import dayjs from 'dayjs'

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
    addSpectatorToSpace: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addSpectatorToSpace' })
      const newUser = update.user || update
      const userExists = state.users.find(user => user.id === newUser.id)
      const collaboratorExists = state.collaborators.find(collaborator => collaborator.id === newUser.id)
      const spectatorExists = state.spectators.find(spectator => spectator.id === newUser.id)
      if (userExists || collaboratorExists || spectatorExists) {
        state.clients.push(newUser)
        state.clients = uniqBy(state.clients, 'id')
      } else {
        state.spectators.push(newUser)
      }
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
    init: (context) => {
      const spaceUrl = context.rootState.spaceUrlToLoad
      const loadJournalSpace = context.rootState.loadJournalSpace
      const user = context.rootState.currentUser
      // restore from url
      if (spaceUrl) {
        console.log('🚃 Restore space from url', spaceUrl)
        const spaceId = utils.idFromUrl(spaceUrl)
        const space = { id: spaceId }
        context.dispatch('loadSpace', { space })
      // restore or create journal space
      } else if (loadJournalSpace) {
        console.log('🚃 Restore journal space')
        context.dispatch('loadJournalSpace')
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
      const nullCardUsers = true
      let space = utils.clone(helloSpace)
      space.id = nanoid()
      space = cache.updateIdsInSpace(space, nullCardUsers)
      context.commit('restoreSpace', space)
      context.commit('addUserToSpace', user)
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
        space.cards[1].y = random(160, 180)
      }
      space.userId = context.rootState.currentUser.id
      const nullCardUsers = true
      const uniqueNewSpace = cache.updateIdsInSpace(space, nullCardUsers)
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
      space.originSpaceId = space.id
      space.id = nanoid()
      space.name = space.name + ' copy'
      space.users = []
      space.collaborators = []
      space.showInExplore = false
      space.privacy = 'private'
      const nullCardUsers = true
      const uniqueNewSpace = cache.updateIdsInSpace(space, nullCardUsers)
      context.commit('restoreSpace', uniqueNewSpace)
      Vue.nextTick(() => {
        context.dispatch('updateUserLastSpaceId')
        context.dispatch('saveNewSpace')
        context.commit('notifyNewUser', false, { root: true })
        context.commit('triggerFocusSpaceDetailsName', null, { root: true })
      })
    },
    addSpace: (context) => {
      const user = context.rootState.currentUser
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      context.dispatch('createNewSpace')
      const cards = context.state.cards
      Vue.nextTick(() => {
        if (cards.length) {
          context.dispatch('updateCardConnectionPaths', { cardId: cards[1].id, connections: context.state.connections })
        }
        context.dispatch('saveNewSpace')
        context.dispatch('updateUserLastSpaceId')
        context.commit('notifyNewUser', false, { root: true })
        context.commit('notifySignUpToEditSpace', false, { root: true })
      })
    },
    addNewJournalSpace: (context) => {
      const moonPhase = moonphase()
      const day = `${moonPhase.emoji} ${dayjs(new Date()).format('dddd')}` // 🌘 Tuesday
      const spaceId = nanoid()
      let space = utils.emptySpace(spaceId)
      space.name = utils.journalSpaceName()
      space.privacy = 'private'
      space.moonPhase = moonPhase.name
      space.removedCards = []
      space.cards.push({ id: nanoid(), name: day, x: 60, y: 90, frameId: 0 })
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
      context.commit('restoreSpace', space)
      context.dispatch('saveNewSpace')
      context.dispatch('currentUser/lastSpaceId', space.id, { root: true })
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
        context.dispatch('checkIfShouldNotifyNewUser')
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
        const emptySpace = utils.emptySpace(space.id)
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
          context.dispatch('removeCard', card)
        }
      })
    },
    loadJournalSpace: async (context) => {
      const spaces = cache.getAllSpaces()
      const journalName = utils.journalSpaceName()
      const journalSpace = spaces.find(space => space.name === journalName)
      context.commit('loadJournalSpace', false, { root: true })
      if (journalSpace) {
        const space = { id: journalSpace.id }
        context.dispatch('loadSpace', { space })
      } else {
        context.dispatch('addNewJournalSpace')
      }
    },

    loadSpace: async (context, { space }) => {
      const emptySpace = utils.emptySpace(space.id)
      const cachedSpace = cache.space(space.id)
      context.commit('clearAllNotifications', null, { root: true })
      context.commit('clearSpaceFilters', null, { root: true })
      // restore local space
      context.commit('restoreSpace', emptySpace)
      context.commit('restoreSpace', utils.normalizeSpace(cachedSpace))
      context.dispatch('updateSpacePageSize')
      context.dispatch('loadBackground', context.state.background)
      context.commit('history/clear', null, { root: true })
      const remoteSpace = await context.dispatch('getRemoteSpace', space)
      if (remoteSpace) {
        // restore remote space
        context.commit('restoreSpace', utils.normalizeSpace(remoteSpace))
        context.dispatch('history/playback', null, { root: true })
        context.dispatch('checkIfShouldNotifySignUpToEditSpace', remoteSpace)
        utils.updateWindowUrlAndTitle({
          space: remoteSpace,
          shouldUpdateUrl: true
        })
        context.commit('broadcast/joinSpaceRoom', null, { root: true })
        context.dispatch('checkIfShouldNotifySpaceIsRemoved', remoteSpace)
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
      context.commit('broadcast/leaveSpaceRoom', { user, type: 'userLeftRoom' }, { root: true })
      space = utils.clone(space)
      space = utils.migrationEnsureRemovedCards(space)
      await context.dispatch('loadSpace', { space })
      const canEdit = context.rootGetters['currentUser/canEditSpace']()
      if (!canEdit) { return }
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
    incrementCardsCreatedCountFromSpace (context, space) {
      const user = context.rootState.currentUser
      const incrementCardsCreatedCountBy = space.cards.filter(card => {
        return card.userId === user.id
      }).length
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: incrementCardsCreatedCountBy,
        shouldIncrement: true
      }, { root: true })
    },
    decrementCardsCreatedCountFromSpace (context, space) {
      const user = context.rootState.currentUser
      const decrementCardsCreatedCountBy = space.cards.filter(card => {
        return card.userId === user.id
      }).length
      context.dispatch('currentUser/cardsCreatedCountUpdateBy', {
        delta: decrementCardsCreatedCountBy
      }, { root: true })
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
    checkIfShouldNotifyNewUser: (context) => {
      const noUserSpaces = !cache.getAllSpaces().length
      if (noUserSpaces) {
        context.commit('notifyNewUser', true, { root: true })
      }
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
      utils.typeCheck({ value: position, type: 'object', origin: 'addCard' })
      if (context.rootGetters['currentUser/cardsCreatedIsOverLimit']) {
        context.commit('notifyCardsCreatedIsOverLimit', true, { root: true })
        context.commit('notifyCardsCreatedIsNearLimit', false, { root: true })
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
        context.commit('history/add', update, { root: true })
      })
    },
    // shim for history/playback
    createCard: (context, card) => {
      context.commit('createCard', card)
    },
    pasteCard: (context, card) => {
      utils.typeCheck({ value: card, type: 'object', origin: 'pasteCard' })
      card = utils.clone(card)
      card.id = nanoid()
      card.spaceId = context.state.id
      const existingCards = context.rootState.currentSpace.cards
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
      utils.typeCheck({ value, type: 'boolean', origin: 'toggleCardChecked' })
      utils.typeCheck({ value: cardId, type: 'string', origin: 'toggleCardChecked' })
      const currentUserId = context.rootState.currentUser.id
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
        nameUpdatedAt: new Date(),
        nameUpdatedByUserId: currentUserId
      })
    },
    clearAllCardsZ: (context) => {
      let cards = context.rootState.currentSpace.cards
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
      let cards = context.rootState.currentSpace.cards
      let highestCardZ = utils.highestCardZ(cards)
      if (highestCardZ > maxInt) {
        context.dispatch('clearAllCardsZ')
        highestCardZ = 1
      }
      const body = { id: cardId, z: highestCardZ + 1 }
      const update = { name: 'updateCard', body }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('broadcast/update', { updates: body, type: 'updateCard' }, { root: true })
      context.commit('updateCard', body)
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
      const cardIsUpdatedByCurrentUser = card.userId === context.rootState.currentUser.id
      if (cardIsUpdatedByCurrentUser) {
        context.dispatch('currentUser/cardsCreatedCount', { shouldIncrement: false }, { root: true })
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
      context.commit('history/add', update, { root: true })
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
    showCardDetails: (context, cardId) => {
      context.dispatch('closeAllDialogs', 'currentSpace.showCardDetails', { root: true })
      context.dispatch('incrementCardZ', cardId)
      context.commit('cardDetailsIsVisibleForCardId', cardId, { root: true })
      context.commit('parentCardId', cardId, { root: true })
      context.commit('loadSpaceShowDetailsForCardId', '', { root: true })
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

    // Background

    loadBackground: (context, background) => {
      const currentBackground = utils.urlFromString(document.body.style.backgroundImage)
      if (background === currentBackground) { return }
      if (utils.urlIsImage(background)) {
        document.body.style.backgroundImage = `url(${background})`
      } else {
        document.body.style.backgroundImage = ''
      }
    },

    // Tags

    addTag: (context, tag) => {
      context.commit('addTag', tag)
      const update = { name: 'addTag', body: tag }
      const broadcastUpdate = { updates: tag, type: 'addTag' }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('history/add', update, { root: true })
      context.commit('broadcast/update', broadcastUpdate, { root: true })
    },
    removeTag: (context, tag) => {
      context.commit('removeTag', tag)
      const update = { name: 'removeTag', body: tag }
      const broadcastUpdate = { updates: tag, type: 'removeTag' }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('history/add', update, { root: true })
      context.commit('broadcast/update', broadcastUpdate, { root: true })
    },
    removeTags: (context, tag) => {
      context.commit('removeTags', tag)
      const update = { name: 'removeTags', body: tag }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('history/add', update, { root: true })
    },
    updateTagNameColor: (context, tag) => {
      context.commit('updateTagNameColor', tag)
      const update = { name: 'updateTagNameColor', body: tag }
      const broadcastUpdate = { updates: tag, type: 'updateTagNameColor' }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('history/add', update, { root: true })
      context.commit('broadcast/update', broadcastUpdate, { root: true })
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
      console.log('🌺 shouldBroadcast', shouldBroadcast, 'clientCount', total)
      return shouldBroadcast
    },

    // Cards
    cardById: (state) => (id) => {
      return state.cards.find(card => card.id === id)
    },

    // Tags
    tagByName: (state) => (name) => {
      return state.tags.find(tag => {
        return tag.name === name
      })
    },
    tagsByName: (state) => (name) => {
      return state.tags.filter(tag => {
        return tag.name === name
      })
    },
    tagsInCard: (state) => (card) => {
      return state.tags.filter(tag => tag.cardId === card.id)
    },
    spaceTags: (state) => (card) => {
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
