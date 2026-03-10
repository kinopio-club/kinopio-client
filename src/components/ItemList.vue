<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

// let unsubscribes

onMounted(() => {
  // allItems
  // console.info('🐴 the component is now mounted.', spaceStore.getSpaceAllState)
//   const globalActionUnsubscribe = globalStore.$onAction(
//     ({ name, args }) => {
//       if (name === 'clearDraggingItems') {
//         console.log('clearDraggingItems')
//       }
//     }
//   )
//   unsubscribes = () => {
//     globalActionUnsubscribe()
//   }
// })
// onBeforeUnmount(() => {
//   unsubscribes()
  console.log('👄👄👄', allItems.value)
})

const emit = defineEmits(['selectItem'])

const props = defineProps({
  lines: {
    type: Array,
    default: () => []
  },
  lists: {
    type: Array,
    default: () => []
  },
  boxes: {
    type: Array,
    default: () => []
  }
})

const allItems = computed(() => {
  let lines = utils.clone(props.lines)
  let boxes = utils.clone(props.boxes)
  let lists = utils.clone(props.lists)
  lines = lines.map(line => {
    line.itemType = 'line'
    return line
  })
  lists = lists.map(list => {
    list.itemType = 'list'
    return list
  })
  boxes = boxes.map(box => {
    box.itemType = 'box'
    return box
  })

  let items = lines.concat(lists, boxes)
  items = utils.sortByY(items)
  return items
})

// const placeholderIsVisible = computed(() => {
//   return
//   return !lines.value.length && !boxes.value.length && !lists.value.length
// })

// const state = reactive({
//   count: 0
// })

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.info('💁‍♀️', value)
//   }
// })
</script>

<template lang="pug">
section.results-section.item-list(v-if="allItems.length")
  //- v for item in allitems
    //- v-if item.itemType is box..
    //- LineListItem
    //- BoxListItem
    //- ListListItem

section.badge.secondary(v-if="!allItems.length")
  span No lines, lists, or boxes in this space yet
</template>

<style lang="stylus">
// .component-name
</style>
