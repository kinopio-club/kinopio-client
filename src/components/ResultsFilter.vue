<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import createFuzzySearch from '@nozbe/microfuzz'
import dayjs from 'dayjs'

const store = useStore()

const resultsFilterElement = ref(null)
const filterInputElement = ref(null)

let unsubscribe

onMounted(() => {
  if (props.initialValue) {
    state.filter = props.initialValue
  }
  unsubscribe = store.subscribe(async (mutation, state) => {
    if (mutation.type === 'closeAllDialogs') {
      const element = resultsFilterElement.value
      if (!element) { return }
      if (props.filterIsPersistent) { return }
      if (props.parentIsPinned) { return }
      clearFilter()
    }
    if (mutation.type === 'triggerSelectTemplateCategory') {
      clearFilter()
    }
    if (mutation.type === 'triggerFocusResultsFilter') {
      forceShowFilterState()
      await nextTick()
      focusFilterInput()
    }
  })
  clearExpiredFilter()
  autoFocus()
})
onBeforeUnmount(() => {
  unsubscribe()
})

const emit = defineEmits([
  'updateFilter',
  'updateFilteredItems',
  'clearFilter',
  'onFocus',
  'onBlur',
  'focusNextItem',
  'focusPreviousItem',
  'selectItem'
])

const props = defineProps({
  hideFilter: Boolean,
  showFilter: Boolean,
  filterIsPersistent: Boolean,
  items: Array,
  placeholder: String,
  initialValue: String,
  isLoading: Boolean,
  parentIsPinned: Boolean,
  showCreateNewSpaceFromSearch: Boolean,
  isInitialValueFromSpaceListFilterInfo: Boolean
})

const state = reactive({
  filter: '',
  forceShowFilter: false
})

const forceShowFilterState = () => {
  state.forceShowFilter = true
}

// items

const isManyItems = computed(() => Boolean(props.items.length >= 5))

// add space

const addSpaceIsVisible = computed(() => props.showCreateNewSpaceFromSearch && state.filter.length > 1)
const addSpace = async () => {
  const name = state.filter
  window.scrollTo(0, 0)
  await store.dispatch('currentSpace/addSpace', { name })
  await nextTick()
  const shouldClearFilterInfo = true
  clearFilter(shouldClearFilterInfo)
  store.commit('triggerSpaceDetailsUpdateLocalSpaces')
  store.commit('triggerFocusSpaceDetailsName')
}

// input

const clearExpiredFilter = () => {
  if (!props.isInitialValueFromSpaceListFilterInfo) { return }
  const time = 60
  const info = store.state.spaceListFilterInfo
  if (!info.filter) { return }
  let isExpired = dayjs().diff(info.updatedAt, 'seconds')
  isExpired = isExpired > time
  if (!isExpired) {
    updateFilter(info.filter)
  }
}
const inputPlaceholder = computed(() => props.placeholder || 'Search')
const shouldShowFilter = computed(() => {
  if (props.showFilter || state.forceShowFilter) {
    return true
  } else if (props.hideFilter || !isManyItems.value) {
    return false
  } else {
    return true
  }
})
const filterItems = computed({
  get () {
    return state.filter
  },
  set (newValue) {
    updateFilter(newValue)
  }
})
const autoFocus = async () => {
  if (store.state.isTouchDevice) { return }
  await nextTick()
  focusFilterInput()
}
const updateFilter = (newValue) => {
  state.filter = newValue
  emit('updateFilter', state.filter)
  const fuzzySearch = createFuzzySearch(props.items, {
    getText: (item) => [item.name, item.urlPreviewTitle, item.urlPreviewDescription]
  })
  const results = fuzzySearch(state.filter)
  const items = results.map(result => {
    let matchIndexes = []
    result.matches = result.matches.filter(match => Boolean(match))
    result.matches.forEach(match => {
      match.forEach(matchRange => {
        // match = [0, 2]
        const range = utils.generateRange(matchRange[0], matchRange[1]) // [0,1,2]
        matchIndexes = matchIndexes.concat(range)
      })
    })
    result.item.matchIndexes = matchIndexes
    return result.item
  })
  emit('updateFilteredItems', items)
}
const focusFilterInput = () => {
  const element = filterInputElement.value
  if (!element) { return }
  element.focus()
  element.setSelectionRange(0, 99999)
}
const clearFilter = (shouldClearFilterInfo) => {
  state.filter = ''
  emit('updateFilter', state.filter, true)
  emit('updateFilteredItems', [])
  emit('clearFilter')
  if (shouldClearFilterInfo) {
    store.commit('spaceListFilterInfo', {
      filter: '',
      updatedAt: new Date().getTime()
    })
  }
}

// event handlers

const focus = () => {
  emit('onFocus')
  resetPinchCounterZoomDecimal()
}
const resetPinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', 1)
}
const blur = () => {
  emit('onBlur')
  triggerUpdateHeaderAndFooterPosition()
}
const triggerUpdateHeaderAndFooterPosition = () => {
  store.commit('triggerUpdateHeaderAndFooterPosition')
}
const focusNextItem = () => {
  emit('focusNextItem')
}
const focusPreviousItem = () => {
  emit('focusPreviousItem')
}
const selectItem = () => {
  emit('selectItem')
}
</script>

<template lang="pug">
.search-wrap.results-filter(v-if="shouldShowFilter" @mouseup.stop @touchend.stop ref="resultsFilterElement")
  template(v-if="isLoading")
    Loader(:visible="true")
  template(v-else)
    img.icon.search(src="@/assets/search.svg" @click.left="focusFilterInput")
  input(
    name="filter"
    type="text"
    autocomplete="off"
    :placeholder="inputPlaceholder"
    v-model="filterItems"
    ref="filterInputElement"
    @focus="focus"
    @blur="blur"
    @keydown.down.exact="focusNextItem"
    @keydown.up.exact="focusPreviousItem"
    @keydown.enter.exact.stop.prevent="selectItem"
    @keyup.space.prevent
    @keyup.backspace.stop
    @keyup.delete.stop
    @keyup.clear.stop
  )
  button.borderless.clear-input-wrap(v-if="addSpaceIsVisible" @click="addSpace")
    img.icon.add(src="@/assets/add.svg")
  button.borderless.clear-input-wrap(@click.left="clearFilter(true)")
    img.icon.cancel(src="@/assets/add.svg")
</template>

<style lang="stylus">
.results-filter
  .loader
    width 13px
    height 14px
    margin-right 3px
    flex-shrink 0
    margin-top 2px
  .clear-input-wrap
    flex-shrink 0
    .icon
      width 8px
</style>
