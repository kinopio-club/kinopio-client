<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const listStore = useListStore()
const lineStore = useLineStore()
const userStore = useUserStore()

let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerTocLabelsIsVisible') {
        toggleTocLabelsIsVisible()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  hoverItemId: '',
  tocLabelsIsVisible: false
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
const focusItem = (item) => {
  globalStore.updateFocusOnItemId(item.id)
}

// toc labels

const updateHoverItem = (itemId) => {
  state.hoverItemId = itemId
}
const shouldIncreaseUIContrast = computed(() => userStore.shouldIncreaseUIContrast)
const shouldShowLabel = (item) => {
  if (state.tocLabelsIsVisible) { return true }
  return state.hoverItemId === item.id
}
const toggleTocLabelsIsVisible = () => {
  state.tocLabelsIsVisible = !state.tocLabelsIsVisible
}
</script>

<template lang="pug">
nav.right-side-toc
  template(v-for="item in allItems" :key="item.id")
    .badge-wrap(
      @click="focusItem(item)"
      @mouseover="updateHoverItem(item.id)"
      @mouseleave="updateHoverItem('')"
    )
      .badge.button-badge.info(
        :class="classes(item)"
        :style="{background: item.color}"
      )
        .row(v-show="shouldShowLabel(item)")
          //- img.icon.line-icon(src="@/assets/line.svg" v-if="item.itemType === 'line'" :class="colorClasses(item)")
          //- img.icon.box-icon(src="@/assets/box.svg" v-if="item.itemType === 'box'" :class="colorClasses(item)")
          //- img.icon.list-icon(src="@/assets/list.svg" v-if="item.itemType === 'list'" :class="colorClasses(item)")
          span.name {{item.name}}

  button.small-button.toc-button(
    v-if="allItems.length"
    @click.stop="toggleTocLabelsIsVisible"
    @touchend.stop
    :class="{'hidden': state.isHiddenOnTouch, 'active': state.tocLabelsIsVisible, 'translucent-button': !shouldIncreaseUIContrast}"
    title="Toggle TOC Labels (C)"
  )
    img.icon.toc(src="@/assets/toc.svg")
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

  .badge-wrap
    .badge
      cursor pointer
      width fit-content
      height 18px
      margin-left auto
      // max-width 200px
      // ellipse truncate
      &.line-item
        border-radius 100px
      .row
        display flex
        align-items center
        span.name
          margin-top -2px
          padding 0 2px
  .badge-wrap + .badge-wrap
    padding-top 4px

  .toc-button
    width 19px
    margin-left auto
    margin-right 4px
    margin-top 4px
    .icon.toc
      transform translateY(-1px)
</style>
