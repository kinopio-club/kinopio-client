<template lang="pug">
.search-wrap(v-if="shouldShowFilter" @mouseup.stop @touchend.stop)
  img.icon.search(src="@/assets/search.svg" @click.left="focusFilterInput")
  input(:placeholder="inputPlaceholder" v-model="filterItems" ref="filterInput" @focus="resetPinchCounterZoomDecimal" @blur="triggerUpdatePositionInVisualViewport")
  button.borderless.clear-input-wrap(@click.left="clearFilter")
    img.icon(src="@/assets/add.svg")

</template>

<script>
import fuzzy from 'fuzzy'

export default {
  name: 'ResultsFilter',
  props: {
    hideFilter: Boolean,
    showFilter: Boolean,
    items: Array,
    placeholder: String
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
      if (mutation.type === 'triggerFocusSpaceDetailsFilter') {
        this.focusFilterInput()
      }
    })
  },
  computed: {
    inputPlaceholder () {
      return this.placeholder || 'Search'
    },
    shouldShowFilter () {
      if (this.showFilter) {
        return true
      } else if (this.hideFilter || !this.isManyItems) {
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
      if (!element) { return }
      element.focus()
      element.setSelectionRange(0, 0)
    },
    clearFilter () {
      this.filter = ''
      this.$emit('updateFilter', this.filter)
      this.$emit('updateFilteredItems', [])
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    triggerUpdatePositionInVisualViewport () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    }
  }
}
</script>

<style lang="stylus">
</style>
