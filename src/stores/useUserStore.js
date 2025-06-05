import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserNotificationStore } from '@/stores/useUserNotificationStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useThemeStore } from '@/stores/useThemeStore'

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
    getUserAllState () {
      return { ...this }
    },
    getUserIsSignedIn () {
      return Boolean(this.apiKey)
    },
    getUserCardsCreatedIsOverLimit () {
      const cardsCreatedLimit = consts.cardsCreatedLimit
      if (this.isUpgraded) { return }
      if (this.cardsCreatedCount >= cardsCreatedLimit) { return true }
    },
    getShouldPreventCardsCreatedCountUpdate () {
      const spaceStore = useSpaceStore()
      const isUpgraded = spaceStore.getSpaceCreatorIsUpgraded
      const isCreator = spaceStore.getSpaceCreatorIsCurrentUser
      return (isUpgraded && !isCreator)
    },
    getUserTotalItemFadingFiltersActive () {
      let userFilters = 0
      if (this.filterUnchecked) {
        userFilters += 1
      }
      const tagNames = store.state.filteredTagNames
      const connections = store.state.filteredConnectionTypeIds
      const frames = store.state.filteredFrameIds
      const boxes = store.state.filteredBoxIds
      return userFilters + tagNames.length + connections.length + frames.length + boxes.length
    },
    getUserIsUnableToEditUnlessSignedIn () {
      const spaceStore = useSpaceStore()
      const spaceIsOpen = spaceStore.privacy === 'open'
      const isSignedIn = Boolean(this.apiKey)
      return !isSignedIn && spaceIsOpen
    },
    getUserIsSpaceCreator () {
      const spaceStore = useSpaceStore()
      return spaceStore.userId === this.id
    },
    getUserIsSpaceUser () {
      const spaceStore = useSpaceStore()
      let userIsInSpace = Boolean(spaceStore.users?.find(user => {
        return user.id === this.id
      }))
      userIsInSpace = userIsInSpace || spaceStore.userId === this.id
      return userIsInSpace
    },
    getUserIsSpaceCollaborator () {
      const spaceStore = useSpaceStore()
      if (spaceStore.collaborators) {
        return Boolean(spaceStore.collaborators.find(collaborator => {
          return collaborator.id === this.id
        }))
      }
      return false
    },
    getUserDrawingColor () {
      return this.drawingColor || this.color
    },
    getUserIsSpaceMember () {
      const groupStore = useGroupStore()
      const isSpaceUser = this.getUserIsSpaceUser
      const isSpaceCollaborator = this.getUserIsSpaceCollaborator
      const isGroupMember = groupStore.getIsCurrentSpaceGroupUser
      return Boolean(isSpaceUser || isSpaceCollaborator || isGroupMember)
    },
    getUserCanEditSpace () {
      const spaceStore = useSpaceStore()
      const spaceIsOpen = spaceStore.privacy === 'open'
      const currentUserIsSignedIn = this.getUserIsSignedIn
      const canEditOpenSpace = spaceIsOpen && currentUserIsSignedIn
      const isSpaceMember = this.getUserIsSpaceMember
      return canEditOpenSpace || isSpaceMember
    },
    getUserSpacePermission () {
      const spaceStore = useSpaceStore()
      const isSpaceUser = this.getUserIsSpaceUser
      const isSpaceCollaborator = this.getUserIsSpaceCollaborator
      const spaceHasNoUsers = !spaceStore.users?.length
      if (isSpaceUser || spaceHasNoUsers) {
        return 'user'
      } else if (isSpaceCollaborator) {
        return 'collaborator'
      } else {
        return 'spectator'
      }
    },
    getUserIsCommentOnly () {
      const canEditSpace = this.getUserCanEditSpace
      const isSpaceMember = this.getUserIsSpaceMember
      return canEditSpace && !isSpaceMember
    }
  },

  actions: {

    getUserIsCurrentUser (user) {
      return Boolean(this.id === user?.id)
    },
    getUserTagByName (name) {
      return this.tags.find(tag => tag.name === name)
    },
    getUserIsOtherSpaceMember (space) {
      const spaceStore = useSpaceStore()
      const groupStore = useGroupStore()
      space = space || spaceStore.getSpaceAllState
      const isSpaceUser = this.getUserIsSpaceUser
      const isSpaceCollaborator = this.getUserIsSpaceCollaborator
      const isGroupMember = groupStore.getIsCurrentSpaceGroupUser
      return Boolean(isSpaceUser || isSpaceCollaborator || isGroupMember)
    },
    getUserCanEditBox (box) {
      const isSpaceMember = this.getUserIsSpaceMember
      if (isSpaceMember) { return true }
      const canEditSpace = this.getUserCanEditSpace
      const createdBox = this.getUserIsBoxCreator(box)
      if (canEditSpace && createdBox) { return true }
      return false
    },
    getUserIsBoxCreator (box) {
      const isCreatedByUser = this.id === box.userId
      const isNoUser = !box.userId
      return isCreatedByUser || isNoUser
    },
    getUserIsCardCreator (card) {
      if (!card) { return }
      const isCreatedByUser = this.id === card.userId
      const isUpdatedByUser = this.id === card.nameUpdatedByUserId
      const isNoUser = !card.userId && !card.nameUpdatedByUserId
      return isCreatedByUser || isUpdatedByUser || isNoUser
    },
    getUserCanEditCard (card) {
      const isSpaceMember = this.getUserIsSpaceMember
      if (isSpaceMember) { return true }
      const canEditSpace = this.getUserCanEditSpace
      const getUserIsCardCreator = this.getUserIsCardCreator(card)
      if (canEditSpace && getUserIsCardCreator) { return true }
      return false
    },
    getUserTotalFiltersActive () {
      let userFilters = this.totalItemFadingFiltersActive
      if (this.filterShowUsers) {
        userFilters += 1
      }
      if (this.filterShowDateUpdated) {
        userFilters += 1
      }
      if (this.filterComments) {
        userFilters += 1
      }
      return userFilters
    },
    getUserIsReadOnlyInvitedToSpace (space) {
      return store.state.spaceReadOnlyKey.spaceId === space.id
    },
    getItemIsCreatedByUser (connection) {
      return this.id === connection.userId
    },

    // init

    async updateUserState (user) {
      if (utils.userIsUpgraded(user)) {
        user.isUpgraded = true
      } else {
        user.isUpgraded = false
      }
      if (user.apiKey) {
        postMessage.send({ name: 'setApiKey', value: user.apiKey })
      }
      await cache.saveUser(user)
      Object.keys(user).forEach(item => {
        this[item] = user[item]
      })
    },
    async createNewUser () {
      console.info('🌸 Create new user')
      this.themeIsSystem = true
      this.appleAppAccountToken = uuidv4()
      const allState = { ...this.$state }
      cache.saveUser(allState)
    },
    async restoreRemoteUser () {
      const apiStore = useApiStore()
      if (!this.getUserIsSignedIn) { return }
      const user = await apiStore.getUser()
      if (!user) { return }
      user.updatedAt = utils.unixTime(user.updatedAt)
      console.info('🌸 Initialize user from remote', user)
      this.updateUserState(user)
    },
    async restoreUserAssociatedData () {
      const apiStore = useApiStore()
      const groupStore = useGroupStore()
      try {
        store.commit('isLoadingFavorites', true, { root: true })
        if (!this.getUserIsSignedIn) {
          store.commit('isLoadingFavorites', false, { root: true })
          return
        }
        const [favoriteSpaces, favoriteUsers, favoriteColors, hiddenSpaces, tags, groups] = await Promise.all([
          apiStore.getUserFavoriteSpaces(),
          apiStore.getUserFavoriteUsers(),
          apiStore.getUserFavoriteColors(),
          apiStore.getUserHiddenSpaces(),
          apiStore.getUserTags(),
          apiStore.getUserGroups()
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
          groupStore.restoreGroup(groups)
        }
        store.commit('isLoadingFavorites', false, { root: true })
      } catch (error) {
        console.error('🚒 restoreUserAssociatedData', error)
      }
    },
    checkIfShouldJoinGroup () {
      const groupStore = useGroupStore()
      if (!store.state.groupToJoinOnLoad) { return }
      if (this.getUserIsSignedIn) {
        groupStore.joinGroup()
      } else {
        store.commit('notifySignUpToJoinGroup', true, { root: true })
      }
    },
    async initializeUser () {
      const themeStore = useThemeStore()
      const cachedUser = await cache.user()
      if (utils.objectHasKeys(cachedUser)) {
        console.info('🌸 Initialize user from cache', cachedUser.id)
        this.updateUserState(cachedUser)
        themeStore.restoreTheme()
        await this.restoreRemoteUser(cachedUser)
        await this.restoreUserAssociatedData()
      } else {
        this.createNewUser()
        themeStore.restoreTheme()
      }
      store.commit('triggerUserIsLoaded', null, { root: true })
      this.checkIfShouldJoinGroup()
      console.log('🍍', { ...this.$state })
    },

    // update

    broadcastUpdate (updates) {
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const permission = utils.capitalizeFirstLetter(this.getUserSpacePermission) // User, Collaborator, Spectator
      const type = `update${permission}`
      broadcastStore.updateUser({ id: spaceStore.id, updates, type, userId: this.id })
      const user = { ...this.$state }
      user.userId = user.id
      spaceStore.updateUser(user)
      spaceStore.updateCollaborator(user)
    },

    async updateUser (update) {
      const apiStore = useApiStore()
      const keys = Object.keys(update)
      for (const key of keys) {
        this[key] = update[key]
        await cache.updateUser(key, update[key])
        this.broadcastUpdate({ [key]: update[key] })
      }
      await apiStore.addToQueue({ name: 'updateUser', body: update }, { root: true })
    },

    // favorites

    async updateUserFavoriteSpace (space, shouldAdd) {
      const apiStore = useApiStore()
      const userNotificationStore = useUserNotificationStore()
      if (shouldAdd) {
        this.favoriteSpaces.push(space)
        userNotificationStore.addFavoriteSpace(space)
      } else {
        this.favoriteSpaces = this.favoriteSpaces.filter(favoriteSpace => {
          return favoriteSpace.id !== space.id
        })
        userNotificationStore.removeFavoriteSpace(space)
      }
      const body = { spaceId: space.id, value: shouldAdd }
      await apiStore.addToQueue({ name: 'updateFavoriteSpace', body, spaceId: space.id }, { root: true })
    },
    async updateUserFavoriteUser (user, shouldAdd) {
      const apiStore = useApiStore()
      const userNotificationStore = useUserNotificationStore()
      if (shouldAdd) {
        this.favoriteUsers.push(user)
        userNotificationStore.addFavoriteUser(user)
      } else {
        this.favoriteUsers = this.favoriteUsers.filter(favoriteUser => {
          return favoriteUser.id !== user.id
        })
        userNotificationStore.removeFavoriteUser(user)
      }
      const body = { favoriteUserId: user.id, value: shouldAdd }
      await apiStore.addToQueue({ name: 'updateFavoriteUser', body }, { root: true })
    },
    async updateUserFavoriteColor (color, shouldAdd) {
      const apiStore = useApiStore()
      color = color.color
      if (shouldAdd) {
        this.favoriteColors.push(color)
      } else {
        this.favoriteColors = this.favoriteColors.filter(favoriteColor => {
          return favoriteColor !== color
        })
      }
      const body = { color, value: shouldAdd }
      await apiStore.addToQueue({ name: 'updateFavoriteColor', body }, { root: true })
    },

    async updateUserFavoriteSpaceIsEdited (space) {
      this.favoriteSpaces = this.favoriteSpaces.map(favoriteSpace => {
        if (favoriteSpace.id === space.id) {
          favoriteSpace.isEdited = false
        }
        return space
      })
      await cache.updateUser('favoriteSpaces', this.favoriteSpaces)
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
      const apiStore = useApiStore()
      cards = cards.filter(card => !card.isCreatedThroughPublicApi)
      cards = cards.filter(card => this.getUserIsCurrentUser({ id: card.userId }))
      let delta = cards.length
      if (shouldDecrement) {
        delta = -delta
      }
      const count = this.cardsCreatedCount + delta
      // update raw vanity count
      this.cardsCreatedCountRaw = count
      await apiStore.addToQueue({ name: 'updateUserCardsCreatedCountRaw', body: { delta } }, { root: true })
      // update count
      if (this.getShouldPreventCardsCreatedCountUpdate) { return }
      this.cardsCreatedCount = count
      await apiStore.addToQueue({ name: 'updateUserCardsCreatedCount', body: { delta } }, { root: true })
    },
    getUserCardsCreatedWillBeOverLimit (count) {
      if (this.isUpgraded) { return }
      if (this.cardsCreatedCount + count >= consts.cardsCreatedLimit) { return true }
    },

    // inbox

    async getInboxSpace () {
      const apiStore = useApiStore()
      let space = await cache.getInboxSpace()
      if (!space) {
        try {
          space = await apiStore.getUserInboxSpace()
        } catch (error) {
          console.warn('🚑 inboxSpace', error)
        }
      }
      return space
    },

    // email

    async updateUserEmailIsVerified () {
      const apiStore = useApiStore()
      await apiStore.addToQueue({
        name: 'updateUser',
        body: {
          emailIsVerified: true
        }
      }, { root: true })
    },

    // are.na

    async updateUserArenaAccessToken (arenaReturnedCode) {
      const apiStore = useApiStore()
      console.info('updateArenaAccessToken')
      store.commit('importArenaChannelIsVisible', true, { root: true })
      store.commit('isAuthenticatingWithArena', true, { root: true })
      const { arenaAccessToken } = await apiStore.updateArenaAccessToken(arenaReturnedCode)
      this.arenaAccessToken = arenaAccessToken
      store.commit('importArenaChannelIsVisible', true, { root: true })
      store.commit('isAuthenticatingWithArena', false, { root: true })
      await apiStore.addToQueue({
        name: 'updateUser',
        body: { arenaAccessToken }
      }, { root: true })
    },

    // drawing

    cycleDrawingBrushSize () {
      const prevValue = this.drawingBrushSize
      let value
      if (prevValue === 's') {
        value = 'm'
      }
      if (prevValue === 'm') {
        value = 'l'
      }
      if (prevValue === 'l') {
        value = 's'
      }
      this.drawingBrushSize = value
    },

    // notify

    notifyReadOnly (position) {
      const canEditSpace = this.getUserCanEditSpace
      if (canEditSpace) { return }
      const cannotEdit = this.getUserIsUnableToEditUnlessSignedIn
      const notificationWithPosition = document.querySelector('.notifications-with-position .item')
      if (cannotEdit) {
        store.commit('addNotificationWithPosition', { message: 'Sign in to Edit', position, type: 'info', layer: 'space', icon: 'cancel' }, { root: true })
      } else {
        store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' }, { root: true })
      }
    },

    // hidden spaces

    async updateUserHiddenSpace (spaceId, isHidden) {
      const apiStore = useApiStore()
      const space = { id: spaceId }
      if (isHidden) {
        this.hiddenSpaces.push(space)
      } else {
        this.hiddenSpaces = this.hiddenSpaces.filter(space => {
          return space?.id !== spaceId
        })
      }
      await apiStore.addToQueue({
        name: 'updateSpaceIsHidden',
        body: {
          spaceId,
          isHidden
        }
      }, { root: true })
    }

  }
})
