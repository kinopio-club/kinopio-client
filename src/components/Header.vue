<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import About from '@/components/dialogs/About.vue'
import SpaceDetails from '@/components/dialogs/SpaceDetails.vue'
import SpaceDetailsInfo from '@/components/dialogs/SpaceDetailsInfo.vue'
import SpaceStatus from '@/components/dialogs/SpaceStatus.vue'
import Offline from '@/components/dialogs/Offline.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import User from '@/components/User.vue'
import SignUpOrIn from '@/components/dialogs/SignUpOrIn.vue'
import UpdatePassword from '@/components/dialogs/UpdatePassword.vue'
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
import ImportExport from '@/components/dialogs/ImportExport.vue'
import Pricing from '@/components/dialogs/Pricing.vue'
import SpaceTodayJournalBadge from '@/components/SpaceTodayJournalBadge.vue'
import DiscoveryButtons from '@/components/DiscoveryButtons.vue'
import UserSettings from '@/components/dialogs/UserSettings.vue'
import SpaceUserList from '@/components/dialogs/SpaceUserList.vue'
import CommentButtons from '@/components/CommentButtons.vue'
import FavoriteSpaceButton from '@/components/FavoriteSpaceButton.vue'
import consts from '@/consts.js'

import sortBy from 'lodash-es/sortBy'
const store = useStore()

let updateNotificationsIntervalTimer

const fadeOutDuration = 10
const hiddenDuration = 20
const updatePositionDuration = 60
let fadeOutIteration, fadeOutTimer, hiddenIteration, hiddenTimer, updatePositionIteration, updatePositionTimer, shouldCancelFadeOut

const readOnlyElement = ref(null)

onMounted(() => {
  window.addEventListener('scroll', updatePosition)
  updatePosition()
  updateNotifications()
  store.commit('isLoadingSpace', true)
  updateNotificationsIntervalTimer = setInterval(() => {
    updateNotifications()
  }, 1000 * 60 * 10) // 10 minutes
  store.subscribe((mutation, state) => {
    if (mutation.type === 'closeAllDialogs') {
      closeAllDialogs()
    } else if (mutation.type === 'triggerSpaceDetailsVisible') {
      updateSpaceDetailsIsVisible(true)
    } else if (mutation.type === 'triggerUpdateHeaderAndFooterPosition') {
      updatePosition()
    } else if (mutation.type === 'triggerSpaceDetailsInfoIsVisible') {
      updateSpaceDetailsInfoIsVisible(true)
    } else if (mutation.type === 'triggerSignUpOrInIsVisible') {
      updateSignUpOrInIsVisible(true)
    } else if (mutation.type === 'triggerAppsAndExtensionsIsVisible') {
      updateAppsAndExtensionsIsVisible(true)
    } else if (mutation.type === 'triggerKeyboardShortcutsIsVisible') {
      updateKeyboardShortcutsIsVisible(true)
    } else if (mutation.type === 'triggerUpgradeUserIsVisible') {
      updateUpgradeUserIsVisible(true)
    } else if (mutation.type === 'triggerDonateIsVisible') {
      updateDonateIsVisible(true)
    } else if (mutation.type === 'currentUserIsPainting') {
      if (state.currentUserIsPainting) {
        addReadOnlyJiggle()
      }
    } else if (mutation.type === 'triggerReadOnlyJiggle') {
      addReadOnlyJiggle()
    } else if (mutation.type === 'triggerUpdateNotifications' || mutation.type === 'triggerUserIsLoaded') {
      updateNotifications()
    } else if (mutation.type === 'triggerShowNextSearchCard') {
      showNextSearchCard()
    } else if (mutation.type === 'triggerShowPreviousSearchCard') {
      showPreviousSearchCard()
    } else if (mutation.type === 'triggerHideTouchInterface') {
      hidden()
    } else if (mutation.type === 'triggerTemplatesIsVisible') {
      updateTemplatesIsVisible(true)
    } else if (mutation.type === 'triggerRemovedIsVisible' || mutation.type === 'triggerAIImagesIsVisible') {
      updateSidebarIsVisible(true)
    } else if (mutation.type === 'triggerImportIsVisible') {
      updateImportIsVisible(true)
    } else if (mutation.type === 'triggerAddSpaceIsVisible') {
      updateAddSpaceIsVisible(true)
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePosition)
  clearInterval(updateNotificationsIntervalTimer)
})

const state = reactive({
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
  position: {},
  readOnlyJiggle: false,
  notifications: [],
  notificationsIsLoading: true,
  addSpaceIsVisible: false,
  isHidden: false,
  templatesIsVisible: false,
  sidebarIsVisible: false,
  donateIsVisible: false,
  importIsVisible: false
})

const isPinchZooming = computed(() => store.state.isPinchZooming)
watch(() => isPinchZooming.value, (value, prevValue) => {
  if (value) {
    fadeOut()
    updatePosition()
  } else {
    shouldCancelFadeOut = true
    cancelFadeOut()
  }
})
const isTouchScrolling = computed(() => store.state.isTouchScrolling)
watch(() => isTouchScrolling.value, (value, prevValue) => {
  if (value) {
    fadeOut()
    updatePosition()
  } else {
    shouldCancelFadeOut = true
    cancelFadeOut()
  }
})

const importArenaChannelIsVisible = computed(() => store.state.importArenaChannelIsVisible)
const kinopioDomain = computed(() => consts.kinopioDomain())
const userSettingsIsVisible = computed(() => store.state.userSettingsIsVisible)
const isSpace = computed(() => {
  const isOther = isEmbedMode.value || store.state.isAddPage
  const isSpace = !isOther
  return isSpace
})
const userCanEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const userCanOnlyComment = computed(() => store.getters['currentUser/canOnlyComment']())
const userIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const isOnline = computed(() => store.state.isOnline)
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const isMobile = computed(() => utils.isMobile())

// new stuff

const shouldShowBlogPostsIsUpdated = computed(() => {
  const isNotDefaultSpace = !store.getters['currentSpace/isHelloKinopio']
  return store.state.blogPostsIsUpdated && isNotDefaultSpace && userCanEditSpace.value
})

// current space

const currentSpaceUrl = computed(() => store.getters['currentSpace/url'])
const currentSpace = computed(() => store.state.currentSpace)
const currentSpaceIsHidden = computed(() => currentSpace.value.isHidden)
const currentSpaceName = computed(() => {
  const id = currentSpace.value.id
  const name = currentSpace.value.name
  if (name) {
    return name
  } else {
    return `Space ${id}`
  }
})
const spaceHasStatus = computed(() => {
  if (!isOnline.value) { return }
  return store.state.isLoadingSpace || store.state.isJoiningSpace || store.state.isReconnectingToBroadcast || store.state.isLoadingOtherItems
})
const spaceHasStatusAndStatusDialogIsNotVisible = computed(() => {
  if (spaceHasStatus.value) {
    return true
  } else if (state.spaceStatusIsVisible) {
    return true
  } else {
    return false
  }
})
const currentSpaceIsTemplate = computed(() => {
  if (currentSpace.value.isTemplate) { return true }
  const templateSpaceIds = templates.spaces().map(space => space.id)
  return templateSpaceIds.includes(currentSpace.value.id)
})
const currentSpaceIsFromTweet = computed(() => currentSpace.value.isFromTweet)
const currentSpaceIsInbox = computed(() => currentSpace.value.name === 'Inbox')
const shouldShowInExplore = computed(() => {
  if (currentSpace.value.privacy === 'private') { return false }
  return currentSpace.value.showInExplore
})
const backButtonIsVisible = computed(() => {
  const spaceId = store.state.prevSpaceIdInSession
  return spaceId && spaceId !== currentSpace.value.id
})
const changeToPrevSpace = () => {
  store.dispatch('closeAllDialogs')
  const id = currentSpace.value.id
  store.dispatch('currentSpace/loadPrevSpaceInSession')
  store.commit('prevSpaceIdInSession', id)
}

// search filters

const searchResultsCount = computed(() => store.state.searchResultsCards.length)
const totalFiltersActive = computed(() => store.getters['currentUser/totalFiltersActive'])
const searchResultsOrFilters = computed(() => {
  if (searchResultsCount.value || totalFiltersActive.value) {
    return true
  } else {
    return false
  }
})
const showCardDetails = (card) => {
  store.dispatch('currentCards/showCardDetails', card.id)
  store.commit('previousResultItem', card)
}
const showNextSearchCard = () => {
  if (!store.state.search) { return }
  const cards = store.state.searchResultsCards
  if (!store.state.previousResultItem.id) {
    showCardDetails(cards[0])
    return
  }
  const currentIndex = cards.findIndex(card => card.id === store.state.previousResultItem.id)
  let index = currentIndex + 1
  if (cards.length === index) {
    index = 0
  }
  showCardDetails(cards[index])
}
const showPreviousSearchCard = () => {
  if (!store.state.search) { return }
  const cards = store.state.searchResultsCards
  if (!store.state.previousResultItem.id) {
    showCardDetails(cards[0])
    return
  }
  const currentIndex = cards.findIndex(card => card.id === store.state.previousResultItem.id)
  let index = currentIndex - 1
  if (index < 0) {
    index = cards.length - 1
  }
  showCardDetails(cards[index])
}
const clearSearchAndFilters = () => {
  store.dispatch('closeAllDialogs')
  store.commit('clearSearch')
  store.dispatch('clearAllFilters')
}

// notifications

const notificationsUnreadCount = computed(() => {
  if (!state.notifications) { return 0 }
  const unread = state.notifications.filter(notification => !notification.isRead)
  return unread.length || 0
})

// embed

const isEmbedMode = computed(() => store.state.isEmbedMode)
const openKinopio = () => {
  const url = currentSpaceUrl.value
  const title = `${currentSpaceName.value} – Kinopio`
  window.open(url, title)
}

// interactions

const addReadOnlyJiggle = () => {
  const element = readOnlyElement.value
  if (!element) { return }
  state.readOnlyJiggle = true
  element.addEventListener('animationend', removeReadOnlyJiggle, false)
}
const removeReadOnlyJiggle = () => {
  state.readOnlyJiggle = false
}

// visible

const isVisible = computed(() => {
  if (isPresentationMode.value) { return }
  if (store.state.isAddPage) { return }
  const contentDialogIsVisible = store.state.cardDetailsIsVisibleForCardId || store.state.connectionDetailsIsVisibleForConnectionId
  if (contentDialogIsVisible && store.getters.isTouchDevice && !state.sidebarIsVisible) {
    return false
  } else {
    return true
  }
})
const offlineIsVisible = computed(() => store.state.offlineIsVisible)
const closeAllDialogs = () => {
  state.aboutIsVisible = false
  state.spaceDetailsInfoIsVisible = false
  state.signUpOrInIsVisible = false
  state.shareIsVisible = false
  state.keyboardShortcutsIsVisible = false
  state.appsAndExtensionsIsVisible = false
  state.upgradeUserIsVisible = false
  state.donateIsVisible = false
  state.spaceStatusIsVisible = false
  state.notificationsIsVisible = false
  state.addSpaceIsVisible = false
  state.templatesIsVisible = false
  state.importIsVisible = false
  if (!store.state.spaceDetailsIsPinned) {
    state.spaceDetailsIsVisible = false
  }
  if (!store.state.sidebarIsPinned) {
    state.sidebarIsVisible = false
  }
}
const pricingIsVisible = computed(() => store.state.pricingIsVisible)
const updateAppsAndExtensionsIsVisible = (value) => {
  state.appsAndExtensionsIsVisible = value
}
const updateKeyboardShortcutsIsVisible = (value) => {
  state.keyboardShortcutsIsVisible = value
}
const updateDonateIsVisible = (value) => {
  state.donateIsVisible = value
}
const updateTemplatesIsVisible = (value) => {
  state.templatesIsVisible = value
}
const updateImportIsVisible = (value) => {
  state.importIsVisible = value
}
const updateSpaceDetailsInfoIsVisible = (value) => {
  state.spaceDetailsInfoIsVisible = value
}
const togglePricingIsVisible = () => {
  const value = !pricingIsVisible.value
  store.dispatch('closeAllDialogs')
  store.commit('pricingIsVisible', value)
}
const toggleAboutIsVisible = () => {
  const isVisible = state.aboutIsVisible
  store.dispatch('closeAllDialogs')
  state.aboutIsVisible = !isVisible
}
const updateSpaceDetailsIsVisible = (value) => {
  state.spaceDetailsIsVisible = value
}
const toggleSpaceDetailsIsVisible = () => {
  const isVisible = state.spaceDetailsIsVisible
  store.dispatch('closeAllDialogs')
  state.spaceDetailsIsVisible = !isVisible
}
const updateSignUpOrInIsVisible = (value) => {
  state.signUpOrInIsVisible = value
}
const toggleSignUpOrInIsVisible = () => {
  const isVisible = state.signUpOrInIsVisible
  store.dispatch('closeAllDialogs')
  state.signUpOrInIsVisible = !isVisible
}
const toggleShareIsVisible = () => {
  const isVisible = state.shareIsVisible
  store.dispatch('closeAllDialogs')
  state.shareIsVisible = !isVisible
}
const toggleNotificationsIsVisible = () => {
  const isVisible = state.notificationsIsVisible
  store.dispatch('closeAllDialogs')
  state.notificationsIsVisible = !isVisible
  if (state.notificationsIsVisible) {
    updateNotifications()
  }
}
const updateAddSpaceIsVisible = (value) => {
  state.addSpaceIsVisible = value
}
const toggleAddSpaceIsVisible = () => {
  const isVisible = state.addSpaceIsVisible
  store.dispatch('closeAllDialogs')
  state.addSpaceIsVisible = !isVisible
}
const updateSidebarIsVisible = (value) => {
  state.sidebarIsVisible = value
}
const toggleSidebarIsVisible = () => {
  const isVisible = state.sidebarIsVisible
  store.dispatch('closeAllDialogs')
  state.sidebarIsVisible = !isVisible
}
const toggleSpaceStatusIsVisible = () => {
  const isVisible = state.spaceStatusIsVisible
  store.dispatch('closeAllDialogs')
  state.spaceStatusIsVisible = !isVisible
}
const toggleOfflineIsVisible = () => {
  const isVisible = store.state.offlineIsVisible
  store.dispatch('closeAllDialogs')
  store.commit('offlineIsVisible', !isVisible)
}
const searchAndFilterTitle = computed(() => `Search and Filter (${utils.metaKey()}-F)`)
const searchIsVisible = computed(() => store.state.searchIsVisible)
const toggleSearchIsVisible = () => {
  const isVisible = searchIsVisible.value
  store.dispatch('closeAllDialogs')
  store.commit('searchIsVisible', !isVisible)
}
const setLoadingSignUpOrIn = (value) => {
  state.loadingSignUpOrIn = value
}
const updateUpgradeUserIsVisible = (value) => {
  state.upgradeUserIsVisible = value
}
const toggleUpgradeUserIsVisible = () => {
  const isVisible = state.upgradeUserIsVisible
  store.dispatch('closeAllDialogs')
  state.upgradeUserIsVisible = !isVisible
}

// hide

const hidden = (event) => {
  if (!store.getters.isTouchDevice) { return }
  hiddenIteration = 0
  if (hiddenTimer) { return }
  hiddenTimer = window.requestAnimationFrame(hiddenFrame)
}
const hiddenFrame = () => {
  hiddenIteration++
  state.isHidden = true
  if (hiddenIteration < hiddenDuration) {
    window.requestAnimationFrame(hiddenFrame)
  } else {
    cancelHidden()
  }
}
const cancelHidden = () => {
  window.cancelAnimationFrame(hiddenTimer)
  hiddenTimer = undefined
  state.isHidden = false
}

// fade out

const isFadingOut = computed(() => store.state.isFadingOutDuringTouch)
const fadeOut = () => {
  fadeOutIteration = 0
  if (fadeOutTimer) { return }
  shouldCancelFadeOut = false
  fadeOutTimer = window.requestAnimationFrame(fadeOutFrame)
}
const cancelFadeOut = () => {
  window.cancelAnimationFrame(fadeOutTimer)
  fadeOutTimer = undefined
  store.commit('isFadingOutDuringTouch', false)
  cancelUpdatePosition()
  updatePosition()
}
const fadeOutFrame = () => {
  fadeOutIteration++
  store.commit('isFadingOutDuringTouch', true)
  if (shouldCancelFadeOut) {
    cancelFadeOut()
  } else if (fadeOutIteration < fadeOutDuration) {
    window.requestAnimationFrame(fadeOutFrame)
  }
}

// position

const updatePosition = () => {
  if (!store.getters.isTouchDevice) { return }
  updatePositionIteration = 0
  if (updatePositionTimer) { return }
  updatePositionTimer = window.requestAnimationFrame(updatePositionFrame)
}
const cancelUpdatePosition = () => {
  window.cancelAnimationFrame(updatePositionTimer)
  updatePositionTimer = undefined
}
const updatePositionFrame = () => {
  updatePositionIteration++
  updatePositionInVisualViewport()
  if (updatePositionIteration < updatePositionDuration) {
    window.requestAnimationFrame(updatePositionFrame)
  } else {
    cancelUpdatePosition()
  }
}
const updatePositionInVisualViewport = () => {
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
  state.position = style
}

// notifications

const updateNotifications = async () => {
  state.notificationsIsLoading = true
  const notifications = await store.dispatch('api/getNotifications') || []
  state.notifications = sortBy(notifications, 'isRead')
  state.notificationsIsLoading = false
}
const markAllAsRead = () => {
  const notifications = state.notifications.filter(notification => !notification.isRead)
  const notificationIds = notifications.map(notification => notification.id)
  updateNotificationsIsRead(notificationIds)
}
const markAsRead = (notificationId) => {
  updateNotificationsIsRead([notificationId])
}
const updateNotificationsIsRead = (notificationIds) => {
  if (!notificationIds.length) { return }
  state.notifications = state.notifications.map(notification => {
    if (notificationIds.includes(notification.id)) {
      notification.isRead = true
    }
    return notification
  })
  store.dispatch('api/addToQueue', {
    name: 'updateNotificationsIsRead',
    body: notificationIds
  })
}
const disablePresentationMode = () => {
  store.commit('isPresentationMode', false)
}

// presentation mode

const isPresentationMode = computed(() => store.state.isPresentationMode)
const togglePresentationMode = () => {
  const value = !isPresentationMode.value
  store.commit('isPresentationMode', value)
}
</script>

<template lang="pug">
header.presentation-header(v-if="isPresentationMode" :style="state.position" :class="{'fade-out': isFadingOut}")
  button.active(@click="disablePresentationMode" :class="{ 'translucent-button': !shouldIncreaseUIContrast }")
    img.icon(src="@/assets/presentation.svg")
  SelectAllBelow

header(v-if="isVisible" :style="state.position" :class="{'fade-out': isFadingOut, 'hidden': state.isHidden}")
  //- embed
  nav.embed-nav(v-if="isEmbedMode")
    a(:href="currentSpaceUrl" @mousedown.left.stop="openKinopio" @touchstart.stop="openKinopio")
      button(:class="{ 'translucent-button': !shouldIncreaseUIContrast }")
        .logo
          .logo-image
        MoonPhase(v-if="currentSpace.moonPhase" :moonPhase="currentSpace.moonPhase")
        span {{currentSpaceName}}{{' '}}
        img.icon.visit(src="@/assets/visit.svg")
        //- embed badge
        .label-badge.space-name-badge-wrap
          span Scroll horizontally and vertically
    .right
      SpaceUsers(:userDetailsIsInline="true")

  //- standard
  nav(v-if="!isEmbedMode")
    .row
      .left
        //- About
        .logo-about
          .button-wrap
            .logo(alt="kinopio logo" @click.left.stop="toggleAboutIsVisible" @touchend.stop @mouseup.left.stop :class="{active: state.aboutIsVisible}" tabindex="0")
              .logo-image
                .label-badge.small-badge(v-if="shouldShowBlogPostsIsUpdated")
                  span NEW
              img.down-arrow(src="@/assets/down-arrow.svg")
            About(:visible="state.aboutIsVisible")
            KeyboardShortcuts(:visible="state.keyboardShortcutsIsVisible")
            Donate(:visible="state.donateIsVisible")
            AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
        .space-meta-rows
          .space-functions-row
            .segmented-buttons
              //- Add Space
              .button-wrap
                button.success(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: state.addSpaceIsVisible }")
                  img.icon.add(src="@/assets/add.svg")
                  span New
                AddSpace(:visible="state.addSpaceIsVisible" :shouldAddSpaceDirectly="true")
                Templates(:visible="state.templatesIsVisible")
            //- Search
            .segmented-buttons
              .button-wrap
                button.search-button(@click.stop="toggleSearchIsVisible" :class="{ active: searchIsVisible || totalFiltersActive || searchResultsCount, 'translucent-button': !shouldIncreaseUIContrast }" :title="searchAndFilterTitle")
                  template(v-if="!searchResultsCount")
                    img.icon.search(src="@/assets/search.svg")
                  .badge.search.search-count-badge(v-if="searchResultsCount")
                    img.icon.search(src="@/assets/search.svg")
                    span {{searchResultsCount}}
                  span.badge.info(v-if="totalFiltersActive")
                    img.icon(src="@/assets/filter.svg")
                    span {{totalFiltersActive}}
                Search(:visible="searchIsVisible")
              template(v-if="!isMobile")
                button(@click="showPreviousSearchCard" v-if="searchResultsCount" :class="{ 'translucent-button': !shouldIncreaseUIContrast }")
                  img.icon.left-arrow(src="@/assets/down-arrow.svg")
                button(@click="showNextSearchCard" v-if="searchResultsCount" :class="{ 'translucent-button': !shouldIncreaseUIContrast }")
                  img.icon.right-arrow(src="@/assets/down-arrow.svg")
              button(@click="clearSearchAndFilters" v-if="searchResultsOrFilters" :class="{ 'translucent-button': !shouldIncreaseUIContrast }")
                img.icon.cancel(src="@/assets/add.svg")
      .right
        //- Users
        SpaceUsers(:userDetailsIsInline="true")
        UserSettings
        UpdatePassword
        SpaceUserList
        //- Share
        .button-wrap
          button(@click.left.stop="toggleShareIsVisible" :class="{active: state.shareIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
            span Share
          Share(:visible="state.shareIsVisible")
        //- Notifications
        .button-wrap
          button(@click.left.stop="toggleNotificationsIsVisible" :class="{active: state.notificationsIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" title="Notifications")
            span {{notificationsUnreadCount}}
            .badge.new-unread-badge.notification-button-badge(v-if="notificationsUnreadCount")
          UserNotifications(:visible="state.notificationsIsVisible" :loading="state.notificationsIsLoading" :notifications="state.notifications" :unreadCount="notificationsUnreadCount" @markAllAsRead="markAllAsRead" @markAsRead="markAsRead")

    .row
      //- Current Space
      .left
        .space-details-row
          .segmented-buttons
            //- Back
            .button-wrap(v-if="backButtonIsVisible" title="Go Back" @click.stop="changeToPrevSpace")
              button(:class="{ 'translucent-button': !shouldIncreaseUIContrast }")
                img.icon.left-arrow(src="@/assets/down-arrow.svg")
            //- Current Space Name and Info
            .button-wrap.space-name-button-wrap(:class="{ 'back-button-is-visible': backButtonIsVisible }")
              button.space-name-button(@click.left.stop="toggleSpaceDetailsIsVisible" :class="{ active: state.spaceDetailsIsVisible, 'translucent-button': !shouldIncreaseUIContrast }")
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
              SpaceDetails(:visible="state.spaceDetailsIsVisible")
              ImportArenaChannel(:visible="importArenaChannelIsVisible")
              SpaceDetailsInfo(:visible="state.spaceDetailsInfoIsVisible")
              ImportExport(:visible="state.importIsVisible" :isImport="true")

              //- read only badge
              .label-badge.space-name-badge-wrap(v-if="!userCanEditSpace")
                span(:class="{'invisible': state.readOnlyJiggle}")
                  span Read Only
                span.invisible-badge(ref="readOnlyElement" :class="{'badge-jiggle': state.readOnlyJiggle, 'invisible': !state.readOnlyJiggle}")
                  span Read Only
              //- comment only badge
              .label-badge.space-name-badge-wrap(v-else-if="userCanOnlyComment")
                span(:class="{'invisible': state.readOnlyJiggle}")
                  span Comment Only

              //- Loading State
              .button-wrap.space-status-button-wrap(v-if="spaceHasStatusAndStatusDialogIsNotVisible")
                button.small-button(@click.left.stop="toggleSpaceStatusIsVisible" :class="{active: state.spaceStatusIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
                  Loader(:visible="spaceHasStatus")
                  .badge.success.space-status-success(v-if="!spaceHasStatus")
                SpaceStatus(:visible="state.spaceStatusIsVisible")
            //- favorite
            FavoriteSpaceButton(v-if="isOnline")
            //- Offline
            .button-wrap(v-if="!isOnline")
              button(@click.left.stop="toggleOfflineIsVisible" :class="{ active: offlineIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
                img.icon.offline(src="@/assets/offline.svg")
              Offline(:visible="offlineIsVisible")
      .right
        DiscoveryButtons
        //- Sidebar
        .button-wrap
          button(@click.left.stop="toggleSidebarIsVisible" :class="{active: state.sidebarIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" title="Sidebar")
            img.icon.sidebar(src="@/assets/sidebar.svg")
          Sidebar(:visible="state.sidebarIsVisible")

    .row
      .left
      .right
        //- Pricing
        .button-wrap.pricing-button-wrap(v-if="!userIsUpgraded")
          button(@click.left.stop="togglePricingIsVisible" :class="{active: pricingIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
            span Pricing
          Pricing(:visible="pricingIsVisible")
        //- Sign Up or In
        .button-wrap(v-if="!currentUserIsSignedIn && isOnline")
          button(@click.left.stop="toggleSignUpOrInIsVisible" :class="{active: state.signUpOrInIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
            span Sign Up or In
            Loader(:visible="state.loadingSignUpOrIn")
          SignUpOrIn(:visible="state.signUpOrInIsVisible" @loading="setLoadingSignUpOrIn")
        //- Upgrade
        .button-wrap(v-if="!userIsUpgraded && isOnline && currentUserIsSignedIn")
          button(@click.left.stop="toggleUpgradeUserIsVisible" :class="{active: state.upgradeUserIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
            span Upgrade
          UpgradeUser(:visible="state.upgradeUserIsVisible" @closeDialog="closeAllDialogs")
        //- comments
        CommentButtons
        //- presentation mode
        .button-wrap
          button(:class="{ 'translucent-button': !shouldIncreaseUIContrast }" @click="togglePresentationMode" title="Focus/Presentation Mode (P)")
            img.icon(src="@/assets/presentation.svg")

  Toolbar(:visible="isSpace")
  SelectAllBelow
</template>

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
    button
      pointer-events all
    > .row
      width 100%
      display flex
      justify-content space-between
      // 2nd row onwards
      margin-top 6px
      margin-left 52px
      @media(max-width 550px)
        margin-left 42px
      // 1st row
      &:first-child
        margin-top 0
        margin-left 0
      .left
        display flex
        flex-shrink 0
      .right
        display flex
        justify-content flex-end
        max-width 100%

  nav
    display flex
    justify-content space-between
    flex-wrap wrap
    width 100%

  .logo-about
    pointer-events all
    position relative
    display inline-block
    margin-right 6px
    margin-bottom -6px
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
      @media(max-width 550px)
        display none
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
    .space-name-button-wrap
      max-width 55dvw
      @media(max-width 550px)
        max-width 35dvw
      &.back-button-is-visible
        @media(max-width 550px)
          max-width 31dvw
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

  .space-functions-row
    position relative
    .search-count-badge
      margin 0

  button
    .explore
      display inline-flex
      margin 0
      margin-left 6px
      width 16px
      vertical-align baseline
    .view-hidden
      margin-left 5px

  .space-name-badge-wrap
    min-width 63px
    width max-content
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
    vertical-align -1px

  .inbox-icon
    margin-right 4px
    width 12px
    vertical-align 0

  .icon.sidebar
    vertical-align -1px

  .badge.space-status-success
    width 16px
    height 16px
    border-radius 10px
    vertical-align 0
    margin 2px 2px
    min-height initial
    min-width initial
    display block

  .comment-mode-badge-wrap
    pointer-events none
    position absolute
    background-color var(--info-background)
    bottom -8px
    left initial
    right 5px
    z-index 1
    width 95px
    span
      width 100%
      color var(--primary)

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

.button-wrap.space-status-button-wrap
  position absolute
  top 4px
  right 4px
  left initial
  .loader
    margin 2px 2px
</style>
