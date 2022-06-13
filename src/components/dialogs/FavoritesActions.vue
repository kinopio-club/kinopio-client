<template lang="pug">
dialog.favorities-actions(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p blank dialog, please duplicate
</template>

<script>
export default {
  name: 'FavoritesActions',
  props: {
    visible: Boolean
  },
  data () {
    return {
    }
  },
  computed: {
    // currentSpace () { return this.$store.state.currentSpace },
    isLoadingSpace () { return this.$store.state.isLoadingSpace }
  },
  methods: {
    toggleIsFavoriteSpace () {
      const currentSpace = this.$store.state.currentSpace
      if (this.isFavoriteSpace) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'space', item: currentSpace })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'space', item: currentSpace })
      }
    }
  }
}
</script>

<style lang="stylus">
// .favorities-actions
</style>
