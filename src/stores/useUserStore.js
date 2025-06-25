import { nextTick } from 'vue'
import { defineStore } from 'pinia'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserNotificationStore } from '@/stores/useUserNotificationStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useThemeStore } from '@/stores/useThemeStore'

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
      return { ...this.$state }
    },
    getUserPublicMeta () {
      return utils.userMeta(this.getUserAllState)
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
      const globalStore = useGlobalStore()
      let userFilters = 0
      if (this.filterUnchecked) {
        userFilters += 1
      }
      const tagNames = globalStore.filteredTagNames
      const connections = globalStore.filteredConnectionTypeIds
      const frames = globalStore.filteredFrameIds
      const boxes = globalStore.filteredBoxIds
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
      const globalStore = useGlobalStore()
      return globalStore.spaceReadOnlyKey.spaceId === space.id
    },
    getItemIsCreatedByUser (connection) {
      return this.id === connection.userId
    },
    getUserIsSpaceUserByUser (user) {
      const spaceStore = useSpaceStore()
      const isUser = spaceStore.users.find(spaceUser => spaceUser.id === user.id)
      return isUser
    },

    // init

    async initializeUserState (user) {
      if (utils.userIsUpgraded(user)) {
        user.isUpgraded = true
      } else {
        user.isUpgraded = false
      }
      if (user.apiKey) {
        postMessage.send({ name: 'setApiKey', value: user.apiKey })
      }
      this.$state = user
      await cache.saveUser(user)
    },

    // create

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
      this.initializeUserState(user)
    },
    async restoreUserAssociatedData () {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const groupStore = useGroupStore()
      try {
        globalStore.isLoadingFavorites = true
        if (!this.getUserIsSignedIn) {
          globalStore.isLoadingFavorites = false
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
        globalStore.isLoadingFavorites = false
      } catch (error) {
        console.error('🚒 restoreUserAssociatedData', error)
      }
    },
    checkIfShouldJoinGroup () {
      const globalStore = useGlobalStore()
      const groupStore = useGroupStore()
      if (!globalStore.groupToJoinOnLoad) { return }
      if (this.getUserIsSignedIn) {
        groupStore.joinGroup()
      } else {
        globalStore.notifySignUpToJoinGroup = true
      }
    },
    async initializeUser () {
      const globalStore = useGlobalStore()
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
      globalStore.triggerUserIsLoaded()
      this.checkIfShouldJoinGroup()
      console.log('🍍 initializeUser', this.getUserAllState)
    },

    // update

    async updateUserState (update) {
      const keys = Object.keys(update)
      for (const key of keys) {
        this[key] = update[key]
      }
    },
    broadcastUpdateUser (update) {
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const permission = utils.capitalizeFirstLetter(this.getUserSpacePermission) // User, Collaborator, Spectator
      const action = `update${permission}`
      broadcastStore.update({ updates: update, store: 'spaceStore', action })
      const user = { ...this.$state }
      user.userId = user.id
      spaceStore.updateUser(user)
      spaceStore.updateCollaborator(user)
    },
    async updateUser (update) {
      const apiStore = useApiStore()
      this.updateUserState(update)
      await cache.updateUser(update)
      this.broadcastUpdateUser(update)
      await apiStore.addToQueue({ name: 'updateUser', body: update })
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
      await apiStore.addToQueue({ name: 'updateFavoriteSpace', body, spaceId: space.id })
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
      await apiStore.addToQueue({ name: 'updateFavoriteUser', body })
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
      await apiStore.addToQueue({ name: 'updateFavoriteColor', body })
    },

    async updateUserFavoriteSpaceIsEdited (space) {
      this.favoriteSpaces = this.favoriteSpaces.map(favoriteSpace => {
        if (favoriteSpace.id === space.id) {
          favoriteSpace.isEdited = false
        }
        return space
      })
      await cache.updateUser({
        favoriteSpaces: this.favoriteSpaces
      })
    },

    // keyboard shortcuts

    async addToDisabledKeyboardShortcuts (value) {
      this.disabledKeyboardShortcuts.push(value)
      await cache.updateUser({
        disabledKeyboardShortcuts: this.disabledKeyboardShortcuts
      })
    },
    async removeFromDisabledKeyboardShortcuts (value) {
      this.disabledKeyboardShortcuts = this.disabledKeyboardShortcuts.filter(shortcutName => value !== shortcutName)
      await cache.updateUser({
        disabledKeyboardShortcuts: this.disabledKeyboardShortcuts
      })
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
      await apiStore.addToQueue({ name: 'updateUserCardsCreatedCountRaw', body: { delta } })
      // update count
      if (this.getShouldPreventCardsCreatedCountUpdate) { return }
      this.cardsCreatedCount = count
      await apiStore.addToQueue({ name: 'updateUserCardsCreatedCount', body: { delta } })
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
      })
    },

    // are.na

    async updateUserArenaAccessToken (arenaReturnedCode) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      console.info('updateArenaAccessToken')
      globalStore.importArenaChannelIsVisible = true
      globalStore.isAuthenticatingWithArena = true
      const { arenaAccessToken } = await apiStore.updateArenaAccessToken(arenaReturnedCode)
      this.arenaAccessToken = arenaAccessToken
      globalStore.importArenaChannelIsVisible = true
      globalStore.isAuthenticatingWithArena = false
      await apiStore.addToQueue({
        name: 'updateUser',
        body: { arenaAccessToken }
      })
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
      const globalStore = useGlobalStore()
      const canEditSpace = this.getUserCanEditSpace
      if (canEditSpace) { return }
      const cannotEdit = this.getUserIsUnableToEditUnlessSignedIn
      const notificationWithPosition = document.querySelector('.notifications-with-position .item')
      if (cannotEdit) {
        globalStore.addNotificationWithPosition({ message: 'Sign in to Edit', position, type: 'info', layer: 'space', icon: 'cancel' })
      } else {
        globalStore.addNotificationWithPosition({ message: 'Space is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
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
      })
    },

    // filters

    clearUserFilters () {
      this.filterShowUsers = false
      this.filterShowDateUpdated = false
      this.filterShowAbsoluteDates = false
      this.filterUnchecked = false
      this.filterComments = false
    }

  }
})
