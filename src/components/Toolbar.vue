<template lang="pug">
nav.toolbar(v-if="visible")
  .segmented-buttons.vertical
    //- Box
    button(v-if="canEditSpace" :class="{ active: currentUserToolbarIsBox }" @click="toggleToolbar('box')" title="Add Box (B)")
      img.icon.box-icon(src="@/assets/box.svg")
      .label-badge.toolbar-badge-wrap.jiggle(v-if="currentUserToolbarIsBox")
        span Add Box (B)
    //- Line
    button(title="Add Line (L)")
      img.icon(src="@/assets/line.svg")
</template>

<script>
export default {
  name: 'Toolbar',
  props: {
    visible: Boolean
  },
  computed: {
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentUserToolbar () { return this.$store.state.currentUserToolbar },
    // currentUserToolbarIsCard () { return this.currentUserToolbar === 'card' },
    currentUserToolbarIsBox () {
      if (this.$store.state.currentUserIsResizingBox) { return }
      return this.currentUserToolbar === 'box'
    }
  },
  methods: {
    toggleToolbar (value) {
      const initialValue = 'card'
      const shouldToggleOffBox = value === 'box' && this.currentUserToolbarIsBox
      if (shouldToggleOffBox) {
        this.$store.commit('currentUserToolbar', initialValue)
      } else {
        this.$store.commit('currentUserToolbar', value)
      }
    }
  },
  watch: {
    currentUserToolbar (value) {
      this.$store.dispatch('closeAllDialogs')
      this.$store.dispatch('clearMultipleSelected')
    }
  }
}
</script>

<style lang="stylus">
.toolbar
  position absolute
  top 55px
  .toolbar-badge-wrap
    pointer-events none
    position absolute
    background-color var(--info-background)
    bottom -8px
    left 5px
    z-index 1
    width 77px
    span
      width 100%
      color var(--primary)

</style>
