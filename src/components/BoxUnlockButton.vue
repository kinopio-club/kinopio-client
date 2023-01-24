<template lang="pug">
.box-unlock-button.inline-button-wrap(:style="positionStyles" @mouseup.left="unlockBox" @touchend="unlockBox" :class="{invert: shouldInvert}")
  button.inline-button(tabindex="-1" :style="backgroundStyles")
    img.icon.lock-icon(src="@/assets/lock.svg")
</template>

<script>
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'BoxUnlockButton',
  components: {
  },
  props: {
    box: Object,
    position: Object,
    shouldInvert: Boolean
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
      'spaceCounterZoomDecimal'
    ]),
    positionStyles () {
      if (!this.position) { return }
      const position = utils.updatePositionWithSpaceOffset(this.position)
      const x = (position.x + window.scrollX) * this.spaceCounterZoomDecimal
      const y = (position.y + window.scrollY) * this.spaceCounterZoomDecimal
      return {
        left: x + 'px',
        top: y + 'px'
      }
    },
    backgroundStyles () {
      return { backgroundColor: 'transparent' }
    },
    canEditBox () { return this.$store.getters['currentUser/canEditBox'](this.box) },
    connectionTypes () { return this.$store.getters['currentConnections/typesByBoxId'](this.box.id) }
  },
  methods: {
    unlockBox (event) {
      if (this.$store.state.currentUserIsDrawingConnection) { return }
      event.stopPropagation()
      // notify read only if user cannot edit
      if (!this.canEditBox) {
        const position = utils.cursorPositionInPage(event)
        this.$store.commit('addNotificationWithPosition', { message: 'Box is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
        return
      }
      this.$store.commit('currentUserIsDraggingBox', false)
      this.$store.dispatch('currentBoxes/update', {
        id: this.box.id,
        isLocked: false
      })
    }
  }
}
</script>

<style lang="stylus">
.box-unlock-button
  transform-origin top left
  pointer-events all
  cursor pointer
  position absolute
  button
    cursor pointer
  .lock-icon
    position absolute
    left 5.5px
    top 2px
    height 10px
  &.invert
    button
      border-color var(--primary-on-light-background)
      .icon
        filter none

</style>
