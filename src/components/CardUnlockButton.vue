<template lang="pug">
.card-unlock-button.inline-button-wrap(:style="positionStyles" @mouseup.left="unlockCard" @touchend="unlockCard")
  button.inline-button(tabindex="-1" :style="backgroundStyles")
    img.icon.lock-icon(src="@/assets/lock.svg")
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'CardUnlockButton',
  components: {
  },
  props: {
    card: Object,
    position: Object
  },
  data () {
    return {
    }
  },
  computed: {
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    positionStyles () {
      if (!this.position) { return }
      const zoom = this.spaceCounterZoomDecimal
      let left = this.position.left
      let top = this.position.top
      left = (left + window.scrollX) * zoom
      top = (top + window.scrollY) * zoom
      return {
        left: left + 'px',
        top: top + 'px'
      }
    },
    backgroundStyles () {
      return { backgroundColor: 'transparent' } // to css
    },
    canEditCard () { return this.$store.getters['currentUser/canEditCard'](this.card) }
  },
  methods: {
    unlockCard (event) {
      if (this.$store.state.currentUserIsDrawingConnection) {
        return
      }
      event.stopPropagation()
      if (!this.canEditCard) {
        const position = utils.cursorPositionInPage(event)
        this.$store.commit('addNotificationWithPosition', { message: 'Card is Read Only', position, type: 'info' }, { root: true })
        return
      }
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.dispatch('currentCards/update', {
        id: this.card.id,
        isLocked: false
      })
      this.$store.dispatch('currentCards/updateCardMap')
    }
  }
}
</script>

<style lang="stylus">
.card-unlock-button
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
