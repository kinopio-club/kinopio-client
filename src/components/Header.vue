<template lang="pug">
header(:style="visualViewportPosition")
  nav.embed-nav(v-if="isEmbed")
    a(:href="currentSpaceUrl" @mousedown.left.stop="openKinopio" @touchstart.stop="openKinopio")
      button
        .logo
          .logo-image
        MoonPhase(v-if="currentSpace.moonPhase" :moonPhase="currentSpace.moonPhase")
        span {{currentSpaceName}} →
    .right
      .space-users
        .users
          User(v-if="currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
          User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
          User(v-for="user in collaborators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")

  nav(v-if="!isEmbed")
    .left
      .logo-about
        .button-wrap
          .logo(alt="kinopio logo" @click.left.stop="toggleAboutIsVisible" @touchend.stop @mouseup.left.stop :class="{active : aboutIsVisible}" tabindex="0")
            .logo-image
              .label-badge(v-if="shouldShowNewStuffIsUpdated")
                span NEW
            img.down-arrow(src="@/assets/down-arrow.svg")
          About(:visible="aboutIsVisible")
          KeyboardShortcuts(:visible="keyboardShortcutsIsVisible")
      .space-meta-rows
        .space-details-row.segmented-buttons
          //- Space
          .button-wrap
            button(@click.left.stop="toggleSpaceDetailsIsVisible" :class="{active : spaceDetailsIsVisible}")
              .badge.info(v-show="currentSpaceIsTemplate")
                span Template
              MoonPhase(v-if="currentSpace.moonPhase" :moonPhase="currentSpace.moonPhase")
              span {{currentSpaceName}}
              PrivacyIcon(:privacy="currentSpace.privacy" :closedIsNotVisible="true")
              img.icon.sunglasses.explore(src="@/assets/sunglasses.svg" v-if="shouldShowInExplore" title="Shown in Explore")
            SpaceDetails(:visible="spaceDetailsIsVisible")
            ImportArenaChannel(:visible="importArenaChannelIsVisible")
            SpaceDetailsInfo(:visible="spaceDetailsInfoIsVisible")
            //- Read Only badge
            .label-badge.read-only-badge-wrap(v-if="!userCanEditSpace && !currentSpaceIsTemplate")
              span(:class="{'invisible': readOnlyJiggle}")
                span Read Only
              span.invisible-badge(ref="readOnly" :class="{'badge-jiggle': readOnlyJiggle, 'invisible': !readOnlyJiggle}")
                span Read Only
          //- State
          .button-wrap(v-if="spaceHasStatusAndStatusDialogIsNotVisible")
            button(@click.left.stop="toggleSpaceStatusIsVisible" :class="{active : spaceStatusIsVisible}")
              Loader(:visible="spaceHasStatus")
              .badge.success.space-status-success(v-if="!spaceHasStatus")
            SpaceStatus(:visible="spaceStatusIsVisible")
          //- Offline
          .button-wrap(v-if="!isOnline")
            button(@click.left="toggleOfflineIsVisible" :class="{ active: offlineIsVisible}")
              img.icon.offline(src="@/assets/offline.svg")
            Offline(:visible="offlineIsVisible")

        .space-functions-row.segmented-buttons
          //- Add Space
          .button-wrap
            button(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: addSpaceIsVisible }")
              img.icon(src="@/assets/add.svg")
            AddSpace(:visible="addSpaceIsVisible" :shouldAddSpaceDirectly="true")
          //- Search
          .button-wrap
            button.search-button(@click.stop="toggleSearchIsVisible" :class="{active : searchIsVisible}")
              img.icon.search(v-if="!searchResultsCount" src="@/assets/search.svg")
              .badge.search.search-count-badge(v-if="searchResultsCount")
                img.icon.search(src="@/assets/search.svg")
                span {{searchResultsCount}}
              span.badge.info(v-if="totalFiltersActive")
                img.icon(src="@/assets/filter.svg")
                span {{totalFiltersActive}}
            Search(:visible="searchIsVisible")
          button(@click="showPreviousSearchCard" v-if="searchResultsCount")
            img.icon.left-arrow(src="@/assets/down-arrow.svg")
          button(@click="showNextSearchCard" v-if="searchResultsCount")
            img.icon.right-arrow(src="@/assets/down-arrow.svg")
          button(@click="clearSearchAndFilters" v-if="searchResultsOrFilters")
            img.icon.cancel(src="@/assets/add.svg")

    .right
      .space-users
        .users
          User(v-if="currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
          User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
          User(v-for="user in collaborators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
          UpgradeUser(:visible="upgradeUserIsVisible" @closeDialog="closeAllDialogs" :dialogOnRight="true")
        .users.spectators(v-if="!isEmbed")
          User(v-if="!currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
          User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")

      .controls(v-if="!isEmbed")
        //- Share
        .top-controls
          .button-wrap
            button(@click.left.stop="toggleShareIsVisible" :class="{active : shareIsVisible}")
              span Share
            Share(:visible="shareIsVisible")
          //- Notifications
          .button-wrap
            button(@click.left.stop="toggleNotificationsIsVisible" :class="{active : notificationsIsVisible}")
              span {{notificationsUnreadCount}}
            Notifications(:visible="notificationsIsVisible" :loading="notificationsIsLoading" :notifications="notifications" :unreadCount="notificationsUnreadCount" @markAllAsRead="markAllAsRead" @markAsRead="markAsRead" @updateNotifications="updateNotifications")

        .bottom-controls
          ResetPassword
          //- Sign Up or In
          .button-wrap(v-if="!currentUserIsSignedIn && isOnline")
            button(@click.left.stop="toggleSignUpOrInIsVisible" :class="{active : signUpOrInIsVisible}")
              span Sign Up or In
              Loader(:visible="loadingSignUpOrIn")
            SignUpOrIn(:visible="signUpOrInIsVisible" @loading="setLoadingSignUpOrIn")
          .button-wrap(v-if="!userIsUpgraded && isOnline && currentUserIsSignedIn")
            button(@click.left.stop="triggerUpgradeUserIsVisible")
              span Upgrade

</template>

<script>
import About from '@/components/dialogs/About.vue'
import SpaceDetails from '@/components/dialogs/SpaceDetails.vue'
import SpaceDetailsInfo from '@/components/dialogs/SpaceDetailsInfo.vue'
import SpaceStatus from '@/components/dialogs/SpaceStatus.vue'
import Offline from '@/components/dialogs/Offline.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import User from '@/components/User.vue'
import SignUpOrIn from '@/components/dialogs/SignUpOrIn.vue'
import ResetPassword from '@/components/dialogs/ResetPassword.vue'
import Share from '@/components/dialogs/Share.vue'
import Notifications from '@/components/dialogs/Notifications.vue'
import Loader from '@/components/Loader.vue'
import templates from '@/data/templates.js'
import ImportArenaChannel from '@/components/dialogs/ImportArenaChannel.vue'
import KeyboardShortcuts from '@/components/dialogs/KeyboardShortcuts.vue'
import UpgradeUser from '@/components/dialogs/UpgradeUser.vue'
import Search from '@/components/dialogs/Search.vue'
import AddSpace from '@/components/dialogs/AddSpace.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'
import uniqBy from 'lodash-es/uniqBy'

const maxIterations = 30
let currentIteration, updatePositionTimer
let updateNotificationsIntervalTimer

export default {
  name: 'Header',
  components: {
    About,
    SpaceDetails,
    SpaceDetailsInfo,
    SpaceStatus,
    Offline,
    User,
    SignUpOrIn,
    ResetPassword,
    Share,
    Notifications,
    Loader,
    ImportArenaChannel,
    KeyboardShortcuts,
    UpgradeUser,
    Search,
    MoonPhase,
    AddSpace,
    PrivacyIcon
  },
  data () {
    return {
      aboutIsVisible: false,
      spaceDetailsIsVisible: false,
      spaceDetailsInfoIsVisible: false,
      signUpOrInIsVisible: false,
      shareIsVisible: false,
      notificationsIsVisible: false,
      loadingSignUpOrIn: false,
      keyboardShortcutsIsVisible: false,
      upgradeUserIsVisible: false,
      spaceStatusIsVisible: false,
      offlineIsVisible: false,
      visualViewportPosition: {},
      readOnlyJiggle: false,
      notifications: [],
      notificationsIsLoading: true,
      addSpaceIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.closeAllDialogs()
      } else if (mutation.type === 'triggerSpaceDetailsVisible') {
        this.spaceDetailsIsVisible = true
      } else if (mutation.type === 'triggerSpaceDetailsInfoIsVisible') {
        this.spaceDetailsInfoIsVisible = true
      } else if (mutation.type === 'triggerSignUpOrInIsVisible') {
        this.signUpOrInIsVisible = true
      } else if (mutation.type === 'triggerKeyboardShortcutsIsVisible') {
        this.keyboardShortcutsIsVisible = true
      } else if (mutation.type === 'triggerUpgradeUserIsVisible') {
        this.upgradeUserIsVisible = true
      } else if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        currentIteration = 0
        if (updatePositionTimer) { return }
        updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
      } else if (mutation.type === 'currentUserIsPainting') {
        if (state.currentUserIsPainting) {
          this.addReadOnlyJiggle()
        }
      } else if (mutation.type === 'triggerReadOnlyJiggle') {
        this.addReadOnlyJiggle()
      } else if (mutation.type === 'triggerUpdateNotifications') {
        this.updateNotifications()
      } else if (mutation.type === 'triggerShowNextSearchCard') {
        this.showNextSearchCard()
      } else if (mutation.type === 'triggerShowPreviousSearchCard') {
        this.showPreviousSearchCard()
      }
    })
  },
  mounted () {
    window.addEventListener('scroll', this.updatePositionInVisualViewport)
    this.updateNotifications()
    updateNotificationsIntervalTimer = setInterval(() => {
      this.updateNotifications()
    }, 1000 * 60 * 10) // 10 minutes
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePositionInVisualViewport)
    clearInterval(updateNotificationsIntervalTimer)
  },
  computed: {
    isEmbed () { return this.$store.state.isEmbed },
    currentSpaceUrl () { return this.$store.getters['currentSpace/url'] },
    shouldShowNewStuffIsUpdated () {
      const newStuffIsUpdated = this.$store.state.newStuffIsUpdated
      const isNotDefaultSpace = !this.$store.getters['currentSpace/isHelloKinopio']
      const userCanEditSpace = this.$store.getters['currentUser/canEditSpace']()
      return newStuffIsUpdated && isNotDefaultSpace && userCanEditSpace
    },
    userCanEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    importArenaChannelIsVisible () { return this.$store.state.importArenaChannelIsVisible },
    currentSpace () { return this.$store.state.currentSpace },
    currentUser () { return this.$store.state.currentUser },
    currentUserIsSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    users () {
      let users = utils.clone(this.currentSpace.users)
      return users.filter(user => user.id !== this.currentUser.id)
    },
    collaborators () {
      let collaborators = this.currentSpace.collaborators
      return collaborators.filter(user => user.id !== this.currentUser.id)
    },
    spectators () {
      let spectators = this.currentSpace.spectators
      spectators = spectators.filter(user => user.id !== this.currentUser.id)
      spectators = uniqBy(spectators, 'id')
      return spectators
    },
    userIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
    currentSpaceName () {
      const id = this.$store.state.currentSpace.id
      const name = this.$store.state.currentSpace.name
      if (name) {
        return name
      } else {
        return `Space ${id}`
      }
    },
    currentUserIsSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    },
    spaceHasStatus () {
      if (!this.isOnline) { return }
      const isLoadingSpace = this.$store.state.isLoadingSpace
      const isJoiningSpace = this.$store.state.isJoiningSpace
      const isReconnectingToBroadcast = this.$store.state.isReconnectingToBroadcast
      return isLoadingSpace || isJoiningSpace || isReconnectingToBroadcast
    },
    spaceHasStatusAndStatusDialogIsNotVisible () {
      if (this.spaceHasStatus) {
        return true
      } else if (this.spaceStatusIsVisible) {
        return true
      } else {
        return false
      }
    },
    isOnline () {
      return this.$store.state.isOnline
    },
    currentSpaceIsTemplate () {
      const id = this.$store.state.currentSpace.id
      const templateSpaceIds = templates.spaces().map(space => space.id)
      return templateSpaceIds.includes(id)
    },
    shouldShowInExplore () {
      const privacy = this.$store.state.currentSpace.privacy
      if (privacy === 'private') { return false }
      return this.$store.state.currentSpace.showInExplore
    },
    notificationsUnreadCount () {
      if (!this.notifications) { return 0 }
      const unread = this.notifications.filter(notification => !notification.isRead)
      return unread.length || 0
    },
    searchIsVisible () { return this.$store.state.searchIsVisible },
    searchResultsCount () { return this.$store.state.searchResultsCards.length },
    totalFiltersActive () {
      const currentUser = this.$store.state.currentUser
      let userFilters = 0
      if (currentUser.filterShowUsers) {
        userFilters += 1
      }
      if (currentUser.filterShowDateUpdated) {
        userFilters += 1
      }
      if (currentUser.filterUnchecked) {
        userFilters += 1
      }
      const tagNames = this.$store.state.filteredTagNames
      const connections = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return userFilters + tagNames.length + connections.length + frames.length
    },
    searchResultsOrFilters () {
      if (this.searchResultsCount || this.totalFiltersActive) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    openKinopio () {
      const url = this.currentSpaceUrl
      const title = `${this.currentSpaceName} – Kinopio`
      window.open(url, title)
    },
    showCardDetails (card) {
      this.$store.dispatch('currentCards/showCardDetails', card.id)
      this.$store.commit('previousResultCardId', card.id)
    },
    showNextSearchCard () {
      const search = this.$store.state.search
      if (!search) { return }
      const cards = this.$store.state.searchResultsCards
      const previousResultCardId = this.$store.state.previousResultCardId
      if (!previousResultCardId) {
        this.showCardDetails(cards[0])
        return
      }
      const currentIndex = cards.findIndex(card => card.id === previousResultCardId)
      let index = currentIndex + 1
      if (cards.length === index) {
        index = 0
      }
      this.showCardDetails(cards[index])
    },
    showPreviousSearchCard () {
      const search = this.$store.state.search
      if (!search) { return }
      const cards = this.$store.state.searchResultsCards
      const previousResultCardId = this.$store.state.previousResultCardId
      if (!previousResultCardId) {
        this.showCardDetails(cards[0])
        return
      }
      const currentIndex = cards.findIndex(card => card.id === previousResultCardId)
      let index = currentIndex - 1
      if (index < 0) {
        index = cards.length - 1
      }
      this.showCardDetails(cards[index])
    },
    clearSearchAndFilters () {
      this.$store.dispatch('closeAllDialogs', 'Header.clearSearch')
      this.$store.commit('clearSearch')
      this.$store.dispatch('clearAllFilters')
    },
    addReadOnlyJiggle () {
      const element = this.$refs.readOnly
      if (!element) { return }
      this.readOnlyJiggle = true
      element.addEventListener('animationend', this.removeReadOnlyJiggle, false)
    },
    removeReadOnlyJiggle () {
      this.readOnlyJiggle = false
    },
    closeAllDialogs () {
      this.aboutIsVisible = false
      this.spaceDetailsIsVisible = false
      this.spaceDetailsInfoIsVisible = false
      this.signUpOrInIsVisible = false
      this.shareIsVisible = false
      this.keyboardShortcutsIsVisible = false
      this.upgradeUserIsVisible = false
      this.spaceStatusIsVisible = false
      this.offlineIsVisible = false
      this.notificationsIsVisible = false
      this.addSpaceIsVisible = false
    },
    updatePositionFrame () {
      currentIteration++
      this.updatePositionInVisualViewport()
      if (currentIteration < maxIterations) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
      }
    },
    updatePositionInVisualViewport () {
      if (!window.visualViewport) { return }
      const viewport = utils.visualViewport()
      const pinchZoomScale = viewport.scale
      const pinchZoomOffsetLeft = viewport.offsetLeft
      const pinchZoomOffsetTop = viewport.offsetTop
      if (pinchZoomScale === 1) { return }
      let style
      if (pinchZoomScale > 1) {
        style = {
          transform: `translate(${pinchZoomOffsetLeft}px, ${pinchZoomOffsetTop}px) scale(${1 / pinchZoomScale})`,
          'transform-origin': 'left top'
        }
      } else {
        style = {
          transform: `translate(${pinchZoomOffsetLeft}px, 0px)`,
          zoom: 1 / pinchZoomScale,
          'transform-origin': 'left top'
        }
      }
      this.visualViewportPosition = style
    },
    toggleAboutIsVisible () {
      const isVisible = this.aboutIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleAboutIsVisible')
      this.aboutIsVisible = !isVisible
    },
    toggleSpaceDetailsIsVisible () {
      const isVisible = this.spaceDetailsIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleSpaceDetailsIsVisible')
      this.spaceDetailsIsVisible = !isVisible
    },
    toggleSignUpOrInIsVisible () {
      const isVisible = this.signUpOrInIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleSignUpOrInIsVisible')
      this.signUpOrInIsVisible = !isVisible
    },
    toggleShareIsVisible () {
      const isVisible = this.shareIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleShareIsVisible')
      this.shareIsVisible = !isVisible
    },
    toggleNotificationsIsVisible () {
      const isVisible = this.notificationsIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleNotificationsIsVisible')
      this.notificationsIsVisible = !isVisible
      if (this.notificationsIsVisible) {
        this.updateNotifications()
      }
    },
    toggleAddSpaceIsVisible () {
      const isVisible = this.addSpaceIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleAddSpaceIsVisible')
      this.addSpaceIsVisible = !isVisible
    },
    toggleSpaceStatusIsVisible () {
      const isVisible = this.spaceStatusIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleSpaceStatusIsVisible')
      this.spaceStatusIsVisible = !isVisible
    },
    toggleOfflineIsVisible () {
      const isVisible = this.offlineIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleOfflineIsVisible')
      this.offlineIsVisible = !isVisible
    },
    toggleSearchIsVisible () {
      const isVisible = this.searchIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.toggleSearchIsVisible')
      this.$store.commit('searchIsVisible', !isVisible)
    },
    setLoadingSignUpOrIn (value) {
      this.loadingSignUpOrIn = value
    },
    triggerUpgradeUserIsVisible () {
      const isVisible = this.upgradeUserIsVisible
      this.$store.dispatch('closeAllDialogs', 'Header.triggerUpgradeUserIsVisible')
      this.upgradeUserIsVisible = !isVisible
    },

    // notifications

    async updateNotifications () {
      this.notificationsIsLoading = true
      this.notifications = await this.$store.dispatch('api/getNotifications') || []
      this.notificationsIsLoading = false
    },
    markAllAsRead () {
      const notifications = this.notifications.filter(notification => !notification.isRead)
      const notificationIds = notifications.map(notification => notification.id)
      this.updateNotificationsIsRead(notificationIds)
    },
    markAsRead (notificationId) {
      this.updateNotificationsIsRead([notificationId])
    },
    updateNotificationsIsRead (notificationIds) {
      this.notifications = this.notifications.map(notification => {
        if (notificationIds.includes(notification.id)) {
          notification.isRead = true
        }
        return notification
      })
      this.$store.dispatch('api/addToQueue', {
        name: 'updateNotificationsIsRead',
        body: notificationIds
      })
    }
  }
}
</script>

<style lang="stylus">
header
  pointer-events none
  position fixed
  top 0
  user-select none
  z-index var(--max-z)
  width 100%
  padding 8px
  display flex
  justify-content space-between
  nav,
  aside
    pointer-events none
    position relative
    display -webkit-box
    > *
      pointer-events all
  nav
    display flex
    flex-grow 4
    justify-content space-between
  .logo-about
    position relative
    display inline-block
    margin-right 6px
    > .button-wrap
      > .keyboard-shortcuts
        max-height calc(100vh - 120px)
        top calc(100% - 6px)

  .logo
    cursor pointer
    display flex
    > .logo-image
      min-width 45px
    img
      vertical-align middle
    .down-arrow
      padding-left 4px
    &:hover,
    &:focus
      .label-badge
        transform translateY(2px)
      .down-arrow
        transform translateY(3px)
    &:active,
    &.active
      .down-arrow
        transform translateY(5px)

  .embed-nav
    .logo
      display inline-flex
      vertical-align -3px
      margin-right 5px
      > .logo-image
        min-width initial
        width 17px
        height 15px

  .left-arrow
    transform rotate(90deg)
    vertical-align 1px
  .right-arrow
    transform rotate(-90deg)
    vertical-align 1px
  .search-button
    .badge
      margin-right 0
      margin-left 6px
      vertical-align 0

  .space-details-row
    margin-top 8px
    display initial
    @media(max-width 414px)
      max-width calc(100% - 200px)
    button
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
      max-width 30vw
    dialog
      max-width initial
    > .button-wrap
      max-width 100vw
      > button
        .privacy-icon
          margin-left 6px

  // should not bubble down into dialogs
  .space-details-row,
  .space-functions-row
    &.segmented-buttons
      > .button-wrap
        > button
          border-radius 0
          border-right 0
          .loader
            margin 0
        &:first-child
          > button
            border-top-left-radius 3px
            border-bottom-left-radius 3px
            border-right 0
        &:last-child
          > button
            border-top-right-radius 3px
            border-bottom-right-radius 3px
            border-right 1px solid var(--primary)

  .space-functions-row
    margin-top 5px
    position relative
    .search-count-badge
      margin 0

  aside
    display flex
    flex-direction column
  .left
    display flex
  .right
    display flex
    .space-users
      display flex
      > .users
        padding-right 6px
        max-width 40vw
        display flex
        flex-wrap wrap
        justify-content flex-end
        align-content flex-start

  .controls
    display inline-table
    .button-wrap + .button-wrap
      margin-left 6px

  .bottom-controls
    margin-top 5px
    display flex
    justify-content flex-end
    > .button-wrap
      display inline-block
      margin-left -2em

  button
    .explore
      display inline-flex
      margin 0
      margin-left 6px
      width 16px
      vertical-align baseline

  .read-only-badge-wrap
    min-width 58px
    pointer-events none
    position absolute
    background-color var(--info-background)
    bottom -8px
    left 5px
    z-index 1
    span
      width 100%
      color var(--primary)

  .invisible
    visibility hidden

  .invisible-badge
    position absolute
    left 3px

  .users
    > .upgrade-user
      max-height calc(100vh - 50px)

  .icon.offline
    height 13px
    vertical-align -2px

  .badge.space-status-success
    margin 0
    padding 0 7px
    border-radius 10px
    vertical-align 0

.badge-jiggle
  animation-name notificationJiggle
  animation-duration 0.4s
  animation-iteration-count 1
  animation-direction forward
  animation-fill-mode forwards
  animation-timing-function ease-out
@keyframes notificationJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-4deg)
  50%
    transform rotate(3deg)
  75%
    transform rotate(-4deg)
  100%
    transform rotate(0deg)
</style>
