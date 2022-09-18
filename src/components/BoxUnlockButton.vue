<template lang="pug">
.box-unlock-button.inline-button-wrap(:style="positionStyles" @mouseup.left="unlockBox" @touchend="unlockBox")
  button.inline-button(tabindex="-1" :style="backgroundStyles")
    img.icon.lock-icon(src="@/assets/lock.svg")
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'BoxUnlockButton',
  components: {
  },
  props: {
    box: Object,
    position: Object
  },
  computed: {
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    positionStyles () {
      if (!this.position) { return }
      let left = this.position.left
      let top = this.position.top
      left = (left + window.scrollX)
      top = (top + window.scrollY)
      return {
        left: left + 'px',
        top: top + 'px'
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
        this.$store.commit('addNotificationWithPosition', { message: 'Box is Read Only', position, type: 'info', icon: 'cancel' })
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

</style>
