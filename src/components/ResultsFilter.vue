<template lang="pug">
.search-wrap(v-if="shouldShowFilter")
  img.icon.search(src="@/assets/search.svg" @click.left="focusFilterInput")
  input(placeholder="Search" v-model="filterItems" ref="filterInput")
  button.borderless.clear-input-wrap(@click.left="clearFilter")
    img.icon(src="@/assets/add.svg")

</template>

<script>
import fuzzy from 'fuzzy'

export default {
  name: 'ResultsFilter',
  props: {
    hideFilter: Boolean,
    items: Array
  },
  data () {
    return {
      filter: '',
      filteredItems: []
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.clearFilter()
      }
      if (mutation.type === 'triggerSelectTemplateCategory') {
        this.clearFilter()
      }
    })
  },
  computed: {
    shouldShowFilter () {
      if (this.hideFilter || !this.isManyItems) {
        return false
      } else {
        return true
      }
    },
    isManyItems () { return Boolean(this.items.length >= 5) },
    filterItems: {
      get () {
        return this.filter
      },
      set (newValue) {
        this.filter = newValue
        this.$emit('updateFilter', this.filter)
        const options = {
          pre: '',
          post: '',
          extract: (item) => {
            let name = item.name || ''
            return name
          }
        }
        const filtered = fuzzy.filter(this.filter, this.items, options)
        const items = filtered.map(item => item.original)
        this.$emit('updateFilteredItems', items)
      }
    }
  },
  methods: {
    focusFilterInput () {
      const element = this.$refs.filterInput
      element.focus()
      element.setSelectionRange(0, 0)
    },
    clearFilter () {
      this.filter = ''
      this.$emit('updateFilter', this.filter)
      this.$emit('updateFilteredItems', [])
    }
  }
}
</script>

<style lang="stylus">
</style>
