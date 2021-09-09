<template lang="pug">
dialog.narrow.favorites-filters(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p
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
    visible: Boolean,
    favoritesFilter: String
  },
  computed: {
    currentUser () { return this.$store.state.currentUser },
    all () {
      return Boolean(!this.favoritesFilter)
    },
    current () {
      return this.favoritesFilter === 'currentUser'
    },
    others () {
      return this.favoritesFilter === 'otherUsers'
    }
  },
  methods: {
    showCurrentUserSpacesOnly () {
      this.$emit('updateFavoritesFilter', 'currentUser')
    },
    showOtherUserSpacesOnly () {
      this.$emit('updateFavoritesFilter', 'otherUsers')
    },
    showAll () {
      this.$emit('updateFavoritesFilter', null)
    }
  }
}
</script>

<style lang="stylus" scoped>
.favorites-filters
  .user
    margin 0
    margin-top -2px
    margin-bottom -1px
</style>
