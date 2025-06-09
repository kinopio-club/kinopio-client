<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import About from '@/components/dialogs/About.vue'
import SpaceDetails from '@/components/dialogs/SpaceDetails.vue'
import SpaceDetailsInfo from '@/components/dialogs/SpaceDetailsInfo.vue'
import SpaceStatus from '@/components/dialogs/SpaceStatus.vue'
import Offline from '@/components/dialogs/Offline.vue'
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
import Templates from '@/components/dialogs/Templates.vue'
import Sidebar from '@/components/dialogs/Sidebar.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'
import SelectAllBelow from '@/components/SelectAllBelow.vue'
import SelectAllRight from '@/components/SelectAllRight.vue'
import SpaceUsers from '@/components/SpaceUsers.vue'
import Donate from '@/components/dialogs/Donate.vue'
import Toolbar from '@/components/Toolbar.vue'
import ImportExport from '@/components/dialogs/ImportExport.vue'
import Pricing from '@/components/dialogs/Pricing.vue'
import UserSettings from '@/components/dialogs/UserSettings.vue'
import SpaceUserList from '@/components/dialogs/SpaceUserList.vue'
import CommentButton from '@/components/CommentButton.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import AddSpaceButton from '@/components/AddSpaceButton.vue'
import UserGroups from '@/components/dialogs/UserGroups.vue'
import consts from '@/consts.js'

import sortBy from 'lodash-es/sortBy'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const groupStore = useGroupStore()

let unsubscribes

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
  globalStore.isLoadingSpace = true
  updateNotificationsIntervalTimer = setInterval(() => {
    updateNotifications()
  }, 1000 * 60 * 10) // 10 minutes

  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs') {
        closeAllDialogs()
      } else if (name === 'triggerSpaceDetailsVisible') {
        updateSpaceDetailsIsVisible(true)
      } else if (name === 'triggerUpdateHeaderAndFooterPosition') {
        updatePosition()
      } else if (name === 'triggerSpaceDetailsInfoIsVisible') {
        updateSpaceDetailsInfoIsVisible(true)
      } else if (name === 'triggerSignUpOrInIsVisible') {
        updateSignUpOrInIsVisible(true)
      } else if (name === 'triggerAppsAndExtensionsIsVisible') {
        updateAppsAndExtensionsIsVisible(true)
      } else if (name === 'triggerKeyboardShortcutsIsVisible') {
        updateKeyboardShortcutsIsVisible(true)
      } else if (name === 'triggerUpgradeUserIsVisible') {
        updateUpgradeUserIsVisible(true)
      } else if (name === 'triggerDonateIsVisible') {
        updateDonateIsVisible(true)
      } else if (name === 'currentUserIsPainting') {
        if (state.currentUserIsPainting) {
          addReadOnlyJiggle()
        }
      } else if (name === 'triggerReadOnlyJiggle') {
        addReadOnlyJiggle()
      } else if (name === 'triggerUpdateNotifications' || name === 'triggerUserIsLoaded') {
        updateNotifications()
      } else if (name === 'triggerShowNextSearchCard') {
        showNextSearchCard()
      } else if (name === 'triggerShowPreviousSearchCard') {
        showPreviousSearchCard()
      } else if (name === 'triggerHideTouchInterface') {
        hidden()
      } else if (name === 'triggerTemplatesIsVisible') {
        updateTemplatesIsVisible(true)
      } else if (name === 'triggerRemovedIsVisible') {
        updateSidebarIsVisible(true)
      } else if (name === 'triggerImportIsVisible') {
        updateImportIsVisible(true)
      } else if (name === 'triggerClearUserNotifications') {
        clearNotifications()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePosition)
  clearInterval(updateNotificationsIntervalTimer)
  unsubscribes()
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
  isHidden: false,
  templatesIsVisible: false,
  sidebarIsVisible: false,
  donateIsVisible: false,
  importIsVisible: false
})

const isPinchZooming = computed(() => globalStore.isPinchZooming)
watch(() => isPinchZooming.value, (value, prevValue) => {
  if (value) {
    fadeOut()
    updatePosition()
  } else {
    shouldCancelFadeOut = true
    cancelFadeOut()
  }
})
const isTouchScrolling = computed(() => globalStore.isTouchScrolling)
watch(() => isTouchScrolling.value, (value, prevValue) => {
  if (value) {
    fadeOut()
    updatePosition()
  } else {
    shouldCancelFadeOut = true
    cancelFadeOut()
  }
})

const importArenaChannelIsVisible = computed(() => globalStore.importArenaChannelIsVisible)
const kinopioDomain = computed(() => consts.kinopioDomain())
const userSettingsIsVisible = computed(() => globalStore.userSettingsIsVisible)
const isSpace = computed(() => {
  const isOther = isEmbedMode.value || globalStore.isAddPage
  const isSpace = !isOther
  return isSpace
})
const userCanEditSpace = computed(() => userStore.getUserCanEditSpace)
const userCanOnlyComment = computed(() => userStore.getUserIsCommentOnly)
const isUpgraded = computed(() => userStore.isUpgraded)
const isOnline = computed(() => globalStore.isOnline)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const shouldIncreaseUIContrast = computed(() => userStore.shouldIncreaseUIContrast)
const isMobile = computed(() => utils.isMobile())
const toolbarIsVisible = computed(() => {
  if (!isSpace.value) { return }
  if (userCanOnlyComment.value) { return }
  return userCanEditSpace.value
})

// new stuff

const shouldShowChangelogIsUpdated = computed(() => {
  const isNotHelloSpace = !spaceStore.getSpaceIsHello
  return globalStore.changelogIsUpdated && isNotHelloSpace && userCanEditSpace.value
})

// current space

const currentSpaceUrl = computed(() => spaceStore.getSpaceUrl)
const currentSpaceIsHidden = computed(() => spaceStore.getSpaceIsHidden)
const currentSpaceName = computed(() => {
  const id = spaceStore.id
  const name = spaceStore.name
  if (name) {
    return name
  } else {
    return `Space ${id}`
  }
})
const spaceGroup = computed(() => groupStore.getCurrentSpaceGroup)
const spaceHasStatus = computed(() => {
  if (!isOnline.value) { return }
  return Boolean(globalStore.isLoadingSpace || globalStore.isJoiningSpace || globalStore.isReconnectingToBroadcast || globalStore.isLoadingOtherItems || globalStore.sendingQueue.length)
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
  if (spaceStore.isTemplate) { return true }
  const templateSpaceIds = templates.spaces().map(space => space.id)
  return templateSpaceIds.includes(spaceStore.id)
})
const currentSpaceIsInbox = computed(() => spaceStore.name === 'Inbox')
const shouldShowInExplore = computed(() => {
  if (spaceStore.getSpaceIsPrivate) { return false }
  return spaceStore.showInExplore
})
const backButtonIsVisible = computed(() => {
  const spaceId = globalStore.prevSpaceIdInSession
  return spaceId && spaceId !== spaceStore.id
})
const changeToPrevSpace = () => {
  globalStore.closeAllDialogs()
  const id = spaceStore.id
  spaceStore.loadPrevSpaceInSession()
  globalStore.updatePrevSpaceIdInSession = id
}

// search filters

const searchResultsCount = computed(() => globalStore.searchResultsCards.length)
const totalFiltersActive = computed(() => userStore.getUserTotalFiltersActive())
const searchResultsOrFilters = computed(() => {
  if (searchResultsCount.value || totalFiltersActive.value) {
    return true
  } else {
    return false
  }
})
const focusOnCard = (card) => {
  globalStore.updateFocusOnCardId(card.id)
  globalStore.previousResultItem = card
}
const showNextSearchCard = () => {
  if (!globalStore.search) { return }
  const cards = globalStore.searchResultsCards
  if (!globalStore.previousResultItem.id) {
    focusOnCard(cards[0])
    return
  }
  const currentIndex = cards.findIndex(card => card.id === globalStore.previousResultItem.id)
  let index = currentIndex + 1
  if (cards.length === index) {
    index = 0
  }
  focusOnCard(cards[index])
}
const showPreviousSearchCard = () => {
  if (!globalStore.search) { return }
  const cards = globalStore.searchResultsCards
  if (!globalStore.previousResultItem.id) {
    focusOnCard(cards[0])
    return
  }
  const currentIndex = cards.findIndex(card => card.id === globalStore.previousResultItem.id)
  let index = currentIndex - 1
  if (index < 0) {
    index = cards.length - 1
  }
  focusOnCard(cards[index])
}
const clearSearchAndFilters = () => {
  globalStore.closeAllDialogs()
  globalStore.clearSearch()
  globalStore.clearAllFilters()
}

// notifications

const notificationsUnreadCount = computed(() => {
  if (!state.notifications) { return 0 }
  const unread = state.notifications.filter(notification => !notification.isRead)
  return unread.length || 0
})

// embed

const isEmbedMode = computed(() => globalStore.isEmbedMode)
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

const isPresentationMode = computed(() => globalStore.isPresentationMode)
const isVisible = computed(() => {
  if (isPresentationMode.value) { return }
  if (globalStore.isAddPage) { return }
  const contentDialogIsVisible = globalStore.cardDetailsIsVisibleForCardId || globalStore.connectionDetailsIsVisibleForConnectionId
  if (contentDialogIsVisible && globalStore.getIsTouchDevice && !state.sidebarIsVisible) {
    return false
  } else {
    return true
  }
})
const offlineIsVisible = computed(() => globalStore.offlineIsVisible)
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
  state.templatesIsVisible = false
  state.importIsVisible = false
  if (!globalStore.spaceDetailsIsPinned) {
    state.spaceDetailsIsVisible = false
  }
  if (!globalStore.sidebarIsPinned) {
    state.sidebarIsVisible = false
  }
}
const pricingIsVisible = computed(() => globalStore.pricingIsVisible)
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
  globalStore.closeAllDialogs()
  globalStore.pricingIsVisible = value
}
const toggleAboutIsVisible = () => {
  const isVisible = state.aboutIsVisible
  globalStore.closeAllDialogs()
  state.aboutIsVisible = !isVisible
}
const updateSpaceDetailsIsVisible = (value) => {
  state.spaceDetailsIsVisible = value
}
const toggleSpaceDetailsIsVisible = () => {
  const isVisible = state.spaceDetailsIsVisible
  globalStore.closeAllDialogs()
  state.spaceDetailsIsVisible = !isVisible
}
const updateSignUpOrInIsVisible = (value) => {
  state.signUpOrInIsVisible = value
}
const toggleSignUpOrInIsVisible = () => {
  const isVisible = state.signUpOrInIsVisible
  globalStore.closeAllDialogs()
  state.signUpOrInIsVisible = !isVisible
}
const toggleShareIsVisible = () => {
  const isVisible = state.shareIsVisible
  globalStore.closeAllDialogs()
  state.shareIsVisible = !isVisible
}
const toggleNotificationsIsVisible = () => {
  const isVisible = state.notificationsIsVisible
  globalStore.closeAllDialogs()
  state.notificationsIsVisible = !isVisible
  if (state.notificationsIsVisible) {
    updateNotifications()
  }
}
const updateSidebarIsVisible = (value) => {
  state.sidebarIsVisible = value
}
const toggleSidebarIsVisible = () => {
  const isVisible = state.sidebarIsVisible
  globalStore.closeAllDialogs()
  state.sidebarIsVisible = !isVisible
}
const toggleSpaceStatusIsVisible = () => {
  const isVisible = state.spaceStatusIsVisible
  globalStore.closeAllDialogs()
  state.spaceStatusIsVisible = !isVisible
}
const toggleOfflineIsVisible = () => {
  const isVisible = globalStore.offlineIsVisible
  globalStore.closeAllDialogs()
  globalStore.offlineIsVisible = !isVisible
}
const searchAndFilterTitle = computed(() => `Search and Filter (${utils.metaKey()}-F)`)
const searchIsVisible = computed(() => globalStore.searchIsVisible)
const toggleSearchIsVisible = () => {
  const isVisible = searchIsVisible.value
  globalStore.closeAllDialogs()
  globalStore.searchIsVisible = !isVisible
}
const setLoadingSignUpOrIn = (value) => {
  state.loadingSignUpOrIn = value
}
const updateUpgradeUserIsVisible = (value) => {
  state.upgradeUserIsVisible = value
}
const toggleUpgradeUserIsVisible = () => {
  const isVisible = state.upgradeUserIsVisible
  globalStore.closeAllDialogs()
  state.upgradeUserIsVisible = !isVisible
}

// hide

const hidden = (event) => {
  if (!globalStore.getIsTouchDevice) { return }
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

const isFadingOut = computed(() => globalStore.isFadingOutDuringTouch)
const fadeOut = () => {
  fadeOutIteration = 0
  if (fadeOutTimer) { return }
  shouldCancelFadeOut = false
  fadeOutTimer = window.requestAnimationFrame(fadeOutFrame)
}
const cancelFadeOut = () => {
  window.cancelAnimationFrame(fadeOutTimer)
  fadeOutTimer = undefined
  globalStore.isFadingOutDuringTouch = false
  cancelUpdatePosition()
  updatePosition()
}
const fadeOutFrame = () => {
  fadeOutIteration++
  globalStore.isFadingOutDuringTouch = true
  if (shouldCancelFadeOut) {
    cancelFadeOut()
  } else if (fadeOutIteration < fadeOutDuration) {
    window.requestAnimationFrame(fadeOutFrame)
  }
}

// position

const updatePosition = () => {
  if (!globalStore.getIsTouchDevice) { return }
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
  const style = {
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
  const notifications = await apiStore.getNotifications() || []
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
const updateNotificationsIsRead = async (notificationIds) => {
  if (!notificationIds.length) { return }
  state.notifications = state.notifications.map(notification => {
    if (notificationIds.includes(notification.id)) {
      notification.isRead = true
    }
    return notification
  })
  await apiStore.addToQueue({
    name: 'updateNotificationsIsRead',
    body: notificationIds
  })
}
const clearNotifications = () => {
  state.notifications = []
}
</script>

<template lang="pug">
header(v-if="isVisible" :style="state.position" :class="{'fade-out': isFadingOut, 'hidden': state.isHidden}")
  //- embed
  nav.embed-nav(v-if="isEmbedMode")
    a(:href="currentSpaceUrl" @mousedown.left.stop="openKinopio" @touchstart.stop="openKinopio")
      button(:class="{ 'translucent-button': !shouldIncreaseUIContrast }")
        .logo
          .logo-image
        GroupLabel(:group="spaceGroup")
        span {{currentSpaceName}}{{' '}}
        img.icon.visit(src="@/assets/visit.svg")
        //- embed badge
        .label-badge.space-name-badge-wrap
          span Scroll horizontally and vertically
    .right
      SpaceUsers(:userDetailsIsInline="true")

  //- standard
  nav(v-if="!isEmbedMode")
    //- 1st row
    .row
      .left
        //- About
        .logo-about
          .button-wrap
            .logo(alt="kinopio logo" @click.left.stop="toggleAboutIsVisible" @touchend.stop @mouseup.left.stop :class="{active: state.aboutIsVisible}" tabindex="0")
              .logo-image
                .label-badge.small-badge(v-if="shouldShowChangelogIsUpdated")
                  span NEW

            About(:visible="state.aboutIsVisible")
            KeyboardShortcuts(:visible="state.keyboardShortcutsIsVisible")
            Templates(:visible="state.templatesIsVisible")
            Donate(:visible="state.donateIsVisible")
            AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
        .space-functions-row

          AddSpaceButton

          //- TODO SearchButtons
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
        UserGroups
        //- Share
        .button-wrap
          button(@click.left.stop="toggleShareIsVisible" :class="{active: state.shareIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
            span Share
          Share(:visible="state.shareIsVisible")
        .button-wrap
          .segmented-buttons
            //- Notifications
            button(@click.left.stop="toggleNotificationsIsVisible" :class="{active: state.notificationsIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" title="Notifications")
              span {{notificationsUnreadCount}}
              .badge.new-unread-badge.notification-button-badge(v-if="notificationsUnreadCount")
            //- Sidebar
            button(@click.left.stop="toggleSidebarIsVisible" :class="{active: state.sidebarIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" title="Sidebar")
              img.icon.sidebar(src="@/assets/sidebar.svg")
          Sidebar(:visible="state.sidebarIsVisible")
          UserNotifications(:visible="state.notificationsIsVisible" :loading="state.notificationsIsLoading" :notifications="state.notifications" :unreadCount="notificationsUnreadCount" @markAllAsRead="markAllAsRead" @markAsRead="markAsRead")

    //- 2nd row
    .row
      //- Current Space
      .left
        .space-functions-row

          //- TODO SpaceDetailsButton
          .segmented-buttons.space-details-button
            //- Back
            .button-wrap(v-if="backButtonIsVisible" title="Go Back" @click.stop="changeToPrevSpace")
              button(:class="{ 'translucent-button': !shouldIncreaseUIContrast }")
                img.icon.left-arrow(src="@/assets/down-arrow.svg")
            //- Name
            .button-wrap(:class="{ 'back-button-is-visible': backButtonIsVisible }")
              button(@click.left.stop="toggleSpaceDetailsIsVisible" :class="{ active: state.spaceDetailsIsVisible, 'translucent-button': !shouldIncreaseUIContrast }" title="Space Details and Spaces List")
                .button-contents(:class="{'space-is-hidden': currentSpaceIsHidden}")
                  GroupLabel(:group="spaceGroup")
                  //- span(v-if="currentSpaceIsTemplate")
                  //-   img.icon.templates(src="@/assets/templates.svg")
                  //- span
                  span.space-name {{currentSpaceName}}
                  //- PrivacyIcon(:privacy="currentSpace.privacy" :closedIsNotVisible="true")

                //- img.icon.sidebar.flip-left(src="@/assets/sidebar.svg" :class="{'space-is-hidden': currentSpaceIsHidden}")
                //- span as
              ImportArenaChannel(:visible="importArenaChannelIsVisible")
              SpaceDetails(:visible="state.spaceDetailsIsVisible")
              SpaceDetailsInfo(:visible="state.spaceDetailsInfoIsVisible")
              ImportExport(:visible="state.importIsVisible" :isImport="true")

              //- space name badges
              .label-badge-row.row
                //- .label-badge
                //-   PrivacyIcon(:privacy="currentSpace.privacy" :closedIsNotVisible="true" :isSmall="true")

                GroupLabel(:group="spaceGroup")
                //- inbox badge
                .label-badge.secondary(v-if="currentSpaceIsInbox")
                  img.icon.inbox-icon(src="@/assets/inbox.svg")
                //- template badge
                //- .label-badge
                //-   //- (v-if="currentSpaceIsTemplate")
                //-   img.icon.templates(src="@/assets/templates.svg")

                //- read only badge
                .label-badge(v-if="!userCanEditSpace")
                  span(:class="{'invisible': state.readOnlyJiggle}")
                    span Read Only
                  span.invisible-badge(ref="readOnlyElement" :class="{'badge-jiggle': state.readOnlyJiggle, 'invisible': !state.readOnlyJiggle}")
                    span Read Only
                //- comment only badge
                .label-badge.success(v-else-if="userCanOnlyComment")
                  span(:class="{'invisible': state.readOnlyJiggle}")
                    span Comment Only
                //- in explore badge
                .label-badge.secondary(v-if="shouldShowInExplore")
                  span
                    img.icon.sunglasses.explore(src="@/assets/sunglasses.svg")

              //- space status loader
              .button-wrap.space-status-button-wrap(v-if="spaceHasStatusAndStatusDialogIsNotVisible")
                button.small-button(@click.left.stop="toggleSpaceStatusIsVisible" :class="{active: state.spaceStatusIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
                  Loader(:visible="spaceHasStatus")
                  .badge.success.space-status-success(v-if="!spaceHasStatus")
                SpaceStatus(:visible="state.spaceStatusIsVisible")

            //- Offline
            .button-wrap(v-if="!isOnline")
              button(@click.left.stop="toggleOfflineIsVisible" :class="{ active: offlineIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
                img.icon.offline(src="@/assets/offline.svg")
              Offline(:visible="offlineIsVisible")

      .right
        //- Pricing
        .button-wrap.pricing-button-wrap(v-if="!isUpgraded")
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
        .button-wrap(v-if="!isUpgraded && isOnline && currentUserIsSignedIn")
          button(@click.left.stop="toggleUpgradeUserIsVisible" :class="{active: state.upgradeUserIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
            span Upgrade
          UpgradeUser(:visible="state.upgradeUserIsVisible" @closeDialog="closeAllDialogs")

    //- 3rd row
    //- .row
    //-   .left
    //-   .right
        //- Donate
        //- .button-wrap
        //-   .segmented-buttons
        //-     button Donate
        //-     button
        //-       img.icon.cancel(src="@/assets/add.svg")

        //- comments
        //- CommentButton

  Toolbar(:visible="toolbarIsVisible")
  SelectAllBelow
  SelectAllRight
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
      margin-left 39px
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

  // .space-details-row
  //   button
  //     white-space nowrap
  //     overflow hidden
  //     text-overflow ellipsis
  //   .space-name-button
  //     max-width 100%
  //     .icon.templates
  //       margin-right 4px
  //   dialog
  //     max-width initial
  //   .space-name-button-wrap
  //     max-width 55dvw
  //     @media(max-width 550px)
  //       max-width 35dvw
  //     &.back-button-is-visible
  //       @media(max-width 550px)
  //         max-width 31dvw
  //     > button
  //       .privacy-icon
  //         margin-left 6px

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

  .label-badge-row
    position absolute
    left 7px
    margin-top 4px
    width max-content
    flex-wrap nowrap
    display flex
    .icon.explore
      width 16px
      vertical-align -2px
    .icon.templates
      width 11px
    .label-badge
      width max-content
      pointer-events none
      position relative
      background-color var(--info-background)
      z-index 1
      span
        width 100%
        color var(--primary)
      &.success
        background-color var(--success-background)
      &.secondary
        background-color var(--secondary-background)

  .invisible
    visibility hidden

  .invisible-badge
    position absolute
    left 3px

  .icon.offline
    height 13px
    vertical-align -1px

  .inbox-icon
    width 12px
    vertical-align 0

  .icon.sidebar
    vertical-align -1px

  .badge.space-status-success
    width 14px
    height 14px
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

.button-wrap.space-status-button-wrap
  position absolute
  top 5px
  right 4px
  left initial
  .loader
    margin 0
</style>
