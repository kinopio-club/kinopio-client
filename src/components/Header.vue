<template lang="pug">
header.presentation-header(v-if="isPresentationMode" :style="position" :class="{'fade-out': isFadingOut}")
  button.active(@click="disablePresentationMode")
    img.icon(src="@/assets/presentation.svg")
  SelectAllBelow

header(v-if="isVisible" :style="position" :class="{'fade-out': isFadingOut, 'hidden': isHidden}")
  //- embed
  nav.embed-nav(v-if="isEmbedMode")
    a(:href="currentSpaceUrl" @mousedown.left.stop="openKinopio" @touchstart.stop="openKinopio")
      button
        .logo
          .logo-image
        MoonPhase(v-if="currentSpace.moonPhase" :moonPhase="currentSpace.moonPhase")
        span {{currentSpaceName}}{{' '}}
        img.icon.visit(src="@/assets/visit.svg")
    .right
      SpaceUsers

  //- standard
  nav(v-if="!isEmbedMode")
    .left
      //- About
      .logo-about
        .button-wrap
          .logo(alt="kinopio logo" @click.left.stop="toggleAboutIsVisible" @touchend.stop @mouseup.left.stop :class="{active: aboutIsVisible}" tabindex="0")
            .logo-image
              .label-badge.small-badge(v-if="shouldShowNewStuffIsUpdated")
                span NEW
            img.down-arrow(src="@/assets/down-arrow.svg")
          About(:visible="aboutIsVisible")
          KeyboardShortcuts(:visible="keyboardShortcutsIsVisible")
          Donate(:visible="donateIsVisible")
          AppsAndExtensions(:visible="appsAndExtensionsIsVisible")
      .space-meta-rows
        .space-functions-row
          .segmented-buttons.add-space-functions
            //- Add Space
            .button-wrap
              button.success(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: addSpaceIsVisible }")
                img.icon.add(src="@/assets/add.svg")
                span New
              AddSpace(:visible="addSpaceIsVisible" :shouldAddSpaceDirectly="true")
              Templates(:visible="templatesIsVisible")
          //- Search
          .segmented-buttons
            .button-wrap
              button.search-button(@click.stop="toggleSearchIsVisible" :class="{active : searchIsVisible || totalFiltersActive || searchResultsCount}")
                template(v-if="!searchResultsCount")
                  img.icon.search(src="@/assets/search.svg")
                .badge.search.search-count-badge(v-if="searchResultsCount")
                  img.icon.search(src="@/assets/search.svg")
                  span {{searchResultsCount}}
                span.badge.info(v-if="totalFiltersActive")
                  img.icon(src="@/assets/filter.svg")
                  span {{totalFiltersActive}}
              Search(:visible="searchIsVisible")
            //- button(@click="showPreviousSearchCard" v-if="searchResultsCount")
            //-   img.icon.left-arrow(src="@/assets/down-arrow.svg")
            //- button(@click="showNextSearchCard" v-if="searchResultsCount")
            //-   img.icon.right-arrow(src="@/assets/down-arrow.svg")
            button(@click="clearSearchAndFilters" v-if="searchResultsOrFilters")
              img.icon.cancel(src="@/assets/add.svg")

        .space-details-row.segmented-buttons
          //- Back
          .button-wrap(v-if="prevSpaceId" title="Go Back" @click.stop="changeToPrevSpace")
            button
              img.icon.left-arrow(src="@/assets/down-arrow.svg")
          //- Current Space
          .button-wrap
            button.space-name-button(@click.left.stop="toggleSpaceDetailsIsVisible" :class="{active: spaceDetailsIsVisible}")
              span(v-if="currentSpaceIsInbox")
                img.icon.inbox-icon(src="@/assets/inbox.svg")
              span(v-show="currentSpaceIsTemplate")
                img.icon.templates(src="@/assets/templates.svg")
              span(v-if="currentSpaceIsFromTweet")
                img.icon.tweet(src="@/assets/twitter.svg")
              SpaceTodayJournalBadge(:space="currentSpace")
              MoonPhase(v-if="currentSpace.moonPhase" :moonPhase="currentSpace.moonPhase")
              span {{currentSpaceName}}
              PrivacyIcon(:privacy="currentSpace.privacy" :closedIsNotVisible="true")
              img.icon.sunglasses.explore(src="@/assets/sunglasses.svg" v-if="shouldShowInExplore" title="Shown in Explore")
              img.icon.view-hidden(v-if="currentSpaceIsHidden" src="@/assets/view-hidden.svg")
            SpaceDetails(:visible="spaceDetailsIsVisible")
            ImportArenaChannel(:visible="importArenaChannelIsVisible")
            SpaceDetailsInfo(:visible="spaceDetailsInfoIsVisible")
            Import(:visible="importIsVisible")
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

    .right
      .controls(v-if="isSpace")
        .top-controls
          SpaceUsers
          ControlsSettings(:visible="controlsSettingsIsVisible")
          UserSettings
          ResetPassword
          //- Share
          .button-wrap
            button(@click.left.stop="toggleShareIsVisible" :class="{active : shareIsVisible}")
              span Share
            Share(:visible="shareIsVisible")
            EarnCredits(:visible="earnCreditsIsVisible")
          //- Notifications
          .button-wrap
            button(@click.left.stop="toggleNotificationsIsVisible" :class="{active : notificationsIsVisible}")
              span {{notificationsUnreadCount}}
            UserNotifications(:visible="notificationsIsVisible" :loading="notificationsIsLoading" :notifications="notifications" :unreadCount="notificationsUnreadCount" @markAllAsRead="markAllAsRead" @markAsRead="markAsRead" @updateNotifications="updateNotifications")
        .bottom-controls
          Discovery
          //- Sidebar
          .button-wrap
            button(@click.left.stop="toggleSidebarIsVisible" :class="{active : sidebarIsVisible}")
              img.icon.sidebar(src="@/assets/sidebar.svg")
            Sidebar(:visible="sidebarIsVisible")
        .row.bottom-controls
          //- Sign Up or In
          .button-wrap(v-if="!currentUserIsSignedIn && isOnline")
            button(@click.left.stop="toggleSignUpOrInIsVisible" :class="{active : signUpOrInIsVisible}")
              span Sign Up or In
              Loader(:visible="loadingSignUpOrIn")
            SignUpOrIn(:visible="signUpOrInIsVisible" @loading="setLoadingSignUpOrIn")
          //- Upgrade
          .button-wrap(v-if="!userIsUpgraded && isOnline && currentUserIsSignedIn")
            button(@click.left.stop="toggleUpgradeUserIsVisible" :class="{active: upgradeUserIsVisible}")
              span Upgrade
            UpgradeUser(:visible="upgradeUserIsVisible" @closeDialog="closeAllDialogs")
          //- Pricing
          .button-wrap(v-if="!userIsUpgraded")
            button(@click.left.stop="togglePricingIsVisible" :class="{active : pricingIsVisible}")
              span Pricing
            Pricing(:visible="pricingIsVisible")

  Toolbar(:visible="isSpace")
  SelectAllBelow
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
import UserNotifications from '@/components/dialogs/UserNotifications.vue'
import Loader from '@/components/Loader.vue'
import templates from '@/data/templates.js'
import ImportArenaChannel from '@/components/dialogs/ImportArenaChannel.vue'
import KeyboardShortcuts from '@/components/dialogs/KeyboardShortcuts.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'
import UpgradeUser from '@/components/dialogs/UpgradeUser.vue'
import Search from '@/components/dialogs/Search.vue'
import AddSpace from '@/components/dialogs/AddSpace.vue'
import Templates from '@/components/dialogs/Templates.vue'
import Sidebar from '@/components/dialogs/Sidebar.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'
import SelectAllBelow from '@/components/SelectAllBelow.vue'
import SpaceUsers from '@/components/SpaceUsers.vue'
import Donate from '@/components/dialogs/Donate.vue'
import Toolbar from '@/components/Toolbar.vue'
import Import from '@/components/dialogs/Import.vue'
import Pricing from '@/components/dialogs/Pricing.vue'
import EarnCredits from '@/components/dialogs/EarnCredits.vue'
import SpaceTodayJournalBadge from '@/components/SpaceTodayJournalBadge.vue'
import ControlsSettings from '@/components/dialogs/ControlsSettings.vue'
import Discovery from '@/components/Discovery.vue'
import UserSettings from '@/components/dialogs/UserSettings.vue'
import consts from '@/consts.js'

import { mapState, mapGetters } from 'vuex'
import sortBy from 'lodash-es/sortBy'

let updateNotificationsIntervalTimer

const fadeOutDuration = 10
const hiddenDuration = 20
const updatePositionDuration = 60
let fadeOutIteration, fadeOutTimer, hiddenIteration, hiddenTimer, updatePositionIteration, updatePositionTimer, shouldCancelFadeOut

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
    UserNotifications,
    Loader,
    ImportArenaChannel,
    KeyboardShortcuts,
    AppsAndExtensions,
    UpgradeUser,
    Search,
    MoonPhase,
    AddSpace,
    Templates,
    PrivacyIcon,
    SelectAllBelow,
    Sidebar,
    SpaceUsers,
    Donate,
    Toolbar,
    Import,
    Pricing,
    EarnCredits,
    SpaceTodayJournalBadge,
    ControlsSettings,
    Discovery,
    UserSettings
  },
  props: {
    isPinchZooming: Boolean,
    isTouchScrolling: Boolean
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
      appsAndExtensionsIsVisible: false,
      upgradeUserIsVisible: false,
      spaceStatusIsVisible: false,
      offlineIsVisible: false,
      position: {},
      readOnlyJiggle: false,
      notifications: [],
      notificationsIsLoading: true,
      addSpaceIsVisible: false,
      isHidden: false,
      templatesIsVisible: false,
      sidebarIsVisible: false,
      donateIsVisible: false,
      importIsVisible: false,
      earnCreditsIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.closeAllDialogs()
      } else if (mutation.type === 'triggerSpaceDetailsVisible') {
        this.spaceDetailsIsVisible = true
      } else if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        this.updatePosition()
      } else if (mutation.type === 'triggerSpaceDetailsInfoIsVisible') {
        this.spaceDetailsInfoIsVisible = true
      } else if (mutation.type === 'triggerSignUpOrInIsVisible') {
        this.signUpOrInIsVisible = true
      } else if (mutation.type === 'triggerAppsAndExtensionsIsVisible') {
        this.appsAndExtensionsIsVisible = true
      } else if (mutation.type === 'triggerKeyboardShortcutsIsVisible') {
        this.keyboardShortcutsIsVisible = true
      } else if (mutation.type === 'triggerUpgradeUserIsVisible') {
        this.upgradeUserIsVisible = true
      } else if (mutation.type === 'triggerDonateIsVisible') {
        this.donateIsVisible = true
      } else if (mutation.type === 'currentUserIsPainting') {
        if (state.currentUserIsPainting) {
          this.addReadOnlyJiggle()
        }
      } else if (mutation.type === 'triggerReadOnlyJiggle') {
        this.addReadOnlyJiggle()
      } else if (mutation.type === 'triggerUpdateNotifications' || mutation.type === 'triggerUserIsLoaded') {
        this.updateNotifications()
      } else if (mutation.type === 'triggerShowNextSearchCard') {
        this.showNextSearchCard()
      } else if (mutation.type === 'triggerShowPreviousSearchCard') {
        this.showPreviousSearchCard()
      } else if (mutation.type === 'triggerHideTouchInterface') {
        this.hidden()
      } else if (mutation.type === 'triggerTemplatesIsVisible') {
        this.templatesIsVisible = true
      } else if (mutation.type === 'triggerEarnCreditsIsVisible') {
        this.earnCreditsIsVisible = true
      } else if (mutation.type === 'triggerRemovedIsVisible' || mutation.type === 'triggerAIImagesIsVisible') {
        this.sidebarIsVisible = true
      } else if (mutation.type === 'triggerImportIsVisible') {
        this.importIsVisible = true
      } else if (mutation.type === 'triggerAddSpaceIsVisible') {
        this.addSpaceIsVisible = true
      }
    })
  },
  mounted () {
    window.addEventListener('scroll', this.updatePosition)
    this.updatePosition()
    this.updateNotifications()
    updateNotificationsIntervalTimer = setInterval(() => {
      this.updateNotifications()
    }, 1000 * 60 * 10) // 10 minutes
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePosition)
    clearInterval(updateNotificationsIntervalTimer)
  },
  computed: {
    ...mapState([
      'isEmbedMode',
      'isAddPage',
      'importArenaChannelIsVisible',
      'currentSpace',
      'currentUser',
      'newStuffIsUpdated',
      'isLoadingSpace',
      'isLoadingOtherItems',
      'isJoiningSpace',
      'isReconnectingToBroadcast',
      'isOnline',
      'searchIsVisible',
      'searchResultsCards',
      'search',
      'previousResultItem',
      'spaceDetailsIsPinned',
      'sidebarIsPinned',
      'cardDetailsIsVisibleForCardId',
      'connectionDetailsIsVisibleForConnectionId',
      'isPresentationMode'
    ]),
    ...mapGetters([
      'isTouchDevice',
      'currentSpace/url',
      'currentSpace/isHelloKinopio',
      'currentUser/canEditSpace',
      'currentUser/isSignedIn',
      'currentUser/totalFiltersActive'
    ]),
    currentSpaceIsHidden () { return this.$store.state.currentSpace.isHidden },
    kinopioDomain () { return consts.kinopioDomain() },
    userSettingsIsVisible () { return this.$store.state.userSettingsIsVisible },
    isVisible () {
      if (this.isPresentationMode) { return }
      if (this.isAddPage) { return }
      const contentDialogIsVisible = this.cardDetailsIsVisibleForCardId || this.connectionDetailsIsVisibleForConnectionId
      if (contentDialogIsVisible && this.isTouchDevice && !this.sidebarIsVisible) {
        return false
      } else {
        return true
      }
    },
    isSpace () {
      const isOther = this.isEmbedMode || this.isAddPage
      const isSpace = !isOther
      return isSpace
    },
    currentSpaceUrl () { return this['currentSpace/url'] },
    shouldShowNewStuffIsUpdated () {
      const isNotDefaultSpace = !this['currentSpace/isHelloKinopio']
      return this.newStuffIsUpdated && isNotDefaultSpace && this.userCanEditSpace
    },
    userCanEditSpace () { return this['currentUser/canEditSpace']() },
    userIsUpgraded () { return this.currentUser.isUpgraded },
    currentSpaceName () {
      const id = this.currentSpace.id
      const name = this.currentSpace.name
      if (name) {
        return name
      } else {
        return `Space ${id}`
      }
    },
    currentUserIsSignedIn () {
      return this['currentUser/isSignedIn']
    },
    spaceHasStatus () {
      if (!this.isOnline) { return }
      return this.isLoadingSpace || this.isJoiningSpace || this.isReconnectingToBroadcast || this.isLoadingOtherItems
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
    currentSpaceIsTemplate () {
      const currentSpace = this.currentSpace
      if (currentSpace.isTemplate) { return true }
      const templateSpaceIds = templates.spaces().map(space => space.id)
      return templateSpaceIds.includes(currentSpace.id)
    },
    currentSpaceIsFromTweet () {
      return this.currentSpace.isFromTweet
    },
    currentSpaceIsInbox () {
      return this.currentSpace.name === 'Inbox'
    },
    shouldShowInExplore () {
      if (this.currentSpace.privacy === 'private') { return false }
      return this.currentSpace.showInExplore
    },
    notificationsUnreadCount () {
      if (!this.notifications) { return 0 }
      const unread = this.notifications.filter(notification => !notification.isRead)
      return unread.length || 0
    },
    searchResultsCount () { return this.searchResultsCards.length },
    totalFiltersActive () { return this['currentUser/totalFiltersActive'] },
    searchResultsOrFilters () {
      if (this.searchResultsCount || this.totalFiltersActive) {
        return true
      } else {
        return false
      }
    },
    controlsSettingsIsVisible () {
      return this.$store.state.controlsSettingsIsPinned
    },
    pricingIsVisible () {
      return this.$store.state.pricingIsVisible
    },
    isFadingOut () { return this.$store.state.isFadingOutDuringTouch },
    prevSpaceId () {
      const spaceId = this.$store.state.prevSpaceIdInSession
      return spaceId && spaceId !== this.currentSpace.id
    }
  },
  methods: {
    changeToPrevSpace () {
      const id = this.$store.state.currentSpace.id
      this.$store.dispatch('currentSpace/loadPrevSpaceInSession')
      this.$store.commit('prevSpaceIdInSession', id)
    },
    openKinopio () {
      const url = this.currentSpaceUrl
      const title = `${this.currentSpaceName} – Kinopio`
      window.open(url, title)
    },
    showCardDetails (card) {
      this.$store.dispatch('currentCards/showCardDetails', card.id)
      this.$store.commit('previousResultItem', card)
    },
    showNextSearchCard () {
      if (!this.search) { return }
      const cards = this.searchResultsCards
      if (!this.previousResultItem.id) {
        this.showCardDetails(cards[0])
        return
      }
      const currentIndex = cards.findIndex(card => card.id === this.previousResultItem.id)
      let index = currentIndex + 1
      if (cards.length === index) {
        index = 0
      }
      this.showCardDetails(cards[index])
    },
    showPreviousSearchCard () {
      if (!this.search) { return }
      const cards = this.searchResultsCards
      if (!this.previousResultItem.id) {
        this.showCardDetails(cards[0])
        return
      }
      const currentIndex = cards.findIndex(card => card.id === this.previousResultItem.id)
      let index = currentIndex - 1
      if (index < 0) {
        index = cards.length - 1
      }
      this.showCardDetails(cards[index])
    },
    clearSearchAndFilters () {
      this.$store.dispatch('closeAllDialogs')
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
      this.spaceDetailsInfoIsVisible = false
      this.signUpOrInIsVisible = false
      this.shareIsVisible = false
      this.keyboardShortcutsIsVisible = false
      this.appsAndExtensionsIsVisible = false
      this.upgradeUserIsVisible = false
      this.donateIsVisible = false
      this.spaceStatusIsVisible = false
      this.offlineIsVisible = false
      this.notificationsIsVisible = false
      this.addSpaceIsVisible = false
      this.templatesIsVisible = false
      this.earnCreditsIsVisible = false
      this.importIsVisible = false
      if (!this.spaceDetailsIsPinned) {
        this.spaceDetailsIsVisible = false
      }
      if (!this.sidebarIsPinned) {
        this.sidebarIsVisible = false
      }
    },
    togglePricingIsVisible () {
      const value = !this.pricingIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('pricingIsVisible', value)
    },
    toggleAboutIsVisible () {
      const isVisible = this.aboutIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.aboutIsVisible = !isVisible
    },
    toggleSpaceDetailsIsVisible () {
      const isVisible = this.spaceDetailsIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.spaceDetailsIsVisible = !isVisible
    },
    toggleSignUpOrInIsVisible () {
      const isVisible = this.signUpOrInIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.signUpOrInIsVisible = !isVisible
    },
    toggleShareIsVisible () {
      const isVisible = this.shareIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.shareIsVisible = !isVisible
    },
    toggleNotificationsIsVisible () {
      const isVisible = this.notificationsIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.notificationsIsVisible = !isVisible
      if (this.notificationsIsVisible) {
        this.updateNotifications()
      }
    },
    toggleAddSpaceIsVisible () {
      const isVisible = this.addSpaceIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.addSpaceIsVisible = !isVisible
    },
    toggleSidebarIsVisible () {
      const isVisible = this.sidebarIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.sidebarIsVisible = !isVisible
    },
    toggleSpaceStatusIsVisible () {
      const isVisible = this.spaceStatusIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.spaceStatusIsVisible = !isVisible
    },
    toggleOfflineIsVisible () {
      const isVisible = this.offlineIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.offlineIsVisible = !isVisible
    },
    toggleSearchIsVisible () {
      const isVisible = this.searchIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('searchIsVisible', !isVisible)
    },
    setLoadingSignUpOrIn (value) {
      this.loadingSignUpOrIn = value
    },
    toggleUpgradeUserIsVisible () {
      const isVisible = this.upgradeUserIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.upgradeUserIsVisible = !isVisible
    },

    // hide

    hidden (event) {
      if (!this.isTouchDevice) { return }
      hiddenIteration = 0
      if (hiddenTimer) { return }
      hiddenTimer = window.requestAnimationFrame(this.hiddenFrame)
    },
    hiddenFrame () {
      hiddenIteration++
      this.isHidden = true
      if (hiddenIteration < hiddenDuration) {
        window.requestAnimationFrame(this.hiddenFrame)
      } else {
        this.cancelHidden()
      }
    },
    cancelHidden () {
      window.cancelAnimationFrame(hiddenTimer)
      hiddenTimer = undefined
      this.isHidden = false
    },

    // fade out

    fadeOut () {
      fadeOutIteration = 0
      if (fadeOutTimer) { return }
      shouldCancelFadeOut = false
      fadeOutTimer = window.requestAnimationFrame(this.fadeOutFrame)
    },
    cancelFadeOut () {
      window.cancelAnimationFrame(fadeOutTimer)
      fadeOutTimer = undefined
      this.$store.commit('isFadingOutDuringTouch', false)
      this.cancelUpdatePosition()
      this.updatePosition()
    },
    fadeOutFrame () {
      fadeOutIteration++
      this.$store.commit('isFadingOutDuringTouch', true)
      if (shouldCancelFadeOut) {
        this.cancelFadeOut()
      } else if (fadeOutIteration < fadeOutDuration) {
        window.requestAnimationFrame(this.fadeOutFrame)
      }
    },

    // update position

    updatePosition () {
      if (!this.isTouchDevice) { return }
      updatePositionIteration = 0
      if (updatePositionTimer) { return }
      updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
    },
    cancelUpdatePosition () {
      window.cancelAnimationFrame(updatePositionTimer)
      updatePositionTimer = undefined
    },
    updatePositionFrame () {
      updatePositionIteration++
      this.updatePositionInVisualViewport()
      if (updatePositionIteration < updatePositionDuration) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        this.cancelUpdatePosition()
      }
    },
    updatePositionInVisualViewport () {
      const viewport = utils.visualViewport()
      const scale = utils.roundFloat(viewport.scale)
      const counterScale = utils.roundFloat(1 / viewport.scale)
      const left = Math.round(viewport.offsetLeft)
      const top = Math.round(viewport.offsetTop)
      let style = {
        transform: `translate(${left}px, ${top}px) scale(${counterScale})`,
        maxWidth: Math.round(viewport.width * scale) + 'px'
      }
      if (utils.isIPhone() && scale <= 1) {
        style.transform = 'none'
        style.zoom = counterScale
      }
      this.position = style
    },

    // notifications

    async updateNotifications () {
      this.notificationsIsLoading = true
      const notifications = await this.$store.dispatch('api/getNotifications') || []
      this.notifications = sortBy(notifications, 'isRead')
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
    },
    disablePresentationMode () {
      this.$store.commit('isPresentationMode', false)
    }
  },
  watch: {
    isPinchZooming (value) {
      if (value) {
        this.fadeOut()
        this.updatePosition()
      } else {
        shouldCancelFadeOut = true
        this.cancelFadeOut()
      }
    },
    isTouchScrolling (value) {
      if (value) {
        this.fadeOut()
        this.updatePosition()
      } else {
        shouldCancelFadeOut = true
        this.cancelFadeOut()
      }
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
  z-index var(--max-z - 1)
  width 100%
  padding 8px
  display flex
  justify-content space-between
  transition 0.2s opacity
  transform-origin left top
  nav,
  aside
    pointer-events none
    position relative
    display -webkit-box
    > *
      pointer-events all
  nav
    display flex
    justify-content space-between
    width 100%
  .logo-about
    position relative
    display inline-block
    margin-right 6px
  .logo
    cursor pointer
    display flex
      .label-badge
        bottom -2px
    img
      vertical-align middle
    .down-arrow
      padding-left 2px
      opacity 0.5
    .label-badge
      transform translateY(10px)
    &:active,
    &.active
      .down-arrow
        transform translateY(2px)

  .embed-nav
    .logo
      display inline-flex
      vertical-align -3px
      margin-right 5px
      > .logo-image
        min-width initial
        width 17px
        height 15px

  .search-button
    .badge
      margin-right 0
      margin-left 6px
      vertical-align 0
    > .time
      margin-left 5px
      vertical-align 0
      height 11px
    > .search
      vertical-align 0

  .space-details-row
    button
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
    .space-name-button
      max-width 100%
      .icon.templates,
      .icon.tweet
        margin-right 4px
      .icon.tweet
        vertical-align -1px
    dialog
      max-width initial
    > .button-wrap
      max-width 58vw
      @media(max-width 550px)
        max-width 31vw
      > button
        .privacy-icon
          margin-left 6px

  // should not bubble down into dialogs
  .space-details-row,
  .space-functions-row
    > .segmented-buttons,
    &.segmented-buttons
      display inline-block
      > .button-wrap
        > button
          border-radius 0
          border-right 0
          .loader
            margin 0
        &:first-child
          > button
            border-top-left-radius var(--entity-radius)
            border-bottom-left-radius var(--entity-radius)
            border-right 0
        &:last-child
          > button
            border-top-right-radius var(--entity-radius)
            border-bottom-right-radius var(--entity-radius)
            border-right 1px solid var(--primary-border)

  .left,
  .right
    pointer-events none
    button,
    .logo-about,
    .user
      pointer-events auto

  .space-functions-row
    margin-bottom 6px
    position relative
    .search-count-badge
      margin 0

  .add-space-functions
    display inline-block
    margin-right 6px

  aside
    display flex
    flex-direction column
  .left
    display flex
    flex-shrink 0

    @media(max-width 414px)
      max-width calc(100% - 100px)

  .right
    display flex
    flex-shrink 0

  .controls
    display inline-table
    .button-wrap + .button-wrap
      margin-left 6px

  .top-controls
    display flex
    justify-content flex-end

  .bottom-controls
    margin-top 6px
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
    .view-hidden
      margin-left 5px

  .read-only-badge-wrap
    min-width 63px
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

  .icon.offline
    height 13px
    vertical-align -2px

  .inbox-icon
    margin-right 4px
    width 12px
    vertical-align 0

  .icon.sidebar
    vertical-align -1px

  .badge.space-status-success
    margin 0
    padding 0 7px
    border-radius 10px
    vertical-align 0

  .no-padding
    padding 0 !important

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

.presentation-header
  flex-direction row-reverse
  button
    pointer-events all
</style>
