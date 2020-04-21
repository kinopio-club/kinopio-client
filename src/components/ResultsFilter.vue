<template lang="pug">
.filter-wrap(v-if="shouldShowFilter")
  img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
  input(placeholder="Search" v-model="filterItems" ref="filterInput")
  button.borderless.clear-input-wrap(@click="clearFilter")
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
      if (this.hideFilter) {
        return false
      } else if (this.isManyItems) {
        return true
      }
      return false
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
.filter-wrap
  margin-left 5px
  padding-top 4px
  display flex
  .search
    margin-top -11px
    padding-right 5px
    cursor text
</style>
