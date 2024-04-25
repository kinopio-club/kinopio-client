<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  dialogHeight: null,
  panningTipsIsVisible: false,
  outsideSpaceColorTipsIsVisible: false
})

const currentSpace = computed(() => store.state.currentSpace)
const isMobile = computed(() => utils.isMobile())
const deviceSupportsHapticFeedback = computed(() => consts.isSecureAppContext && isMobile.value)

// haptic feedback

const shouldDisableHapticFeedback = computed(() => { return store.state.currentUser.shouldDisableHapticFeedback })
const toggleShouldDisableHapticFeedback = () => {
  const value = !shouldDisableHapticFeedback.value
  store.commit('currentUser/shouldDisableHapticFeedback', value)
}

// new spaces are blank

const newSpacesAreBlank = computed(() => { return store.state.currentUser.newSpacesAreBlank })
const toggleNewSpacesAreBlank = () => {
  const value = !newSpacesAreBlank.value
  store.dispatch('currentUser/newSpacesAreBlank', value)
}

// panning

const shouldDisableRightClickToPan = computed(() => store.state.currentUser.shouldDisableRightClickToPan)
const panSpeedIsFast = computed(() => store.state.currentUser.panSpeedIsFast)
const updatePanSpeedIsFast = (value) => {
  store.dispatch('currentUser/update', { panSpeedIsFast: value })
}
const toggleShouldDisableRightClickToPan = () => {
  const value = !shouldDisableRightClickToPan.value
  store.dispatch('currentUser/update', { shouldDisableRightClickToPan: value })
}
const togglePanningTipsIsVisible = () => {
  const value = !state.panningTipsIsVisible
  clearTips()
  state.panningTipsIsVisible = value
}

// zoom

const shouldInvertZoom = computed(() => store.state.currentUser.shouldInvertZoom)
const toggleShouldInvertZoom = () => {
  const value = !shouldInvertZoom.value
  store.commit('currentUser/shouldInvertZoom', value)
}

// disable sticky cards

const shouldDisableStickyCards = computed(() => !store.state.currentUser.shouldUseStickyCards)
const toggleShouldUseStickyCards = () => {
  let value = store.state.currentUser.shouldUseStickyCards
  value = !value
  store.dispatch('currentUser/update', { shouldUseStickyCards: value })
}

// pause connection directions

const shouldPauseConnectionDirections = computed(() => store.state.currentUser.shouldPauseConnectionDirections)
const toggleShouldPauseConnectionDirections = () => {
  const value = !shouldPauseConnectionDirections.value
  store.dispatch('currentUser/update', { shouldPauseConnectionDirections: value })
  store.dispatch('currentSpace/checkIfShouldPauseConnectionDirections')
}

// increase UI Contrast

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const toggleShouldIncreaseUIContrast = () => {
  const value = !shouldIncreaseUIContrast.value
  store.dispatch('currentUser/update', { shouldIncreaseUIContrast: value })
}

// outside space background

const updateOutsideSpaceBackgroundIsStatic = (value) => {
  store.dispatch('currentUser/update', { outsideSpaceBackgroundIsStatic: value })
}
const outsideSpaceBackgroundIsStatic = computed(() => store.state.currentUser.outsideSpaceBackgroundIsStatic)
const outsideSpaceStyles = computed(() => {
  return {
    backgroundColor: store.state.outsideSpaceBackgroundColor
  }
})
const toggleOutsideSpaceColorTipsIsVisible = () => {
  const value = !state.outsideSpaceColorTipsIsVisible
  clearTips()
  state.outsideSpaceColorTipsIsVisible = value
}

// dialog

const clearTips = () => {
  state.panningTipsIsVisible = false
  state.outsideSpaceColorTipsIsVisible = false
}
</script>

<template lang="pug">
.controls-settings(v-if="visible")
  section
    .row
      p New Spaces
    .row
      label(:class="{active: newSpacesAreBlank}" @click.left.prevent="toggleNewSpacesAreBlank" @keydown.stop.enter="toggleNewSpacesAreBlank")
        input(type="checkbox" v-model="newSpacesAreBlank")
        span New Spaces Are Blank

  section
    .row
      p Accessibility
    .row(v-if="deviceSupportsHapticFeedback")
      label(:class="{active: shouldDisableHapticFeedback}" @click.left.prevent="toggleShouldDisableHapticFeedback" @keydown.stop.enter="toggleShouldDisableHapticFeedback")
        input(type="checkbox" v-model="shouldDisableHapticFeedback")
        img.icon.vibrate(src="@/assets/vibrate.svg")
        span Disable Haptic Feedback
    .row
      label(:class="{ active: shouldDisableStickyCards }" @click.left.prevent="toggleShouldUseStickyCards" @keydown.stop.enter="toggleShouldUseStickyCards")
        input(type="checkbox" v-model="shouldDisableStickyCards")
        span Disable Sticky Cards
    .row
      label(:class="{active: shouldIncreaseUIContrast}" @click.left.prevent="toggleShouldIncreaseUIContrast" @keydown.stop.enter="toggleShouldIncreaseUIContrast")
        input(type="checkbox" v-model="shouldIncreaseUIContrast")
        span Increase UI Contrast
    .row
      label(:class="{ active: shouldPauseConnectionDirections }" @click.left.prevent="toggleShouldPauseConnectionDirections" @keydown.stop.enter="toggleShouldPauseConnectionDirections")
        input(type="checkbox" v-model="shouldPauseConnectionDirections")
        span Pause Connection Directions

  section
    .row.title-row
      p Outside Space Color
      .button-wrap
        button.small-button(@click="toggleOutsideSpaceColorTipsIsVisible" :class="{ active: state.outsideSpaceColorTipsIsVisible }")
          span ?
    section.subsection(v-if="state.outsideSpaceColorTipsIsVisible")
      p The area outside your space, visible when zoomed out
    .row
      .outside-space(:style="outsideSpaceStyles")
        BackgroundPreview(:space="currentSpace")
      .segmented-buttons
        button(:class="{ active: !outsideSpaceBackgroundIsStatic }" @click="updateOutsideSpaceBackgroundIsStatic(false)")
          span Colorful
        button(:class="{ active: outsideSpaceBackgroundIsStatic }" @click="updateOutsideSpaceBackgroundIsStatic(true)")
          span Grey

  section
    .row.title-row
      p Panning and Zoom
      .button-wrap
        button.small-button(@click="togglePanningTipsIsVisible" :class="{ active: state.panningTipsIsVisible }")
          span ?
    section.subsection(v-if="state.panningTipsIsVisible")
      p Hold and drag space key, or right/middle mouse button, to Pan
    .row
      .segmented-buttons
        button(:class="{ active: !panSpeedIsFast }" @click="updatePanSpeedIsFast(false)")
          span Pan Slow
        button(:class="{ active: panSpeedIsFast }" @click="updatePanSpeedIsFast(true)")
          span Pan Fast
    .row(v-if="panSpeedIsFast")
      .badge.danger Fast panning is experimental. If panning is not smooth for you then switch back to slow
    .row
      label(:class="{ active: shouldDisableRightClickToPan }" @click.left.prevent="toggleShouldDisableRightClickToPan" @keydown.stop.enter="toggleShouldDisableRightClickToPan")
        input(type="checkbox" v-model="shouldDisableRightClickToPan")
        span Disable Right/Middle Click to Pan
    .row
      label(:class="{ active: shouldInvertZoom }" @click.left.prevent="toggleShouldInvertZoom" @keydown.stop.enter="toggleShouldInvertZoom")
        input(type="checkbox" v-model="shouldInvertZoom")
        span Invert Zoom Direction

</template>

<style lang="stylus">
.controls-settings
  overflow auto
  .panning-speed-buttons
    margin-left 6px
    margin-top 0
  .icon.vibrate
    vertical-align 1px
  .title-row
    p + .button-wrap
      margin 0
  .outside-space
    display block
    width 30px
    height 30px
    border-radius var(--entity-radius)
    margin-right 6px
    position relative
    .background-preview
      position absolute
      bottom 4px
      right 4px
      .preview-wrap
        background-color var(--primary-background)
        width 18px
        height 18px
        border-radius var(--small-entity-radius)
  section
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
