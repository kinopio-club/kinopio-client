import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import postMessage from '@/postMessage.js'

import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid' // polyfill for self.crypto.randomUUID(), for legacy todesktop support, 2014
import uniqBy from 'lodash-es/uniqBy'

export const useUserStore = defineStore('users', {
  state: () => ({
    id: nanoid(),
    lastSpaceId: '',
    color: randomColor({ luminosity: 'light' }),
    name: undefined,
    description: undefined,
    website: undefined,
    apiKey: '',
    arenaAccessToken: '',
    favoriteUsers: [],
    favoriteSpaces: [],
    favoriteColors: [],
    hiddenSpaces: [],
    cardsCreatedCount: 0,
    cardsCreatedCountRaw: 0,
    isUpgraded: false,
    isModerator: false,
    filterShowUsers: false,
    filterShowDateUpdated: false,
    filterShowAbsoluteDates: false,
    filterUnchecked: false,
    filterComments: false,
    shouldHideTutorialCards: false,
    shouldHideDateCards: false,
    shouldEmailNotifications: true,
    shouldEmailBulletin: true,
    shouldEmailWeeklyReview: true,
    shouldShowMoreAlignOptions: false,
    shouldUseLastConnectionType: true,
    shouldShowItemActions: false,
    shouldShowMultipleSelectedLineActions: false,
    shouldShowMultipleSelectedBoxActions: false,
    shouldDisableRightClickToPan: false,
    shouldShowCurrentSpaceTags: false,
    showInExploreUpdatedAt: null, // date
    defaultSpaceBackground: undefined,
    defaultSpaceBackgroundGradient: undefined,
    defaultSpaceBackgroundTint: undefined,
    defaultCardBackgroundColor: undefined,
    defaultConnectionControlPoint: consts.straightLineConnectionPathControlPoint,
    downgradeAt: null,
    shouldUseStickyCards: true,
    shouldIncreaseUIContrast: false,
    shouldPauseConnectionDirections: false,
    shouldInvertZoom: false,
    lastUsedImagePickerService: '',
    AIImages: [],
    theme: null,
    themeIsSystem: false,
    outsideSpaceBackgroundIsStatic: false,
    shouldDisableHapticFeedback: false,
    appleAppAccountToken: null,
    appleSubscriptionIsActive: null,
    studentDiscountIsAvailable: false,
    lastSidebarSection: '',
    prevInviteEmails: '',
    prevHeaderFontId: 0,
    cardSettingsDefaultCharacterLimit: consts.defaultCharacterLimit,
    cardSettingsShiftEnterShouldAddChildCard: true,
    cardSettingsMaxCardWidth: consts.normalCardMaxWidth,
    prevSettingsSection: null,
    disabledKeyboardShortcuts: ['newSpace'],

    // space filters

    dialogSpaceFilterByGroup: {},
    dialogSpaceFilterByUser: {},
    dialogSpaceFilterShowHidden: false,
    dialogSpaceFilterSortBy: null, // null, updatedAt, createdAt, alphabetical
    dialogSpaceFilterByTemplates: false,

    // user tags

    tags: [],

    // drawing

    drawingBrushSize: 'm',
    drawingColor: undefined
  }),

  getters: {
    getUserIsSignedIn: (state) => {
      return Boolean(state.apiKey)
    },
    getUserIsCurrentUser: (state) => {
      return (user) => Boolean(state.id === user.id)
    },
    getUserCardsCreatedIsOverLimit: (state) => {
      const cardsCreatedLimit = consts.cardsCreatedLimit
      if (state.isUpgraded) { return }
      if (state.cardsCreatedCount >= cardsCreatedLimit) { return true }
    },
    getShouldPreventCardsCreatedCountUpdate: (state) => {
      const isUpgraded = store.getters['currentSpace/spaceCreatorIsUpgraded']
      const isCurrentUser = store.getters['currentSpace/spaceCreatorIsCurrentUser']
      return (isUpgraded && !isCurrentUser)
    }

    // cardsCreatedWillBeOverLimit: (state, getters, rootState) => (count) => {
    //   const cardsCreatedLimit = consts.cardsCreatedLimit
    //   if (state.isUpgraded) { return }
    //   if (state.cardsCreatedCount + count >= cardsCreatedLimit) { return true }
    // },
    // canEditSpace: (state, getters, rootState, rootGetters) => (space) => {
    //   space = space || rootState.currentSpace
    //   const spaceIsOpen = space.privacy === 'open'
    //   const currentUserIsSignedIn = getters.isSignedIn
    //   const canEditOpenSpace = spaceIsOpen && currentUserIsSignedIn
    //   const isSpaceMember = getters.isSpaceMember(space)
    //   return canEditOpenSpace || isSpaceMember
    // },
    // cannotEditUnlessSignedIn: (state, getters, rootState) => (space) => {
    //   space = space || rootState.currentSpace
    //   const spaceIsOpen = space.privacy === 'open'
    //   const currentUserIsSignedIn = getters.isSignedIn
    //   return !currentUserIsSignedIn && spaceIsOpen
    // },
    // cardIsCreatedByCurrentUser: (state, getters, rootState) => (card) => {
    //   if (!card) { return }
    //   const isCreatedByUser = state.id === card.userId
    //   const isUpdatedByUser = state.id === card.nameUpdatedByUserId
    //   const isNoUser = !card.userId && !card.nameUpdatedByUserId
    //   return isCreatedByUser || isUpdatedByUser || isNoUser
    // },
    // boxIsCreatedByCurrentUser: (state, getters, rootState) => (box) => {
    //   const isCreatedByUser = state.id === box.userId
    //   const isNoUser = !box.userId
    //   return isCreatedByUser || isNoUser
    // },
    // canEditCard: (state, getters, rootState, rootGetters) => (card) => {
    //   const isSpaceMember = getters.isSpaceMember()
    //   if (isSpaceMember) { return true }
    //   const canEditSpace = getters.canEditSpace()
    //   const cardIsCreatedByCurrentUser = getters.cardIsCreatedByCurrentUser(card)
    //   if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
    //   return false
    // },
    // canOnlyComment: (state, getters, rootState, rootGetters) => () => {
    //   const canEditSpace = getters.canEditSpace()
    //   const isSpaceMember = getters.isSpaceMember()
    //   return canEditSpace && !isSpaceMember
    // },
    // canEditBox: (state, getters, rootState, rootGetters) => (box) => {
    //   const isSpaceMember = getters.isSpaceMember()
    //   if (isSpaceMember) { return true }
    //   const canEditSpace = getters.canEditSpace()
    //   const boxIsCreatedByCurrentUser = getters.boxIsCreatedByCurrentUser(box)
    //   if (canEditSpace && boxIsCreatedByCurrentUser) { return true }
    //   return false
    // },
    // connectionIsCreatedByCurrentUser: (state, getters, rootState) => (connection) => {
    //   return state.id === connection.userId
    // },
    // isSpaceUser: (state, getters, rootState) => (space) => {
    //   let userIsInSpace = Boolean(space.users?.find(user => {
    //     return user.id === state.id
    //   }))
    //   userIsInSpace = userIsInSpace || space.userId === state.id
    //   return userIsInSpace
    // },
    // isSpaceCollaborator: (state, getters, rootState) => (space) => {
    //   space = space || rootState.currentSpace
    //   if (space.collaborators) {
    //     return Boolean(space.collaborators.find(collaborator => {
    //       return collaborator.id === state.id
    //     }))
    //   }
    // },
    // isSpaceCreator: (state, getters, rootState) => (space) => {
    //   space = space || rootState.currentSpace
    //   return space.userId === state.id
    // },
    // isReadOnlyInvitedToSpace: (state, getters, rootState) => (space) => {
    //   return rootState.spaceReadOnlyKey.spaceId === space.id
    // },
    // shouldPreventCardsCreatedCountUpdate: (state, getters, rootState, rootGetters) => {
    //   const spaceCreatorIsUpgraded = rootGetters['currentSpace/spaceCreatorIsUpgraded']
    //   const spaceCreatorIsCurrentUser = rootGetters['currentSpace/spaceCreatorIsCurrentUser']
    //   if (spaceCreatorIsUpgraded && !spaceCreatorIsCurrentUser) {
    //     return true
    //   }
    // },
    // totalFiltersActive: (state, getters) => {
    //   let userFilters = getters.totalItemFadingFiltersActive
    //   if (state.filterShowUsers) {
    //     userFilters += 1
    //   }
    //   if (state.filterShowDateUpdated) {
    //     userFilters += 1
    //   }
    //   if (state.filterComments) {
    //     userFilters += 1
    //   }
    //   return userFilters
    // },
    // totalItemFadingFiltersActive: (state, getters, rootState) => {
    //   let userFilters = 0
    //   if (state.filterUnchecked) {
    //     userFilters += 1
    //   }
    //   const tagNames = rootState.filteredTagNames
    //   const connections = rootState.filteredConnectionTypeIds
    //   const frames = rootState.filteredFrameIds
    //   const boxes = rootState.filteredBoxIds
    //   return userFilters + tagNames.length + connections.length + frames.length + boxes.length
    // },

    // // AI Images

    // AIImagesThisMonth: (state, getters) => {
    //   if (state.isUpgraded) {
    //     const currentMonth = dayjs().month()
    //     const currentYear = dayjs().year()
    //     return state.AIImages.filter(image => {
    //       const month = dayjs(image.createdAt).month()
    //       const year = dayjs(image.createdAt).year()
    //       const isInCurrentMonth = month === currentMonth
    //       const isInCurrentYear = year === currentYear
    //       return isInCurrentMonth && isInCurrentYear
    //     })
    //   } else {
    //     return state.AIImages
    //   }
    // },
    // AIImagesThisMonthCount: (state, getters) => {
    //   const images = getters.AIImagesThisMonth
    //   return Math.floor(images.length / 2)
    // },
    // AIImagesLimit: (state, getters) => {
    //   if (state.isUpgraded) {
    //     return consts.AIImageLimitUpgradedUser
    //   } else {
    //     return consts.AIImageLimitFreeUser
    //   }
    // },
    // AIImagesIsUnderLimit: (state, getters) => {
    //   const current = getters.AIImagesThisMonthCount
    //   const limit = getters.AIImagesLimit
    //   return current < limit
    // },

    // // Billing

    // subscriptionIsApple: (state) => {
    //   return state.appleSubscriptionIsActive
    // },
    // subscriptionIsStripe: (state, getters) => {
    //   if (getters.subscriptionIsFree) { return }
    //   return state.stripeSubscriptionId
    // },
    // subscriptionIsFree: (state) => {
    //   const strings = ['🌷free', '🌷 free', '🫧free']
    //   return strings.includes(state.stripeSubscriptionId)
    // },

    // // user tags

    // tagByName: (state, getters) => (name) => {
    //   return state.tags.find(tag => tag.name === name)
    // },

    // // drawing

    // drawingColor: (state) => {
    //   return state.drawingColor || state.color
    // }

  },

  actions: {

    // TODO refactor these into standard getters if space always = store.state.currentSpace
    // const spaceStore = useSpaceStore()

    getUserIsSpaceUser (space) {
      space = space || store.state.currentSpace
      let userIsInSpace = Boolean(space.users?.find(user => {
        return user.id === this.id
      }))
      userIsInSpace = userIsInSpace || space.userId === this.id
      return userIsInSpace
    },
    getUserIsSpaceCollaborator (space) {
      space = space || store.state.currentSpace
      if (space.collaborators) {
        return Boolean(space.collaborators.find(collaborator => {
          return collaborator.id === this.id
        }))
      }
    },
    getUserSpacePermission (space) {
      space = space || store.state.currentSpace
      const isSpaceUser = this.getUserIsSpaceUser(space)
      const isSpaceCollaborator = this.getUserIsSpaceCollaborator(space)
      const spaceHasNoUsers = !space.users.length
      if (isSpaceUser || spaceHasNoUsers) {
        return 'user'
      } else if (isSpaceCollaborator) {
        return 'collaborator'
      } else {
        return 'spectator'
      }
    },
    getUserIsSpaceMember (space) {
      space = space || store.state.currentSpace
      const isSpaceUser = this.getUserIsSpaceUser(space)
      const isSpaceCollaborator = this.getUserIsSpaceCollaborator(space)
      const isGroupMember = store.getters['groups/currentUserIsCurrentSpaceGroupUser']
      return Boolean(isSpaceUser || isSpaceCollaborator || isGroupMember)
    },
    getUserCanEditSpace (space) {
      space = space || store.state.currentSpace
      const spaceIsOpen = space.privacy === 'open'
      const currentUserIsSignedIn = this.getUserIsSignedIn
      const canEditOpenSpace = spaceIsOpen && currentUserIsSignedIn
      const isSpaceMember = this.getUserIsSpaceMember(space)
      return canEditOpenSpace || isSpaceMember
    },

    // TODO refactor to getter after store -> rootStore

    getUserIsReadOnlyInvitedToSpace (space) {
      // space always currentspace?
      return store.state.spaceReadOnlyKey.spaceId === space.id
    },

    // init

    async updateUserState (user) {
      Object.keys(user).forEach(item => {
        this[item] = user[item]
      })
    },
    async createNewUser () {
      this.themeIsSystem = true
      this.appleAppAccountToken = uuidv4()
      const allState = { ...this.$state }
      cache.saveUser(allState)
    },
    async restoreRemoteUser () {
      if (!this.getUserIsSignedIn) { return }
      const user = await store.dispatch('api/getUser', null, { root: true })
      if (!user) { return }
      user.updatedAt = utils.unixTime(user.updatedAt)
      console.info('🌸 Initialize user from remote', user)
      await cache.saveUser(user)
      if (utils.userIsUpgraded(user)) {
        user.isUpgraded = true
      } else {
        user.isUpgraded = false
      }
      if (user.apiKey) {
        postMessage.send({ name: 'setApiKey', value: user.apiKey })
      }
      this.updateUserState(user)
    },
    async restoreUserAssociatedData () {
      try {
        store.commit('isLoadingFavorites', true, { root: true })
        if (!this.getUserIsSignedIn) {
          store.commit('isLoadingFavorites', false, { root: true })
          return
        }
        const [favoriteSpaces, favoriteUsers, favoriteColors, hiddenSpaces, tags, groups] = await Promise.all([
          store.dispatch('api/getUserFavoriteSpaces', null, { root: true }),
          store.dispatch('api/getUserFavoriteUsers', null, { root: true }),
          store.dispatch('api/getUserFavoriteColors', null, { root: true }),
          store.dispatch('api/getUserHiddenSpaces', null, { root: true }),
          store.dispatch('api/getUserTags', null, { root: true }),
          store.dispatch('api/getUserGroups', null, { root: true })
        ])
        if (favoriteUsers) {
          this.favoriteUsers = favoriteUsers
        }
        if (favoriteSpaces) {
          this.favoriteSpaces = favoriteSpaces
        }
        if (favoriteColors) {
          this.favoriteColors = favoriteColors
        }
        if (hiddenSpaces) {
          this.hiddenSpaces = hiddenSpaces
        }
        if (tags) {
          const newTags = uniqBy(tags, 'name')
          this.tags = newTags
        }
        if (groups) {
          store.commit('groups/restore', groups, { root: true })
        }
        store.commit('isLoadingFavorites', false, { root: true })
      } catch (error) {
        console.error('🚒 restoreUserAssociatedData', error)
      }
    },
    checkIfShouldJoinGroup () {
      if (!store.state.groupToJoinOnLoad) { return }
      if (this.getUserIsSignedIn) {
        store.dispatch('groups/joinGroup', null, { root: true })
      } else {
        store.commit('notifySignUpToJoinGroup', true, { root: true })
      }
    },
    async initializeUser () {
      const cachedUser = await cache.user()
      if (utils.objectHasKeys(cachedUser)) {
        console.info('🌸 Initialize user from cache', cachedUser.id)
        this.updateUserState(cachedUser)
        store.dispatch('themes/restore', null, { root: true })
        await this.restoreRemoteUser(cachedUser)
        await this.restoreUserAssociatedData()
      } else {
        console.info('🌸 Create new user')
        store.dispatch('createNewUser')
      }
      store.dispatch('themes/restore', null, { root: true })
      store.commit('triggerUserIsLoaded', null, { root: true })
      this.checkIfShouldJoinGroup()
    },

    // update

    broadcastUpdate (updates) {
      const space = store.state.currentSpace
      const spacePermission = utils.capitalizeFirstLetter(this.getUserSpacePermission(space)) // User, Collaborator, Spectator
      const type = `update${spacePermission}`
      store.commit('broadcast/updateUser', { id: space.id, updates, type, userId: this.id }, { root: true })
      const user = { ...this.$state }
      user.userId = user.id
      store.commit('currentSpace/updateUser', user, { root: true })
      store.commit('currentSpace/updateCollaborator', user, { root: true })
    },

    async updateUser (update) {
      const keys = Object.keys(update)
      for (const key of keys) {
        this[key] = update[key]
        await cache.updateUser(key, update[key])
        this.broadcastUpdate({ [key]: update[key] })
      }
      await store.dispatch('api/addToQueue', { name: 'updateUser', body: update }, { root: true })
    },

    // favorites

    async updateUserFavoriteSpace (space, shouldAdd) {
      if (shouldAdd) {
        this.favoriteSpaces.push(space)
        store.dispatch('userNotifications/addFavoriteSpace', space, { root: true })
      } else {
        this.favoriteSpaces = this.favoriteSpaces.filter(favoriteSpace => {
          return favoriteSpace.id !== space.id
        })
        store.dispatch('userNotifications/removeFavoriteSpace', space, { root: true })
      }
      const body = { spaceId: space.id, value: shouldAdd }
      await store.dispatch('api/addToQueue', { name: 'updateFavoriteSpace', body, spaceId: space.id }, { root: true })
    },
    async updateUserFavoriteUser (user, shouldAdd) {
      if (shouldAdd) {
        this.favoriteUsers.push(user)
        store.dispatch('userNotifications/addFavoriteUser', user, { root: true })
      } else {
        this.favoriteUsers = this.favoriteUsers.filter(favoriteUser => {
          return favoriteUser.id !== user.id
        })
        store.dispatch('userNotifications/removeFavoriteUser', user, { root: true })
      }
      const body = { favoriteUserId: user.id, value: shouldAdd }
      await store.dispatch('api/addToQueue', { name: 'updateFavoriteUser', body }, { root: true })
    },
    async updateUserFavoriteColor (color, shouldAdd) {
      color = color.color
      if (shouldAdd) {
        this.favoriteColors.push(color)
      } else {
        this.favoriteColors = this.favoriteColors.filter(favoriteColor => {
          return favoriteColor !== color
        })
      }
      const body = { color, value: shouldAdd }
      await store.dispatch('api/addToQueue', { name: 'updateFavoriteColor', body }, { root: true })
    },

    // keyboard shortcuts

    addToDisabledKeyboardShortcuts (value) {
      this.disabledKeyboardShortcuts.push(value)
      cache.updateUser('disabledKeyboardShortcuts', value)
    },
    removeFromDisabledKeyboardShortcuts (value) {
      this.disabledKeyboardShortcuts = this.disabledKeyboardShortcuts.filter(shortcutName => value !== shortcutName)
      cache.updateUser('disabledKeyboardShortcuts', value)
    },

    // last space id

    async clearUserLastSpaceId () {
      const spaces = await cache.getAllSpaces()
      const lastSpace = spaces[1]
      if (lastSpace) {
        this.updateUser({ lastSpace: lastSpace.id })
      } else {
        this.updateUser({ lastSpace: '' })
      }
    },

    // card limit

    async updateUserCardsCreatedCount (cards, shouldDecrement) {
      cards = cards.filter(card => !card.isCreatedThroughPublicApi)
      cards = cards.filter(card => this.getUserIsCurrentUser({ id: card.userId }))
      let delta = cards.length
      if (shouldDecrement) {
        delta = -delta
      }
      const count = this.cardsCreatedCount + delta
      // update raw vanity count
      store.commit('cardsCreatedCountRaw', count)
      await store.dispatch('api/addToQueue', { name: 'updateUserCardsCreatedCountRaw', body: { delta } }, { root: true })
      // update count
      if (this.getShouldPreventCardsCreatedCountUpdate) { return }
      this.cardsCreatedCount = count
      await store.dispatch('api/addToQueue', { name: 'updateUserCardsCreatedCount', body: { delta } }, { root: true })
    },

    // inbox

    async getInboxSpace () {
      let space = await cache.getInboxSpace()
      if (!space) {
        try {
          space = await store.dispatch('api/getUserInboxSpace', null, { root: true })
        } catch (error) {
          console.warn('🚑 inboxSpace', error)
        }
      }
      return space
    }

  }
})
