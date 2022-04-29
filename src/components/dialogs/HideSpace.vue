<template lang="pug">
dialog.hide-space.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog")
  section
    button(@click.stop="hideSpace" :class="{ active: currentSpaceIsHidden }")
      img.icon(v-if="!currentSpaceIsHidden" src="@/assets/view.svg")
      img.icon(v-if="currentSpaceIsHidden" src="@/assets/view-hidden.svg")
      span Hide Space
    p Hidden spaces can be revealed through
      img.icon.filter-icon(src="@/assets/filter.svg")

</template>

<script>

export default {
  name: 'HideSpace',
  props: {
    visible: Boolean
  },
  computed: {
    currentSpaceIsHidden () { return this.$store.state.currentSpace.isHidden }
  },
  methods: {
    hideSpace () {
      const value = !this.currentSpaceIsHidden
      this.$store.dispatch('currentSpace/updateSpace', { isHidden: value })
      this.$emit('updateSpaces')
    }
  }
}
</script>

<style lang="stylus">
.hide-space
  .filter-icon
    margin-left 4px
</style>
