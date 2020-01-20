<template lang="pug">
dialog.search(v-if="visible" :open="visible")
  section.results-section
    .filter-wrap
      img.icon.search(src="@/assets/search.svg" @click="focusSearchInput")
      input(placeholder="Search Spaces and Cards" v-model="searchField" ref="searchInput")
  p laskjf

</template>

<script>
// import Loader from '@/components/Loader.vue'

export default {
  name: 'Search',
  // components: {
  //   Loader
  // },
  data () {
    return {
      searchString: ''
      // loadingSignUpOrIn: false
    }
  },
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //     }
  //   })
  // },
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
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.focusSearchInput()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
dialog.search
  width 94%
  max-width 300px
  // margin-left auto
  // margin-right auto
  position fixed
  left 25px
  top 31px
  padding-top 4px
  z-index 13

  // background cyan
</style>
