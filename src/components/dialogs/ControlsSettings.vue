<template lang="pug">
dialog.controls-settings.is-pinnable(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="controlsSettingsIsPinned" :class="{'is-pinned': controlsSettingsIsPinned}")
  section.title-row
    p Controls
    button.pin-button.small-button(:class="{active: controlsSettingsIsPinned}" @click.left="toggleDialogIsPinned" title="Pin dialog")
      img.icon.pin(src="@/assets/pin.svg")

  section
    .row
      label(:class="{active: newSpacesAreBlank}" @click.left.prevent="toggleNewSpacesAreBlank" @keydown.stop.enter="toggleNewSpacesAreBlank")
        input(type="checkbox" v-model="newSpacesAreBlank")
        span New Spaces Are Blank
  section(v-if="deviceSupportsHapticFeedback")
    .row
      p Device
    .row
      label.variable-length-content(:class="{active: shouldDisableHapticFeedback}" @click.left.prevent="toggleShouldDisableHapticFeedback" @keydown.stop.enter="toggleShouldDisableHapticFeedback")
        input(type="checkbox" v-model="shouldDisableHapticFeedback")
        img.icon.vibrate(src="@/assets/vibrate.svg")
        span Disable Haptic Feedback

  section
    .row
      p Motion
    .row
      label.variable-length-content(:class="{ active: shouldDisableItemJiggle }" @click.left.prevent="toggleshouldDisableItemJiggle" @keydown.stop.enter="toggleshouldDisableItemJiggle")
        input(type="checkbox" v-model="shouldDisableItemJiggle")
        span Disable Jiggle While Dragging
    .row
      label(:class="{ active: shouldDisableStickyCards }" @click.left.prevent="toggleShouldUseStickyCards" @keydown.stop.enter="toggleShouldUseStickyCards")
        input(type="checkbox" v-model="shouldDisableStickyCards")
        span Disable Sticky Cards
    .row
      label.variable-length-content(:class="{ active: shouldPauseConnectionDirections }" @click.left.prevent="toggleShouldPauseConnectionDirections" @keydown.stop.enter="toggleShouldPauseConnectionDirections")
        input(type="checkbox" v-model="shouldPauseConnectionDirections")
        span Pause Connection Directions
  section
    .row
      p Hold and Drag to Pan
    .row
      .segmented-buttons
        button(:class="{ active: !panSpeedIsFast }" @click="updatePanSpeedIsFast(false)")
          span Pan Slow
        button(:class="{ active: panSpeedIsFast }" @click="updatePanSpeedIsFast(true)")
          span Pan Fast
    .row(v-if="panSpeedIsFast")
      .badge.danger Fast panning is experimental. If panning is not smooth for you then switch back to slow
  section
    .row
      p Debug
    .row
      label.variable-length-content(:class="{ active: shouldDisableRightClickToPan }" @click.left.prevent="toggleShouldDisableRightClickToPan" @keydown.stop.enter="toggleShouldDisableRightClickToPan")
        input(type="checkbox" v-model="shouldDisableRightClickToPan")
        span Disable Right/Middle Click to Pan
</template>

<script>
import utils from '@/utils.js'
import consts from '@/consts.js'

export default {
  name: 'ControlsSettings',
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      dialogHeight: null
    }
  },
  computed: {
    isMobile () { return utils.isMobile() },
    shouldDisableStickyCards () { return !this.$store.state.currentUser.shouldUseStickyCards },
    shouldPauseConnectionDirections () { return this.$store.state.currentUser.shouldPauseConnectionDirections },
    shouldDisableRightClickToPan () { return this.$store.state.currentUser.shouldDisableRightClickToPan },
    shouldDisableItemJiggle () { return this.$store.state.currentUser.shouldDisableItemJiggle },
    controlsSettingsIsPinned () { return this.$store.state.controlsSettingsIsPinned },
    panSpeedIsFast () { return this.$store.state.currentUser.panSpeedIsFast },
    newSpacesAreBlank () { return this.$store.state.currentUser.newSpacesAreBlank },
    shouldDisableHapticFeedback () { return this.$store.state.currentUser.shouldDisableHapticFeedback },
    deviceSupportsHapticFeedback () { return window.navigator.isSecureAppContext && this.isMobile }
  },
  methods: {
    toggleShouldDisableHapticFeedback () {
      const value = !this.shouldDisableHapticFeedback
      this.$store.commit('currentUser/shouldDisableHapticFeedback', value)
    },
    toggleNewSpacesAreBlank () {
      const value = !this.newSpacesAreBlank
      this.$store.dispatch('currentUser/newSpacesAreBlank', value)
    },
    updatePanSpeedIsFast (value) {
      this.$store.dispatch('currentUser/update', { panSpeedIsFast: value })
    },
    toggleshouldDisableItemJiggle () {
      const value = !this.shouldDisableItemJiggle
      this.$store.dispatch('currentUser/update', { shouldDisableItemJiggle: value })
    },
    toggleShouldUseStickyCards () {
      let value = this.$store.state.currentUser.shouldUseStickyCards
      value = !value
      this.$store.dispatch('currentUser/update', { shouldUseStickyCards: value })
    },
    toggleShouldPauseConnectionDirections () {
      const value = !this.shouldPauseConnectionDirections
      this.$store.dispatch('currentUser/update', { shouldPauseConnectionDirections: value })
      this.$store.dispatch('currentSpace/checkIfShouldPauseConnectionDirections')
    },
    toggleShouldDisableRightClickToPan () {
      const value = !this.shouldDisableRightClickToPan
      this.$store.dispatch('currentUser/update', { shouldDisableRightClickToPan: value })
    },
    toggleDialogIsPinned () {
      this.$store.dispatch('closeAllDialogs')
      const value = !this.controlsSettingsIsPinned
      this.$store.dispatch('controlsSettingsIsPinned', value)
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.controls-settings
  overflow auto
  width 222px
  &.is-pinned
    left initial
    right 8px
  .pin-button
    margin 0
  .panning-speed-buttons
    margin-left 6px
    margin-top 0
  .icon.vibrate
    vertical-align 1px
</style>
