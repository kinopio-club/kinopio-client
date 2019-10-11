import randomColor from 'randomcolor'
import nanoid from 'nanoid'

import utils from '@/utils.js'
import cache from '@/cache.js'

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
    apiKey: ''
  },
  getters: {
    isCurrentUser: (state) => (userId) => {
      return Boolean(state.id === userId)
    },
    isSignedIn: (state) => {
      return Boolean(state.apiKey)
    }
    // isMember: (state, getters, rootState) => {
    //   const inCurrentSpace = rootState.currentSpace.users.find(user => {
    //     return user.id === state.id
    //   })
    //   return Boolean(inCurrentSpace)
    // }
  },
  mutations: {
    updateColor: (state, newColor) => {
      state.color = newColor
      cache.updateUser('color', newColor)
    },
    updateName: (state, newName) => {
      state.name = newName
      cache.updateUser('name', newName)
    },
    updateLastSpaceId: (state, spaceId) => {
      state.lastSpaceId = spaceId
      cache.updateUser('lastSpaceId', spaceId)
    },
    updateLastReadNewStuffId: (state, newStuffId) => {
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
    // Added aug 2019, can safely remove this in aug 2020
    updateBetaUserId: (state, newId) => {
      if (state.id === '1') {
        const newId = nanoid()
        state.id = newId
        cache.updateUser('id', newId)
      }
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
      } else {
        console.log('🌸 Create new user')
        context.dispatch('createNewUser')
      }
    },
    createNewUser: (context) => {
      cache.saveUser(context.state)
    }
  }
}
