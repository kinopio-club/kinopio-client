<template lang="pug">
dialog.controls-settings.narrow.is-pinnable(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="controlsSettingsIsPinned" :class="{'is-pinned': controlsSettingsIsPinned}")
  section.title-row
    p Controls
    button.pin-button.small-button(:class="{active: controlsSettingsIsPinned}" @click.left="toggleDialogIsPinned" title="Pin dialog")
      img.icon.pin(src="@/assets/pin.svg")

  section
    .row
      p General
    .row
      label(:class="{active: newSpacesAreBlank}" @click.left.prevent="toggleNewSpacesAreBlank" @keydown.stop.enter="toggleNewSpacesAreBlank")
        input(type="checkbox" v-model="newSpacesAreBlank")
        span New Spaces Are Blank
  section
    .row
      p Motion
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
      label(:class="{ active: shouldPauseConnectionDirections }" @click.left.prevent="toggleShouldPauseConnectionDirections" @keydown.stop.enter="toggleShouldPauseConnectionDirections")
        input(type="checkbox" v-model="shouldPauseConnectionDirections")
        span Pause Connection Directions

  section
    .row.title-row
      p Outside Space Color
      .button-wrap
        button.small-button(@click="toggleOutsideSpaceColorTipsIsVisible" :class="{ active: outsideSpaceColorTipsIsVisible }")
          span ?
    section.subsection(v-if="outsideSpaceColorTipsIsVisible")
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
      p Panning
      .button-wrap
        button.small-button(@click="togglePanningTipsIsVisible" :class="{ active: panningTipsIsVisible }")
          span ?
    section.subsection(v-if="panningTipsIsVisible")
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
</template>

<script>
import utils from '@/utils.js'
import consts from '@/consts.js'
import BackgroundPreview from '@/components/BackgroundPreview.vue'

export default {
  name: 'ControlsSettings',
  components: {
    BackgroundPreview
  },
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
      dialogHeight: null,
      panningTipsIsVisible: false,
      outsideSpaceColorTipsIsVisible: false
    }
  },
  computed: {
    isMobile () { return utils.isMobile() },
    shouldDisableStickyCards () { return !this.$store.state.currentUser.shouldUseStickyCards },
    shouldPauseConnectionDirections () { return this.$store.state.currentUser.shouldPauseConnectionDirections },
    shouldDisableRightClickToPan () { return this.$store.state.currentUser.shouldDisableRightClickToPan },
    controlsSettingsIsPinned () { return this.$store.state.controlsSettingsIsPinned },
    panSpeedIsFast () { return this.$store.state.currentUser.panSpeedIsFast },
    outsideSpaceBackgroundIsStatic () { return this.$store.state.currentUser.outsideSpaceBackgroundIsStatic },
    newSpacesAreBlank () { return this.$store.state.currentUser.newSpacesAreBlank },
    shouldDisableHapticFeedback () { return this.$store.state.currentUser.shouldDisableHapticFeedback },
    deviceSupportsHapticFeedback () { return consts.isSecureAppContext && this.isMobile },
    outsideSpaceStyles () {
      const color = this.$store.state.outsideSpaceBackgroundColor
      return {
        backgroundColor: color
      }
    },
    currentSpace () { return this.$store.state.currentSpace }
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
    updateOutsideSpaceBackgroundIsStatic (value) {
      this.$store.dispatch('currentUser/update', { outsideSpaceBackgroundIsStatic: value })
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
    },

    // tips

    clearTips () {
      this.panningTipsIsVisible = false
      this.outsideSpaceColorTipsIsVisible = false
    },
    togglePanningTipsIsVisible () {
      const value = !this.panningTipsIsVisible
      this.clearTips()
      this.panningTipsIsVisible = value
    },
    toggleOutsideSpaceColorTipsIsVisible () {
      const value = !this.outsideSpaceColorTipsIsVisible
      this.clearTips()
      this.outsideSpaceColorTipsIsVisible = value
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
</style>
