<template lang="pug">
nav.toolbar(v-if="visible")
  .segmented-buttons.vertical
    //- Card
    .button-wrap
      button(:class="{ active: currentUserToolbarIsCard }" @pointerdown="toggleToolbar('card')")
        img.icon.card(src="@/assets/card.svg")
      .badge.info.item(:class="{ active: notifyItemIsCard }") Card Mode
        span(v-if="!isTouchDevice") {{' '}} (V)
    //- Box
    .button-wrap
      button(:class="{ active: currentUserToolbarIsBox }" @pointerdown="toggleToolbar('box')")
        img.icon.box-icon(src="@/assets/box.svg")
      .badge.info.item(:class="{ active: notifyItemIsBox }") Box Mode
        span(v-if="!isTouchDevice") {{' '}} (R)

</template>

<script>
export default {
  name: 'Toolbar',
  props: {
    visible: Boolean
  },
  data () {
    return {
      notifyItem: ''
    }
  },
  computed: {
    isTouchDevice () { return this.$store.state.isTouchDevice },
    currentUserToolbar () { return this.$store.state.currentUserToolbar },
    currentUserToolbarIsCard () { return this.$store.state.currentUserToolbar === 'card' },
    notifyItemIsCard () { return this.notifyItem === 'card' },
    currentUserToolbarIsBox () { return this.$store.state.currentUserToolbar === 'box' },
    notifyItemIsBox () { return this.notifyItem === 'box' }
  },
  methods: {
    toggleToolbar (value) {
      this.$store.commit('currentUserToolbar', value)
    },
    clearAllSelectedCards () {
      this.$store.dispatch('clearMultipleSelected')
      this.$store.commit('cardDetailsIsVisibleForCardId', '')
    }
  },
  watch: {
    currentUserToolbar (value) {
      this.notifyItem = value
      this.$store.dispatch('closeAllDialogs', 'Toolbar')
      this.clearAllSelectedCards()
    }
  }
}
</script>

<style lang="stylus">
.toolbar
  position absolute
  top 65px
  .item
    top 3px
    left 30px
    position absolute
    pointer-events none
    min-width max-content
    margin 0
    display none
    &.active
      display initial
      animation-name horizontalHideme
      animation-duration 0.8s
      animation-iteration-count 1
      animation-direction forward
      animation-fill-mode forwards
      animation-timing-function ease-out
@keyframes horizontalHideme
  0%
    transform translateX(0)
    opacity 1
  80%
    transform translateX(0)
    opacity 1
  100%
    transform translateX(-10px)
    opacity 0

</style>
