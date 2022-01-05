<template lang="pug">
.search-wrap.results-filter(v-if="shouldShowFilter" @mouseup.stop @touchend.stop ref="element")
  template(v-if="isLoading")
    Loader(:visible="true")
  template(v-else)
    img.icon.search(src="@/assets/search.svg" @click.left="focusFilterInput")

  input(
    :placeholder="inputPlaceholder"
    v-model="filterItems"
    ref="filterInput"
    @focus="resetPinchCounterZoomDecimal"
    @blur="triggerUpdatePositionInVisualViewport"
    @keydown.down.exact="focusNextItem"
    @keydown.up.exact="focusPreviousItem"
    @keydown.enter.exact.stop.prevent="selectItem"
    @keyup.space.prevent
    @keyup.backspace.stop
    @keyup.delete.stop
    @keyup.clear.stop
  )
  button.borderless.clear-input-wrap(@click.left="clearFilter")
    img.icon(src="@/assets/add.svg")
</template>

<script>
import Loader from '@/components/Loader.vue'

import fuzzy from 'fuzzy'

export default {
  name: 'ResultsFilter',
  components: {
    Loader
  },
  props: {
    hideFilter: Boolean,
    showFilter: Boolean,
    filterIsPersistent: Boolean,
    items: Array,
    placeholder: String,
    initialValue: String,
    isLoading: Boolean,
    parentIsPinned: Boolean
  },
  data () {
    return {
      filter: '',
      filteredItems: [],
      forceShowFilter: false
    }
  },
  created () {
    if (this.initialValue) {
      this.filter = this.initialValue
    }
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        const element = this.$refs.element
        if (!element) { return }
        if (this.filterIsPersistent) { return }
        if (this.parentIsPinned) { return }
        this.clearFilter()
      }
      if (mutation.type === 'triggerSelectTemplateCategory') {
        this.clearFilter()
      }
      if (mutation.type === 'triggerFocusResultsFilter') {
        this.forceShowFilter = true
        this.$nextTick(() => {
          this.focusFilterInput()
        })
      }
    })
  },
  computed: {
    inputPlaceholder () {
      return this.placeholder || 'Search'
    },
    shouldShowFilter () {
      if (this.showFilter || this.forceShowFilter) {
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
      element.setSelectionRange(0, 99999)
    },
    clearFilter () {
      this.filter = ''
      this.$emit('updateFilter', this.filter)
      this.$emit('updateFilteredItems', [])
      this.$emit('clearFilter')
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    triggerUpdatePositionInVisualViewport () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    focusNextItem () {
      this.$emit('focusNextItem')
    },
    focusPreviousItem () {
      this.$emit('focusPreviousItem')
    },
    selectItem () {
      this.$emit('selectItem')
    }
  }
}
</script>

<style lang="stylus">
.results-filter
  .loader
    width 13px
    height 14px
    margin-right 3px
    flex-shrink 0
    margin-top 2px
</style>
