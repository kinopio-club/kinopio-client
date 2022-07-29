<template lang="pug">
nav.toolbar(v-if="visible")
  .segmented-buttons.vertical
    //- Card
    .button-wrap
      button(:class="{ active: currentUserToolbarIsCard }" @click="toggleToolbar('card')")
        span C
      .badge.info.item(:class="{ active: notifyItemIsCard }") Card Mode
    //- Box
    .button-wrap
      button(:class="{ active: currentUserToolbarIsBox }" @click="toggleToolbar('box')")
        span B
      .badge.info.item(:class="{ active: notifyItemIsBox }") Box Mode

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
    currentUserToolbar () { return this.$store.state.currentUserToolbar },
    currentUserToolbarIsCard () { return this.$store.state.currentUserToolbar === 'card' },
    notifyItemIsCard () { return this.notifyItem === 'card' },
    currentUserToolbarIsBox () { return this.$store.state.currentUserToolbar === 'box' },
    notifyItemIsBox () { return this.notifyItem === 'box' }
  },
  methods: {
    toggleToolbar (value) {
      this.$store.commit('currentUserToolbar', value)
    }
  },
  watch: {
    currentUserToolbar (value) {
      this.notifyItem = value
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
    left 28px
    position absolute
    pointer-events none
    min-width max-content
    margin 0
    display none
    &.active
      display initial
      animation-name horizontalHideme
      animation-duration 1s
      animation-iteration-count 1
      animation-direction forward
      animation-fill-mode forwards
      animation-timing-function ease-out
@keyframes horizontalHideme
  0%
    transform translateX(-6px)
    opacity 1
  20%
    transform translateX(0)
    opacity 1
  80%
    transform translateX(0)
    opacity 1
  100%
    transform translateX(-10px)
    opacity 0

</style>
