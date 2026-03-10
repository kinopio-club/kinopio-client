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

const selectItem = (item) => {
  emit('selectItem', item)
}

// styles

const boxBadgeStyles = (box) => {
  return {
    border: `1px solid ${box.color}`,
    borderTop: `8px solid ${box.color}`
  }
}
const badgeColorClasses = (line) => {
  return utils.colorClasses({ backgroundColor: line.color })
}
</script>

<template lang="pug">
ul.results-list.item-list(v-if="allItems.length")
  template(v-for="item in allItems" :key="item.id")
    //- box item
    template(v-if="item.itemType === 'box'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        .box-badge.badge(:style="boxBadgeStyles(item)")
          .box-info(:style="{backgroundColor: item.color}")
          .box-fill(:style="{backgroundColor: item.color}")
        span {{item.name}}
    //- line item
    template(v-if="item.itemType === 'line'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        .badge-horizontal-line(:style="{ background: item.color }")
        .badge.button-badge(:style="{background: item.color}" :class="badgeColorClasses(item)")
          span {{ item.name }}
    //- list item
    template(v-if="item.itemType === 'list'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        .badge.button-badge(:style="{background: item.color}" :class="badgeColorClasses(item)")
          span {{ item.name }}

.badge.secondary(v-if="!allItems.length")
  span No lines, lists, or boxes in this space yet
</template>

<style lang="stylus">
.item-list
  .box-badge
    padding 1px 4px
    overflow hidden
    .box-fill
      top 0
      left 0
      width 100%
      height 100%
      position absolute
      opacity 0.5
  .badge-horizontal-line
    position absolute
    left 0
    top 17px
    width 100%
    height 1px

</style>
