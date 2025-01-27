<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Notifications from '@/components/Notifications.vue'
import SpaceZoom from '@/components/SpaceZoom.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
const store = useStore()

let unsubscribe

const footerElement = ref(null)

const hiddenOnTouchDuration = 20
const updatePositionDuration = 60
let hiddenOnTouchIteration, hiddenOnTouchTimer, updatePositionIteration, updatePositionTimer

onMounted(() => {
  window.addEventListener('scroll', updatePosition)
  window.addEventListener('resize', updatePosition)
  updatePosition()
  unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateHeaderAndFooterPosition') {
      updatePosition()
    } else if (mutation.type === 'triggerHideTouchInterface') {
      hideOnTouch()
    } else if (mutation.type === 'isPresentationMode') {
      if (!mutation.payload) {
        store.commit('shouldExplicitlyHideFooter', false)
      }
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePosition)
  window.removeEventListener('resize', updatePosition)
  unsubscribe()
})

const state = reactive({
  position: {},
  isHiddenOnTouch: false
})

const isPinchZooming = computed(() => store.state.isPinchZooming)
watch(() => isPinchZooming.value, (value, prevValue) => {
  if (value) {
    updatePosition()
  }
})
const isTouchScrolling = computed(() => store.state.isTouchScrolling)
watch(() => isTouchScrolling.value, (value, prevValue) => {
  if (value) {
    if (!utils.isAndroid()) { return }
    if (value) {
      updatePosition()
    }
  }
})

const isAddPage = computed(() => store.state.isAddPage)
const isEmbedMode = computed(() => store.state.isEmbedMode)
const currentUser = computed(() => store.state.currentUser)
const shouldExplicitlyHideFooter = computed(() => store.state.shouldExplicitlyHideFooter)
const cardDetailsIsVisibleForCardId = computed(() => store.state.cardDetailsIsVisibleForCardId)
const multipleSelectedActionsIsVisible = computed(() => store.state.multipleSelectedActionsIsVisible)
const connectionDetailsIsVisibleForConnectionId = computed(() => store.state.connectionDetailsIsVisibleForConnectionId)
const shouldHideFooter = computed(() => store.state.shouldHideFooter)
const isTouchDevice = computed(() => store.getters.isTouchDevice)
const isMobile = computed(() => utils.isMobile())
const isMobileStandalone = computed(() => utils.isMobile() && navigator.standalone) // is homescreen app
const isFadingOut = computed(() => store.state.isFadingOutDuringTouch)
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)

// visible

const isVisible = computed(() => {
  if (isAddPage.value) { return }
  return true
})
const leftIsVisble = computed(() => {
  // if (isPresentationMode.value) { return }
  if (isEmbedMode.value) { return }
  return true
})
const controlsIsVisible = computed(() => {
  // if (isPresentationMode.value) { return }
  if (shouldExplicitlyHideFooter.value) { return }
  const isTouchDevice = store.state.isTouchDevice
  if (!isTouchDevice) { return true }
  const contentDialogIsVisible = Boolean(cardDetailsIsVisibleForCardId.value || multipleSelectedActionsIsVisible.value || connectionDetailsIsVisibleForConnectionId.value)
  if (contentDialogIsVisible) { return }
  if (shouldHideFooter.value) { return }
  return true
})

// presentation mode

const isPresentationMode = computed(() => store.state.isPresentationMode)
const togglePresentationMode = () => {
  const value = !isPresentationMode.value
  store.commit('isPresentationMode', value)
}

// minimap

const toggleMinimap = () => {
  store.commit('triggerMinimapIsVisible')
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

const updatePosition = async () => {
  if (!store.state.isTouchScrolling) {
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
  let style = {
    transform: `translate(${left}px, 0px) scale(${counterScale})`,
    maxWidth: Math.round(viewport.width * scale) + 'px',
    bottom: `max(${bottom}px, env(safe-area-inset-bottom))`
  }
  state.position = style
}
</script>

<template lang="pug">
.footer-wrap(:style="state.position" v-if="isVisible" :class="{'fade-out': isFadingOut}" ref="footerElement")
  .left(v-if="leftIsVisble")
    footer
      Notifications

  .right(v-if="controlsIsVisible" :class="{'is-embed': isEmbedMode}")
    SpaceZoom(v-if="!isPresentationMode")
    //- minimap
    .button-wrap.input-button-wrap.footer-button-wrap(@click.stop="toggleMinimap" @touchend.stop :class="{'hidden': state.isHiddenOnTouch}")
      button.small-button(:class="{active: isPresentationMode, 'translucent-button': !shouldIncreaseUIContrast}" title="Toggle Minimap (M)")
        img.icon.minimap(src="@/assets/minimap.svg")
    //- presentation mode
    .button-wrap.input-button-wrap.footer-button-wrap(@click="togglePresentationMode" @touchend.stop :class="{'hidden': state.isHiddenOnTouch}")
      button.small-button(:class="{active: isPresentationMode, 'translucent-button': !shouldIncreaseUIContrast}" title="Focus/Presentation Mode (P)")
        img.icon.settings(src="@/assets/presentation.svg")
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
      right 0
  &.is-mobile
    margin-bottom 10px
  &.is-mobile-standalone
    margin-bottom 20px

  .left
    .footer-button-wrap
      padding-left 0
      padding-right 4px

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
    button
      font-size 1rem

  .footer-button-wrap + .footer-button-wrap
    margin-left 4px

  .icon.minimap
    width 13px
    vertical-align -1px

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

  </style>
