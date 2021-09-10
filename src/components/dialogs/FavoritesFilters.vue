<template lang="pug">
dialog.narrow.favorites-filters(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p
      //- Favorite Spaces Filter
      img.icon.heart(src="@/assets/heart.svg")
      span Spaces Filter
  section
    .segmented-buttons
      button(@click="showAll" :class="{active: all}") All
      button(@click="showCurrentUserSpacesOnly" :class="{active: current}")
        User(:user="currentUser" :key="currentUser.id" :hideYouLabel="true" :isSmall="true")
      button(@click="showOtherUserSpacesOnly" :class="{active: others}") Others

</template>

<script>

export default {
  name: 'FavoritesFilters',
  components: {
    User: () => import('@/components/User.vue')
  },
  props: {
    visible: Boolean
  },
  computed: {
    dialogFavoritesFilters () { return this.$store.state.currentUser.dialogFavoritesFilters },
    currentUser () { return this.$store.state.currentUser },
    all () {
      return Boolean(!this.dialogFavoritesFilters)
    },
    current () {
      return this.dialogFavoritesFilters === 'currentUser'
    },
    others () {
      return this.dialogFavoritesFilters === 'otherUsers'
    }
  },
  methods: {
    showCurrentUserSpacesOnly () {
      this.updateFilter('currentUser')
    },
    showOtherUserSpacesOnly () {
      this.updateFilter('otherUsers')
    },
    showAll () {
      this.updateFilter(null)
    },
    updateFilter (value) {
      this.$store.dispatch('currentUser/update', { dialogFavoritesFilters: value })
    }
  }
}
</script>

<style lang="stylus" scoped>
.favorites-filters
  top calc(100% - 8px)
  bottom initial
  @media(max-width 490px)
    left -60px
  @media(max-width 430px)
    left -110px
  .user
    margin 0
    margin-top -2px
    margin-bottom -1px
</style>
