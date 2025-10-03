<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Notifications from '@/components/Notifications.vue'
import SpaceZoom from '@/components/SpaceZoom.vue'
import Loader from '@/components/Loader.vue'
import DiscoveryButtons from '@/components/DiscoveryButtons.vue'
import FavoriteSpaceButton from '@/components/FavoriteSpaceButton.vue'
import NewCardColorButton from '@/components/NewCardColorButton.vue'
import Minimap from '@/components/dialogs/Minimap.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

const footerElement = ref(null)

const hiddenOnTouchDuration = 20
const updatePositionDuration = 60
let hiddenOnTouchIteration, hiddenOnTouchTimer, updatePositionIteration, updatePositionTimer

onMounted(() => {
  window.addEventListener('scroll', updatePosition)
  window.addEventListener('resize', updatePosition)
  updatePosition()

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateHeaderAndFooterPosition') {
        updatePosition()
      } else if (name === 'triggerHideTouchInterface') {
        hideOnTouch()
      } else if (name === 'closeAllDialogs') {
        if (!globalStore.minimapIsPinned) {
          hideMinimap()
        }
      } else if (name === 'triggerMinimapIsVisible') {
        toggleMinimap()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePosition)
  window.removeEventListener('resize', updatePosition)
  unsubscribes()
})

watch(() => globalStore.isPresentationMode, (value, prevValue) => {
  if (!value) {
    globalStore.shouldExplicitlyHideFooter = false
  }
})

const state = reactive({
  position: {},
  isHiddenOnTouch: false,
  minimapIsVisible: false,
  isScrolled: false
})

const isPinchZooming = computed(() => globalStore.isPinchZooming)
watch(() => isPinchZooming.value, (value, prevValue) => {
  if (value) {
    updatePosition()
  }
})
const isTouchScrolling = computed(() => globalStore.isTouchScrolling)
watch(() => isTouchScrolling.value, (value, prevValue) => {
  if (value) {
    if (!utils.isAndroid()) { return }
    if (value) {
      updatePosition()
    }
  }
})

const isAddPage = computed(() => globalStore.isAddPage)
const isEmbedMode = computed(() => globalStore.isEmbedMode)
const currentUser = computed(() => userStore.getUserAllState)
const shouldExplicitlyHideFooter = computed(() => globalStore.shouldExplicitlyHideFooter)
const cardDetailsIsVisibleForCardId = computed(() => globalStore.cardDetailsIsVisibleForCardId)
const multipleSelectedActionsIsVisible = computed(() => globalStore.multipleSelectedActionsIsVisible)
const connectionDetailsIsVisibleForConnectionId = computed(() => globalStore.connectionDetailsIsVisibleForConnectionId)
const shouldHideFooter = computed(() => globalStore.shouldHideFooter)
const isTouchDevice = computed(() => globalStore.getIsTouchDevice)
const isMobile = computed(() => utils.isMobile())
const isMobileStandalone = computed(() => utils.isMobile() && navigator.standalone) // is homescreen app
const isFadingOut = computed(() => globalStore.isFadingOutDuringTouch)
const shouldIncreaseUIContrast = computed(() => userStore.shouldIncreaseUIContrast)
const isOnline = computed(() => globalStore.isOnline)

// visible

const contentDialogIsVisible = computed(() => Boolean(cardDetailsIsVisibleForCardId.value || multipleSelectedActionsIsVisible.value || connectionDetailsIsVisibleForConnectionId.value))
const isVisible = computed(() => {
  if (isAddPage.value) { return }
  return true
})
const leftIsVisble = computed(() => {
  if (isEmbedMode.value) { return }
  return true
})
const leftControlsIsVisible = computed(() => {
  if (isPresentationMode.value) { return }
  if (shouldExplicitlyHideFooter.value) { return }
  // const isTouchDevice = globalStore.isTouchDevice
  // if (!isTouchDevice) { return true }
  if (contentDialogIsVisible.value) { return }
  if (shouldHideFooter.value) { return }
  return true
})
const rightControlsIsVisible = computed(() => {
  // if (isPresentationMode.value) { return }
  if (globalStore.minimapIsPinned) { return true }
  if (shouldExplicitlyHideFooter.value) { return }
  // const isTouchDevice = globalStore.isTouchDevice
  // if (!isTouchDevice) { return true }
  if (contentDialogIsVisible.value) { return }
  if (shouldHideFooter.value) { return }
  return true
})
const embedLabelIsVisible = computed(() => {
  return globalStore.isEmbedMode && !state.isScrolled
})

// presentation mode

const isPresentationMode = computed(() => globalStore.isPresentationMode)
const togglePresentationMode = () => {
  const value = !isPresentationMode.value
  globalStore.isPresentationMode = value
}

// minimap

const hideMinimap = () => {
  state.minimapIsVisible = false
}
const toggleMinimap = () => {
  state.minimapIsVisible = !state.minimapIsVisible
}

// hide

const hideOnTouch = (event) => {
  if (!isTouchDevice.value) { return }
  hiddenOnTouchIteration = 0
  if (hiddenOnTouchTimer) { return }
  hiddenOnTouchTimer = window.requestAnimationFrame(hiddenOnTouchFrame)
}
const hiddenOnTouchFrame = () => {
  hiddenOnTouchIteration++
  state.isHiddenOnTouch = true
  if (hiddenOnTouchIteration < hiddenOnTouchDuration) {
    window.requestAnimationFrame(hiddenOnTouchFrame)
  } else {
    cancelHidden()
  }
}
const cancelHidden = () => {
  window.cancelAnimationFrame(hiddenOnTouchTimer)
  hiddenOnTouchTimer = undefined
  state.isHiddenOnTouch = false
}

// position

const updatePosition = async (event) => {
  if (event) {
    state.isScrolled = true
  }
  if (!globalStore.isTouchScrolling) {
    updatePositionFrame()
    return
  }
  await nextTick()
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
  if (!footerElement.value) { return }
  let bottom = 0
  if (window.navigator.shouldAddSafeAreaPaddingBottom) {
    bottom = 40
  }
  const style = {
    transform: `translate(${left}px, 0px) scale(${counterScale})`,
    maxWidth: Math.round(viewport.width * scale) + 'px',
    bottom: `max(${bottom}px, env(safe-area-inset-bottom))`
  }
  state.position = style
}
</script>

<template lang="pug">
.footer-wrap(:style="state.position" v-if="isVisible" :class="{'fade-out': isFadingOut}" ref="footerElement")
  .label-badge.embed-label(v-if="embedLabelIsVisible")
    img.icon(src="@/assets/constrain-axis.svg")
    span Scroll horizontally and vertically
  .left(v-if="leftIsVisble")
    footer
      Notifications
      template(v-if="leftControlsIsVisible")
        template(v-if="isOnline")
          .footer-button-wrap
            DiscoveryButtons
          .footer-button-wrap
            FavoriteSpaceButton(:isSmall="true")
        .footer-button-wrap
          NewCardColorButton

  .right(v-if="rightControlsIsVisible" :class="{'is-embed': isEmbedMode}")
    SpaceZoom(v-if="!isPresentationMode")
    //- presentation mode
    .button-wrap.footer-button-wrap(@click="togglePresentationMode" @touchend.stop :class="{'hidden': state.isHiddenOnTouch}")
      button.small-button(:class="{active: isPresentationMode, 'translucent-button': !shouldIncreaseUIContrast}" title="Focus/Presentation Mode (P)")
        img.icon.settings(src="@/assets/presentation.svg")
    //- minimap
    .button-wrap.footer-button-wrap(@click.stop="toggleMinimap" @touchend.stop :class="{'hidden': state.isHiddenOnTouch}")
      button.small-button(:class="{active: state.minimapIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" title="Toggle Minimap (M)")
        img.icon.minimap(src="@/assets/minimap.svg")
      Minimap(:visible="state.minimapIsVisible")
</template>

<style lang="stylus">
.footer-wrap
  display flex
  justify-content space-between
  align-items flex-end
  --footer-max-z 2147483644 // var(--max-z) - 2, hardcoded because firefox vars in calc is buggy
  z-index var(--footer-max-z)
  position fixed
  left 0
  right 0
  padding 8px
  max-width 100%
  pointer-events none
  transform-origin left bottom
  margin-bottom env(safe-area-inset-bottom)

  .right
    margin-left auto
    display flex
    align-items center
    pointer-events all
    text-align right
    transition 0.2s opacity
    &.is-embed
      position absolute
      right 8px
  &.is-mobile
    margin-bottom 10px
  &.is-mobile-standalone
    margin-bottom 20px

  .left
    .footer-button-wrap
      padding-left 0
      padding-right 4px
    .footer-button-wrap + .footer-button-wrap
      position relative
      z-index -1

  .left,
  .right
    pointer-events none
    button,
    .space-zoom
      pointer-events auto

  .footer-button-wrap
    pointer-events all
    cursor pointer
    padding-top 6px
    padding-left 4px
    padding-bottom 10px
    padding-right 0
    translate 0px 3px
    display inline-block
    > button
      font-size 1rem
      padding-left 6px
      padding-right 6px

  .footer-button-wrap + .footer-button-wrap
    margin-left 4px

  .icon.minimap
    width 13px
    vertical-align -1px

  .embed-label
    left 8px
    img.icon
      filter invert(1)

footer
  .is-mobile-icon
    vertical-align 2px !important
  .undo
    margin 0
    height 11px
  .controls
    transition 0.2s opacity
    dialog
      top initial
      bottom calc(100% - 8px)
    // > section
    //   display flex
    //   &:last-child
    //     margin-top 6px
    //   > .button-wrap
    //     pointer-events all
    //     margin-left 6px
    //     display inline-block
    //     &:first-child
    //       margin-left 0

  .segmented-buttons
    .down-arrow
      padding 0

  button
    .icon.down-arrow
      padding 0
    .icon.camera
      vertical-align 0
  .inbox-icon
    vertical-align 0px
    width 13px
    margin-left 6px

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

  </style>
