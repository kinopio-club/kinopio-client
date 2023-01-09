<template lang="pug">
dialog.controls-settings(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Controls
  section
    .row
      label(:class="{active: shouldOpenLinksInNewTab}" @click.left.prevent="toggleShouldOpenLinksInNewTab" @keydown.stop.enter="toggleShouldOpenLinksInNewTab")
        input(type="checkbox" v-model="shouldOpenLinksInNewTab")
        span Open URLs in New Tabs
    .row
      label.double-line-height(:class="{ active: shouldPauseConnectionDirections }" @click.left.prevent="toggleShouldPauseConnectionDirections" @keydown.stop.enter="toggleShouldPauseConnectionDirections")
        input(type="checkbox" v-model="shouldPauseConnectionDirections")
        span Pause Connection Directions
    .row
      label(:class="{ active: shouldDisableItemJiggle }" @click.left.prevent="toggleshouldDisableItemJiggle" @keydown.stop.enter="toggleshouldDisableItemJiggle")
        input(type="checkbox" v-model="shouldDisableItemJiggle")
        span Disable Item Jiggle
    .row
      label(:class="{ active: shouldUseStickyCards }" @click.left.prevent="toggleShouldUseStickyCards" @keydown.stop.enter="toggleShouldUseStickyCards")
        input(type="checkbox" v-model="shouldUseStickyCards")
        span Use Sticky Cards
  section
    .row
      p Debug
    .row
      label(:class="{ active: shouldDisableRightClickToPan }" @click.left.prevent="toggleShouldDisableRightClickToPan" @keydown.stop.enter="toggleShouldDisableRightClickToPan")
        input(type="checkbox" v-model="shouldDisableRightClickToPan")
        span Disable Right Click to Pan

</template>

<script>
import utils from '@/utils.js'

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
    shouldDisableItemJiggle () { return this.$store.state.currentUser.shouldDisableItemJiggle }
  },
  methods: {
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
  .double-line-height
    height 44px
</style>
