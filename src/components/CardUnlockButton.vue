<template lang="pug">
.card-unlock-button.inline-button-wrap(:style="positionStyles" @mouseup.left="unlockCard" @touchend="unlockCard" :data-card-id="card.id")
  button.inline-button(tabindex="-1" :style="backgroundStyles" :class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}")
    .connected-colors
      template(v-for="type in connectionTypes" :key="type.id")
        .color(:style="{ background: type.color}")
    img.icon.lock-icon(src="@/assets/lock.svg")
</template>

<script>
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'CardUnlockButton',
  components: {
  },
  props: {
    card: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const { type, payload } = mutation
      if (type === 'triggerUpdateTheme') {
        this.defaultColor = utils.cssVariable('secondary-background')
      } else if (type === 'triggerUpdateLockedItemButtonPositionCardId' && payload === this.card.id) {
        this.updatePosition()
      }
    })
  },
  mounted () {
    this.defaultColor = utils.cssVariable('secondary-background')
  },
  data () {
    return {
      defaultColor: '#e3e3e3',
      position: null
    }
  },
  computed: {
    positionStyles () {
      const pointIsEmpty = utils.pointIsEmpty(this.position)
      if (!this.position || pointIsEmpty) {
        return { display: 'none' }
      }
      let position = utils.updatePositionWithSpaceOffset(this.position)
      const x = (position.x + window.scrollX) * this.$store.getters.spaceCounterZoomDecimal
      const y = (position.y + window.scrollY) * this.$store.getters.spaceCounterZoomDecimal
      position = {
        left: x + 'px',
        top: y + 'px'
      }
      return position
    },
    backgroundStyles () {
      return { backgroundColor: 'transparent' }
    },
    canEditCard () { return this.$store.getters['currentUser/canEditCard'](this.card) },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    connectionTypes () { return this.$store.getters['currentConnections/typesByCardId'](this.card.id) },
    // theme
    backgroundColorIsDark () {
      const color = this.card.backgroundColor || this.defaultColor
      return utils.colorIsDark(color)
    },
    isThemeDark () { return this.$store.state.currentUser.theme === 'dark' },
    isDarkInLightTheme () { return this.backgroundColorIsDark && !this.isThemeDark },
    isLightInDarkTheme () { return !this.backgroundColorIsDark && this.isThemeDark }
  },
  methods: {
    updatePosition () {
      let cardElement = document.querySelector(`article[data-card-id="${this.card.id}"]`)
      if (!cardElement) { return }
      if (!cardElement.dataset.shouldRender) {
        return
      }
      const element = cardElement.querySelector('.lock-button-wrap')
      if (!element) { return }
      const rect = element.getBoundingClientRect()
      this.position = rect
    },
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
    border-radius calc(var(--entity-radius) - 1px)
    overflow hidden
    .color
      width 100%
  .is-light-in-dark-theme
    border-color var(--primary-on-light-background)
    .icon
      filter none
  .is-dark-in-light-theme
    border-color var(--primary-on-dark-background)
    .icon
      filter invert()

</style>
