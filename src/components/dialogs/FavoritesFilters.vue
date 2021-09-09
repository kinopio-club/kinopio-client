<template lang="pug">
dialog.narrow.favorites-filters(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p
      img.icon.heart(src="@/assets/heart.svg")
      span Spaces Filter
  section
    .segmented-buttons
      button(@click="showAllSpaces" :class="{active: all}") All
      button(@click="showJournalsOnly" :class="{active: journals}")
        span Journals
      button(@click="showSpacesOnly" :class="{active: spaces}") Spaces

</template>

<script>

export default {
  name: 'FavoritesFilters',
  props: {
    visible: Boolean,
    favoritesFilter: String
  },
  data () {
    return {
      // moonPhase: {}
    }
  },
  computed: {
    all () {
      return Boolean(!this.favoritesFilter)
    },
    journals () {
      return this.favoritesFilter === 'journals'
    },
    spaces () {
      return this.favoritesFilter === 'spaces'
    }
  },
  methods: {
    showJournalsOnly () {
      this.$emit('updateFavoritesFilter', 'journals')
    },
    showSpacesOnly () {
      this.$emit('updateFavoritesFilter', 'spaces')
    },
    showAllSpaces () {
      this.$emit('updateFavoritesFilter', null)
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>
