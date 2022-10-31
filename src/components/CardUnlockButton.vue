<template lang="pug">
.card-unlock-button.inline-button-wrap(:style="positionStyles" @mouseup.left="unlockCard" @touchend="unlockCard")
  button.inline-button(tabindex="-1" :style="backgroundStyles" :class="{ 'is-dark': isDark }")
    .connected-colors
      template(v-for="type in connectionTypes")
        .color(:style="{ background: type.color}")
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
    canEditCard () { return this.$store.getters['currentUser/canEditCard'](this.card) },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    connectionTypes () { return this.$store.getters['currentConnections/typesByCardId'](this.card.id) },
    isDark () {
      const type = this.connectionTypes[0]
      if (!type) {
        return utils.colorIsDark(this.card.backgroundColor)
      } else {
        return utils.colorIsDark(type.color)
      }
    }
  },
  methods: {
    unlockCard (event) {
      if (this.$store.state.currentUserIsDrawingConnection) {
        return
      }
      event.stopPropagation()
      if (!this.canEditCard || !this.canEditSpace) {
        const position = utils.cursorPositionInPage(event)
        this.$store.commit('addNotificationWithPosition', { message: 'Card is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
        return
      }
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.dispatch('currentCards/update', {
        id: this.card.id,
        isLocked: false
      })
    }
  }
}
</script>

<style lang="stylus">
.card-unlock-button
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
  // from Card.vue
  .connected-colors
    position absolute
    left 0
    top 0
    display flex
    height 100%
    width 100%
    border-radius 2px
    overflow hidden
    .color
      width 100%

</style>
