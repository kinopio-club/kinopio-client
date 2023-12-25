<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
const store = useStore()

const emit = defineEmits(['select'])

const props = defineProps({
  resultsFilterIsVisible: Boolean,
  connectionTypes: Array,
  connections: Array,
  isDisabled: Boolean
})
const state = reactive({
  filter: '',
  filteredConnectionTypes: []
})

// results filter

const updateFilter = (filter) => {
  state.filter = filter
}
const updateFilteredConnectionTypes = (types) => {
  state.filteredConnectionTypes = types
}
const connectionTypesFiltered = computed(() => {
  if (state.filter) {
    return state.filteredConnectionTypes
  } else {
    return props.connectionTypes
  }
})

// list items

const connectionTypeIsActive = (type) => {
  return Boolean(props.connections.find(connection => connection.connectionTypeId === type.id))
}
const selectType = (type) => {
  emit('select', type)
}
</script>

<template lang="pug">
ResultsFilter(v-if="resultsFilterIsVisible" :items="connectionTypes" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredConnectionTypes")
ul.results-list
  template(v-for="type in connectionTypesFiltered" :key="type.id")
    li(:class="{ active: connectionTypeIsActive(type), disabled: !isDisabled }" @click.left="selectType(type)" :data-type-id="type.id")
      .badge(:style="{backgroundColor: type.color}")
      .name {{type.name}}
</template>

<style lang="stylus">
</style>
