<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import DiscoveryButtons from '@/components/DiscoveryButtons.vue'
import consts from '@/consts.js'

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
  if (!consts.isStaticPrerenderingPage) {
    window.addEventListener('scroll', updatePosition)
    window.addEventListener('resize', updatePosition)
  }
  updatePosition()

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateHeaderAndFooterPosition') {
        updatePosition()
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

const shouldExplicitlyHideFooter = computed(() => globalStore.shouldExplicitlyHideFooter)
const shouldHideFooter = computed(() => globalStore.shouldHideFooter)
const isOnline = computed(() => globalStore.isOnline)
const isFadingOut = computed(() => globalStore.isFadingOutDuringTouch)
const isTouchDevice = computed(() => globalStore.getIsTouchDevice)

// visible

const isVisible = computed(() => {
  if (globalStore.isSpacePage) { return }
  if (!leftControlsIsVisible.value) { return }
  if (!isOnline.value) { return }
  return true
})
const leftControlsIsVisible = computed(() => {
  if (shouldExplicitlyHideFooter.value) { return }
  if (shouldHideFooter.value) { return }
  return true
})
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
  .left
    footer
      .footer-button-wrap
        DiscoveryButtons
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

  dialog
    top initial !important

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
