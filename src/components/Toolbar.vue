<template lang="pug">
nav.toolbar(v-if="visible")
  .segmented-buttons.vertical
    button(:class="{ active: currentUserToolbarIsCard }" @click="toggleToolbar('card')")
      span C
    button(:class="{ active: currentUserToolbarIsBox }" @click="toggleToolbar('box')")
      span B
</template>

<script>
export default {
  name: 'Toolbar',
  components: {
  },
  props: {
    visible: Boolean
  },
  computed: {
    currentUserToolbarIsCard () { return this.$store.state.currentUserToolbar === 'card' },
    currentUserToolbarIsBox () { return this.$store.state.currentUserToolbar === 'box' }
  },
  methods: {
    toggleToolbar (value) {
      this.$store.commit('currentUserToolbar', value)
    }
  }
}
</script>

<style lang="stylus">
.toolbar
  position absolute
  top 60px
</style>
