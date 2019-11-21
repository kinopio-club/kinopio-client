import randomColor from 'randomcolor'
import nanoid from 'nanoid'

import utils from '@/utils.js'
import cache from '@/cache.js'
import apiQueue from '@/apiQueue.js'
import api from '@/api.js'

export default {
  namespaced: true,
  state: {
    id: nanoid(),
    lastSpaceId: '',
    color: randomColor({ luminosity: 'light' }),
    name: undefined,
    defaultConnectionTypeId: '',
    lastReadNewStuffId: undefined,
    prefersDarkTheme: false,
    apiKey: '',
    numberOfCardsCreated: 0
  },
  getters: {
    isCurrentUser: (state) => (userId) => {
      return Boolean(state.id === userId)
    },
    isSignedIn: (state) => {
      return Boolean(state.apiKey)
    }
    // isContributor: (state, getters, rootState) => {
    //   const inCurrentSpace = rootState.currentSpace.users.find(user => {
    //     return user.id === state.id
    //   })
    //   return Boolean(inCurrentSpace)
    // }

  },
  mutations: {
    color: (state, newColor) => {
      state.color = newColor
      cache.updateUser('color', newColor)
    },
    name: (state, newName) => {
      state.name = newName
      cache.updateUser('name', newName)
    },
    lastSpaceId: (state, spaceId) => {
      state.lastSpaceId = spaceId
      cache.updateUser('lastSpaceId', spaceId)
    },
    lastReadNewStuffId: (state, newStuffId) => {
      state.lastReadNewStuffId = newStuffId
      cache.updateUser('lastReadNewStuffId', newStuffId)
    },
    defaultConnectionTypeId: (state, typeId) => {
      state.defaultConnectionTypeId = typeId
      cache.updateUser('defaultConnectionTypeId', typeId)
    },
    apiKey: (state, apiKey) => {
      state.apiKey = apiKey
      cache.updateUser('apiKey', apiKey)
    },
    restoreUser: (state, user) => {
      Object.keys(user).forEach(item => {
        state[item] = user[item]
      })
    },
    updateUser: (state, user) => {
      Object.keys(state).forEach(item => {
        if (user[item]) {
          state[item] = user[item]
        }
      })
      cache.saveUser(user)
    },
    // Aug 2019 migration
    updateBetaUserId: (state, newId) => {
      if (state.id === '1') {
        const newId = nanoid()
        state.id = newId
        cache.updateUser('id', newId)
      }
      // Oct 2019 migration
      if (!state.apiKey) {
        state.apiKey = ''
      }
    }
  },
  actions: {
    init: (context) => {
      const cachedUser = cache.user()
      if (utils.objectHasKeys(cachedUser)) {
        console.log('🌸 Restore user from cache', cachedUser.id)
        context.commit('restoreUser', cachedUser)
        context.commit('updateBetaUserId')
        context.dispatch('restoreRemoteUser', cachedUser)
      } else {
        console.log('🌸 Create new user')
        context.dispatch('createNewUser')
      }
    },
    createNewUser: (context) => {
      cache.saveUser(context.state)
    },
    name: (context, newName) => {
      context.commit('name', newName)
      apiQueue.add('updateUser', { name: newName })
    },
    color: (context, newColor) => {
      context.commit('color', newColor)
      apiQueue.add('updateUser', { color: newColor })
    },
    lastSpaceId: (context, spaceId) => {
      context.commit('lastSpaceId', spaceId)
      cache.updateUser('lastSpaceId', spaceId)
      apiQueue.add('updateUser', { lastSpaceId: spaceId })
    },
    lastReadNewStuffId: (context, newStuffId) => {
      context.commit('lastReadNewStuffId', newStuffId)
      apiQueue.add('updateUser', { lastReadNewStuffId: newStuffId })
    },
    defaultConnectionTypeId: (context, typeId) => {
      context.commit('defaultConnectionTypeId', typeId)
      apiQueue.add('updateUser', { defaultConnectionTypeId: typeId })
    },
    restoreRemoteUser: async (context, cachedUser) => {
      if (!context.getters.isSignedIn) { return }
      const remoteUser = await api.getUser()
      if (!remoteUser) { return }
      remoteUser.updatedAt = utils.normalizeToUnixTime(remoteUser.updatedAt)
      if (remoteUser.updatedAt > cachedUser.cacheDate) { console.log('🌸 Restore user from remote', remoteUser) }
      context.commit('updateUser', remoteUser)
    },
    confirmEmail: (context) => {
      apiQueue.add('updateUser', { emailIsVerified: true })
    }
  }
}
