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
    getSpaceAllState: (state) => {
      return { ...state }
    },
    getSpaceIsRemote: (state) => {
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember()
      const isOtherSpace = !isSpaceMember
      const isSignedIn = userStore.getUserIsSignedIn
      return isOtherSpace || isSignedIn
    }
  },

  actions: {

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
        await this.addSpace() // TODO,  createSpace
        store.commit('loadNewSpace', false, { root: true })
      // restore last space
      } else if (userStore.lastSpaceId) {
        console.info('🚃 Restore last space', userStore.lastSpaceId)
        await this.loadLastSpace() // TODO
      // hello kinopio
      } else {
        console.info('🚃 Create and restore hello space')
        shouldLoadNewHelloSpace = true
      }
      await this.checkIfShouldCreateNewUserSpaces() // TODO
      store.commit('triggerUpdateWindowHistory', null, { root: true })
    },
    saveSpaceToCache () {
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember()
      if (!isSpaceMember) { return }
      if (this.isRemoved) { return }
      cache.saveSpace(this.getSpaceAllState)
    },

    // load

    restoreSpace (space) {
      space = utils.removeRemovedCardsFromSpace(space)
      this.$patch(space)
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
    async loadSpace (space) {
      space.connections = utils.migrationConnections(space.connections)
      if (!store.rootState.isEmbedMode) {
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
          this.updateSpacePreviewImage() //
          // always update drawing
          this.drawingImage = remoteSpace.drawingImage
          await cache.updateSpaceByUpdates({ drawingImage: remoteSpace.drawingImage }, this.id)
          store.commit('triggerDrawingRedraw', null, { root: true })
          return
        }
        await this.restoreSpaceRemote(remoteSpace) //
        this.saveSpaceToCache()
        this.notifySpaceIsOpen()
      } catch (error) {
        console.error('🚒 Error fetching remoteSpace', error)
      }
      store.dispatch('updateCurrentSpaceIsUnavailableOffline', space.id, { root: true })
      store.dispatch('updateCurrentUserIsInvitedButCannotEditCurrentSpace', space, { root: true })
      // focus card
      const cardId = store.rootState.focusOnCardId
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
        this.updateUserLastSpaceId() //
      } else {
        this.initializeSpace()
      }
    },

    // create

    // addCardToState (card) {
    //   this.byId[card.id] = card
    //   this.allIds.push(card.id)
    // },
    // async createCard (card) {
    //   // normalize card
    //   this.addCardToState(card)
    //   // if (!updates.isBroadcast) {
    //   // store.dispatch('broadcast/update', { updates: connection, type: 'addConnection', handler: 'currentConnections/create' }, { root: true })
    //   // store.dispatch('history/add', { connections: [connection] }, { root: true })
    //   await store.dispatch('api/addToQueue', { name: 'createCard', body: card }, { root: true })
    // },

    // update

    updateSpacePreviewImage: throttle(async () => {
      const userStore = useUserStore()
      const currentUserIsSignedIn = userStore.getUserIsSignedIn
      const canEditSpace = userStore.getUserCanEditSpace()
      const isPrivate = this.privacy === 'private'
      if (!currentUserIsSignedIn) { return }
      if (!canEditSpace) { return }
      if (isPrivate) { return }
      const response = await store.dispatch('api/updateSpacePreviewImage', this.id, { root: true })
      console.info('🙈 updated space preview image', response?.urls)
    }, 10 * 1000), // 10 seconds

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

    // notify

    notifySpaceIsOpen () {
      if (this.isRemoved) { return }
      const userStore = useUserStore()
      const isSpaceMember = userStore.getUserIsSpaceMember()
      const spaceIsOpen = this.privacy === 'open'
      if (!isSpaceMember && spaceIsOpen) {
        store.commit('addNotification', { message: 'This space is open to comments', icon: 'comment', type: 'success' }, { root: true })
      }
    }

  }
})
