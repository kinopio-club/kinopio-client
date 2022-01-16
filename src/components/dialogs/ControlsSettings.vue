<template lang="pug">
dialog.controls-settings(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Controls
  section
    .row(v-if="!isMobile")
      label(:class="{active: shouldInvertZoomDirection}" @click.left.prevent="toggleShouldInvertZoomDirection" @keydown.stop.enter="toggleShouldInvertZoomDirection")
        input(type="checkbox" v-model="shouldInvertZoomDirection")
        span Invert Zoom Direction
    .row
      label(:class="{active: shouldOpenLinksInNewTab}" @click.left.prevent="toggleShouldOpenLinksInNewTab" @keydown.stop.enter="toggleShouldOpenLinksInNewTab")
        input(type="checkbox" v-model="shouldOpenLinksInNewTab")
        span Open Card URLs in New Tabs
    .row
      label(:class="{active: shouldRightMouseButtonPan}" @click.left.prevent="toggleShouldRightMouseButtonPan" @keydown.stop.enter="toggleShouldRightMouseButtonPan")
        input(type="checkbox" v-model="shouldRightMouseButtonPan")
        span Right mouse button pans

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
    shouldInvertZoomDirection () { return this.$store.state.currentUser.shouldInvertZoomDirection },
    shouldOpenLinksInNewTab () { return this.$store.state.currentUser.shouldOpenLinksInNewTab },
    shouldRightMouseButtonPan () { return this.$store.state.currentUser.shouldRightMouseButtonPan }
  },
  methods: {
    toggleShouldInvertZoomDirection () {
      const value = !this.shouldInvertZoomDirection
      this.$store.dispatch('currentUser/shouldInvertZoomDirection', value)
    },
    toggleShouldOpenLinksInNewTab () {
      const value = !this.shouldOpenLinksInNewTab
      this.$store.dispatch('currentUser/shouldOpenLinksInNewTab', value)
    },
    toggleShouldRightMouseButtonPan () {
      const value = !this.shouldRightMouseButtonPan
      this.$store.dispatch('currentUser/shouldRightMouseButtonPan', value)
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
  width 218px
</style>
