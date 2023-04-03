<template lang="pug">
dialog.controls-settings.is-pinnable(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="controlsSettingsIsPinned" :class="{'is-pinned': controlsSettingsIsPinned}")
  section.title-row
    p Controls
    button.pin-button.small-button(:class="{active: controlsSettingsIsPinned}" @click.left="toggleDialogIsPinned" title="Pin dialog")
      img.icon.pin(src="@/assets/pin.svg")

  section
    .row
      label.variable-length-content(:class="{ active: shouldDisableItemJiggle }" @click.left.prevent="toggleshouldDisableItemJiggle" @keydown.stop.enter="toggleshouldDisableItemJiggle")
        input(type="checkbox" v-model="shouldDisableItemJiggle")
        span Disable Jiggle While Dragging
    .row
      label(:class="{active: shouldOpenLinksInNewTab}" @click.left.prevent="toggleShouldOpenLinksInNewTab" @keydown.stop.enter="toggleShouldOpenLinksInNewTab")
        input(type="checkbox" v-model="shouldOpenLinksInNewTab")
        span Open URLs in New Tabs
    .row
      label.variable-length-content(:class="{ active: shouldPauseConnectionDirections }" @click.left.prevent="toggleShouldPauseConnectionDirections" @keydown.stop.enter="toggleShouldPauseConnectionDirections")
        input(type="checkbox" v-model="shouldPauseConnectionDirections")
        span Pause Connection Directions
    .row
      label(:class="{ active: shouldUseStickyCards }" @click.left.prevent="toggleShouldUseStickyCards" @keydown.stop.enter="toggleShouldUseStickyCards")
        input(type="checkbox" v-model="shouldUseStickyCards")
        span Use Sticky Cards
  section
    .row
      span Pan Speed
      .segmented-buttons.panning-speed-buttons
        button(title="slow" @click="updatePanSpeedPercent(0)" :class="{active: panSpeedPercent === 0}")
          span 1×
        button(title="medium" @click="updatePanSpeedPercent(50)" :class="{active: panSpeedPercent === 50}")
          span 2×
        button(title="fast" @click="updatePanSpeedPercent(100)" :class="{active: panSpeedPercent === 100}")
          span 3×
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
    shouldOpenLinksInNewTab () { return this.$store.state.currentUser.shouldOpenLinksInNewTab },
    shouldUseStickyCards () { return this.$store.state.currentUser.shouldUseStickyCards },
    shouldPauseConnectionDirections () { return this.$store.state.currentUser.shouldPauseConnectionDirections },
    shouldDisableRightClickToPan () { return this.$store.state.currentUser.shouldDisableRightClickToPan },
    shouldDisableItemJiggle () { return this.$store.state.currentUser.shouldDisableItemJiggle },
    panSpeedPercent () { return this.$store.state.currentUser.panSpeedPercent },
    controlsSettingsIsPinned () { return this.$store.state.controlsSettingsIsPinned }
  },
  methods: {
    updatePanSpeedPercent (value) {
      value = Math.round(value)
      this.$store.dispatch('currentUser/update', { panSpeedPercent: value })
    },
    resetPanSpeedPercent () {
      this.updatePanSpeedPercent(100)
    },
    toggleshouldDisableItemJiggle () {
      const value = !this.shouldDisableItemJiggle
      this.$store.dispatch('currentUser/update', { shouldDisableItemJiggle: value })
    },
    toggleShouldOpenLinksInNewTab () {
      const value = !this.shouldOpenLinksInNewTab
      this.$store.dispatch('currentUser/shouldOpenLinksInNewTab', value)
    },
    toggleShouldUseStickyCards () {
      const value = !this.shouldUseStickyCards
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
</style>
