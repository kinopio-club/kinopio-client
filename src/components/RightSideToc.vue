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
      } else if (name === 'closeAllDialogs') {
        state.tocLabelsIsVisible = false
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

const isLine = (item) => {
  return item.itemType === 'line'
}
const isBox = (item) => {
  return item.itemType === 'box'
}
const colorClasses = (item) => {
  const colorClass = utils.colorClasses({ backgroundColor: item.color })
  const classes = [colorClass]
  return classes
}
const classes = (item) => {
  const classes = colorClasses(item)
  if (isLine(item)) {
    classes.push('line-item')
  }
  if (isBox(item)) {
    classes.push('box-item')
  }
  if (item.id === state.hoverItemId) {
    classes.push('button-badge')
  }
  if (shouldShowLabel(item)) {
    classes.push('should-show-label')
  }
  return classes
}
const focusItem = (item) => {
  globalStore.updateFocusOnItemId(item.id)
  state.tocLabelsIsVisible = true
}

// collapsed

const shouldDisplayCollapsed = computed(() => {
  const distanceBetweenItems = 4
  const itemHeight = 18 + distanceBetweenItems
  const tocHeight = (allItems.value.length + 1) * itemHeight
  let header = document.querySelector('header')
  if (!header) { return }
  let footer = document.querySelector('.footer-wrap')
  header = header.getBoundingClientRect()
  footer = footer.getBoundingClientRect()
  let minimapHeight = 0
  if (userStore.shouldShowMinimap) {
    let minimap = document.querySelector('#space-minimap')
    minimap = minimap.getBoundingClientRect()
    minimapHeight = minimap.height
  }
  const availableHeight = globalStore.viewportHeight - header.height - footer.height - minimapHeight
  return tocHeight > availableHeight
})
const triggerTocIsVisible = () => {
  globalStore.triggerTocIsVisible()
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
  if (shouldDisplayCollapsed.value) {
    triggerTocIsVisible()
  } else {
    state.tocLabelsIsVisible = !state.tocLabelsIsVisible
  }
}
</script>

<template lang="pug">
nav.right-side-toc
  //- collapsed
  template(v-if="shouldDisplayCollapsed")
    .button-wrap.toc-button-wrap
      button.small-button.toc-button(
        v-if="allItems.length"
        @click.stop="triggerTocIsVisible"
        @touchend.stop
        :class="{'hidden': state.isHiddenOnTouch, 'active': state.tocLabelsIsVisible, 'translucent-button': !shouldIncreaseUIContrast}"
        title="Toggle TOC Labels (C)"
      )
        img.icon.toc(src="@/assets/toc.svg")
        .badge.info.label-badge.label-badge {{allItems.length}}

  //- full height list
  template(v-else)
    template(v-for="item in allItems" :key="item.id")
      .badge-wrap(
        @click="focusItem(item)"
        @mouseover="updateHoverItem(item.id)"
        @mouseleave="updateHoverItem('')"
      )
        .badge.toc-item-badge(
          :class="classes(item)"
          :style="{background: item.color}"
        )
          .row(v-if="shouldShowLabel(item)")
            span.name {{item.name}}
          .line-marker(v-if="isLine(item)" :style="{background: item.color}")
</template>

<style lang="stylus">
:root
  --badge-distance-right 12px

.right-side-toc
  pointer-events none
  position fixed
  right 0
  left initial
  top 50%
  transform translateY(-50%)
  display flex
  flex-direction column
  align-content flex-end

  // collapsed
  .label-badge
    font-size 12px
    height: fit-content;
    min-height: inherit;
    bottom -12px
    margin 0
    left -3px

  // full height list
  .badge-wrap
    pointer-events all
    width fit-content
    margin-left auto
    .toc-item-badge
      pointer-events all
      cursor pointer
      margin-left auto
      width max-content
      min-width 12px
      height fit-content
      min-height 12px
      max-height 18px
      margin-right var(--badge-distance-right)
      &.box-item
        border-radius 2px
      .row
        display flex
        align-items center
        span.name
          margin-top -2px
          padding 0 2px
          max-width 200px
          white-space nowrap
          overflow hidden
          text-overflow ellipsis
      .line-marker
        height 1px
        width 12px
        position absolute
        right calc(var(--badge-distance-right) * -1)
        top 5px
      &.button-badge,
      &.should-show-label
        .line-marker
          top 8px

  .badge-wrap + .badge-wrap
    padding-top 4px

  .toc-button-wrap
    pointer-events all
    width max-content
    margin-left auto
  .toc-button
    min-width 19px
    margin-right 8px
    margin-top 4px
    .icon.toc
      transform translateY(-1px)
</style>
