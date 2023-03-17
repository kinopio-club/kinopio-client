<template lang="pug">
dialog.controls-settings(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Controls
  section
    .row
      label.variable-length-content(:class="{ active: shouldDisableItemJiggle }" @click.left.prevent="toggleshouldDisableItemJiggle" @keydown.stop.enter="toggleshouldDisableItemJiggle")
        input(type="checkbox" v-model="shouldDisableItemJiggle")
        span Disable Jiggle While Dragging
    .row
      label.variable-length-content(:class="{active: shouldHideURLsInCardsByDefault}" @click.left.prevent="toggleShouldHideURLsInCardsByDefault" @keydown.stop.enter="toggleShouldHideURLsInCardsByDefault")
        input(type="checkbox" v-model="shouldHideURLsInCardsByDefault")
        span Hide URLs in Cards by Default
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
      p Debug
    .row
      label.variable-length-content(:class="{ active: shouldDisableRightClickToPan }" @click.left.prevent="toggleShouldDisableRightClickToPan" @keydown.stop.enter="toggleShouldDisableRightClickToPan")
        input(type="checkbox" v-model="shouldDisableRightClickToPan")
        span Disable Right/Middle Click to Pan

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
    shouldHideURLsInCardsByDefault () { return this.$store.state.currentUser.shouldHideURLsInCardsByDefault },
    shouldUseStickyCards () { return this.$store.state.currentUser.shouldUseStickyCards },
    shouldPauseConnectionDirections () { return this.$store.state.currentUser.shouldPauseConnectionDirections },
    shouldDisableRightClickToPan () { return this.$store.state.currentUser.shouldDisableRightClickToPan },
    shouldDisableItemJiggle () { return this.$store.state.currentUser.shouldDisableItemJiggle }
  },
  methods: {
    toggleShouldHideURLsInCardsByDefault () {
      const value = !this.shouldHideURLsInCardsByDefault
      this.$store.dispatch('currentUser/update', { shouldHideURLsInCardsByDefault: value })
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
</style>
