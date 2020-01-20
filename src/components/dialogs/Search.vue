<template lang="pug">
dialog.search(v-if="visible" :open="visible")
  section.results-section
    .filter-wrap
      img.icon.search(src="@/assets/search.svg" @click="focusSearchInput")
      input(placeholder="Search Spaces and Cards" v-model="searchField" ref="searchInput")
      button.borderless.clear-input-wrap(@click="clearSearch")
        img.icon(src="@/assets/add.svg")
    .badge.scope-label Recent Spaces
    ul.results-list
      template(v-for="(space in spaces")
        li(@click="changeSpace(space)" :class="{ active: spaceIsActive(space.id) }" :key="space.id" tabindex="0" v-on:keyup.enter="changeSpace(space)")
          .name {{space.name}}
      //- cards

//- recent spaces
</template>

<script>
import cache from '@/cache.js'
// import Loader from '@/components/Loader.vue'

export default {
  name: 'Search',
  // components: {
  //   Loader
  // },
  data () {
    return {
      searchString: '',
      spaces: []
      // cards: [], -> open space (if diff space), open card details, scroll to card
      // loadingSearching: false
    }
  },
  computed: {
    visible () {
      return this.$store.state.searchIsVisible
    },
    searchField: {
      get () {
        return this.searchString
      },
      set (newValue) {
        this.searchString = newValue
        // const options = {
        //   pre: '',
        //   post: '',
        //   extract: (space) => {
        //     return space.name
        //   }
        // }
        // const filtered = fuzzy.filter(this.filter, this.spaces, options)
        // const spaces = filtered.map(space => {
        //   return {
        //     name: space.string,
        //     id: space.original.id
        //   }
        // })
        // this.filteredSpaces = spaces
      }
    }
  },
  methods: {
    focusSearchInput () {
      const element = this.$refs.searchInput
      element.focus()
      element.setSelectionRange(0, 0)
    },
    clearSearch () {
      this.searchString = ''
    },
    async recentSpaces () {
      let userSpaces = cache.getAllSpaces().filter(space => {
        return this.$store.getters['currentUser/canEditSpace'](space)
      })
      userSpaces = userSpaces.slice(0, 5)
      this.spaces = userSpaces
    },
    spaceIsActive (spaceId) {
      const currentSpace = this.$store.state.currentSpace.id
      return Boolean(currentSpace === spaceId)
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', space)
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.recentSpaces()
          this.focusSearchInput()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
dialog.search
  // width 94%
  // max-width 300px
  // position fixed
  // left 25px
  // top 31px
  // padding-top 4px
  // z-index 13

  // background cyan
  .filter-wrap
    margin-top 4px
    // margin-left 0
  // input
  //   margin-top 4px
  .scope-label
    margin 0
    margin-bottom 5px
    // margin-left 8px
    background var(--secondary-background)
    display inline-block
    // color var(--secondary-background)
    // opacity 0.5
  // .badge
  //   display inline-block
  //   margin-bottom 10px
</style>
