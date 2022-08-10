<template lang="pug">
nav.toolbar(v-if="visible")
  //- Box
  .segmented-buttons
    button(:class="{ active: currentUserToolbarIsBox }" @pointerdown="toggleToolbar('box')")
      img.icon.box-icon(src="@/assets/box.svg")
      .label-badge.toolbar-badge-wrap(v-if="currentUserToolbarIsBox")
        span {{boxBadgeLabel}}
    button(v-if="currentUserToolbarIsBox" @pointerdown="toggleToolbar('card')")
      img.icon.cancel(src="@/assets/add.svg")
</template>

<script>
export default {
  name: 'Toolbar',
  props: {
    visible: Boolean
  },
  computed: {
    isTouchDevice () { return this.$store.state.isTouchDevice },
    currentUserToolbar () { return this.$store.state.currentUserToolbar },
    currentUserToolbarIsCard () { return this.currentUserToolbar === 'card' },
    currentUserToolbarIsBox () { return this.currentUserToolbar === 'box' },
    boxBadgeLabel () {
      let label = 'Draw Box'
      if (!this.isTouchDevice) {
        label = label + ' (B)'
      }
      return label
    }
  },
  methods: {
    toggleToolbar (value) {
      this.$store.commit('currentUserToolbar', value)
    }
  },
  watch: {
    currentUserToolbar (value) {
      this.$store.dispatch('closeAllDialogs', 'Toolbar')
      this.$store.dispatch('clearMultipleSelected')
    }
  }
}
</script>

<style lang="stylus">
.toolbar
  position absolute
  top 65px
  .toolbar-badge-wrap
    pointer-events none
    position absolute
    background-color var(--info-background)
    bottom -8px
    left 5px
    z-index 1
    span
      width 100%
      color var(--primary)

</style>
