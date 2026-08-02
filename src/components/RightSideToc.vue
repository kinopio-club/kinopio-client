<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useListStore } from '@/stores/useListStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const listStore = useListStore()
const lineStore = useLineStore()

const state = reactive({
  hoverItemId: ''
})

const allItems = computed(() => {
  let lines = utils.clone(lineStore.getAllLines)
  let boxes = utils.clone(boxStore.getAllBoxes)
  let lists = utils.clone(listStore.getAllLists)
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

const colorClasses = (item) => {
  const colorClass = utils.colorClasses({ backgroundColor: item.color })
  return [colorClass]
}
const classes = (item) => {
  const classes = colorClasses(item)
  if (item.itemType === 'line') {
    classes.push('line-item')
  }
  return classes
}
const updateHoverItem = (itemId) => {
  state.hoverItemId = itemId
}
const isHoverItem = (item) => {
  return state.hoverItemId === item.id
}
const focusItem = (item) => {
  globalStore.updateFocusOnItemId(item.id)
}
</script>

<template lang="pug">
nav.right-side-toc
  template(v-for="item in allItems" :key="item.id")
    .badge.button-badge.info(
      :class="classes(item)"
      :style="{background: item.color}"
      @click="focusItem(item)"
      @mouseover="updateHoverItem(item.id)"
      @mouseleave="updateHoverItem('')"
    )
      .row(v-show="isHoverItem(item)")
        img.icon.line-icon(src="@/assets/line.svg" v-if="item.itemType === 'line'" :class="colorClasses(item)")
        img.icon.box-icon(src="@/assets/box.svg" v-if="item.itemType === 'box'" :class="colorClasses(item)")
        img.icon.list-icon(src="@/assets/list.svg" v-if="item.itemType === 'list'" :class="colorClasses(item)")
        span {{item.name}}
</template>

<style lang="stylus">
.right-side-toc
  position fixed
  right 0
  left initial
  top 40%
  display flex
  flex-direction column
  align-content flex-end
  .badge
    cursor pointer
    transition 0.2s all
    width fit-content
    margin-left auto
    &.line-item
      border-radius 100px
    .row
      display flex
      align-items center
  .badge + .badge
    margin-top 4px
</style>
