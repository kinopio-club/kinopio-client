<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import CardListItem from '@/components/CardListItem.vue'
import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'

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
  },
  cards: {
    type: Array,
    default: () => []
  }
})

const canEditSpace = computed(() => userStore.getUserCanEditSpace)

// adopted from CardList.vue
const normalizedCards = computed(() => {
  const items = utils.clone(props.cards)
  return items.map(card => {
    card = cardStore.cardWithNameSegments(card, true)
    card.user = spaceStore.getSpaceUserById(card.userId)
    globalStore.updateOtherUsers(card.user)
    if (!card.user) {
      card.user = {
        id: '',
        name: '',
        color: undefined
      }
    }
    return card
  })
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
  const cards = normalizedCards.value.map(card => {
    card.itemType = 'card'
    card.user = {
      id: card.userId
    }
    return card
  })
  let items = lines.concat(lists, boxes, cards)
  items = utils.sortByY(items)
  return items
})

const boxIsTodo = (box) => {
  return Boolean(utils.checkboxFromString(box.name))
}
const boxName = (box) => {
  const checkbox = utils.checkboxFromString(box.name)
  if (checkbox) {
    return box.name.replace(checkbox, '')
  } else {
    return box.name
  }
}

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
const badgeColorClasses = (item) => {
  return utils.colorClasses({ backgroundColor: item.color || item.backgroundColor })
}
</script>

<template lang="pug">
ul.results-list.item-list(v-if="allItems.length")
  template(v-for="item in allItems" :key="item.id")
    //- box
    template(v-if="item.itemType === 'box'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        ItemCheckboxButton(:visible="boxIsTodo(item)" :box="item" :canEditItem="canEditSpace" :parentIsList="true")
        .box-badge.badge(:style="boxBadgeStyles(item)")
          .box-info(:style="{backgroundColor: item.color}")
          .box-fill(:style="{backgroundColor: item.color}")
        span {{ boxName(item) }}
    //- line
    template(v-if="item.itemType === 'line'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        .badge-horizontal-line(:style="{ background: item.color }")
        .badge.button-badge(:style="{background: item.color}" :class="badgeColorClasses(item)")
          span {{ item.name }}
    //- list
    template(v-if="item.itemType === 'list'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        .badge.button-badge(:style="{background: item.color}" :class="badgeColorClasses(item)")
          span {{ item.name }}
    //- card
    template(v-if="item.itemType === 'card'")
      CardListItem(:card="item" @selectCard="selectItem" tabindex="0" v-on:keyup.enter="selectItem(item)" :shouldHideDate="true")

.badge.secondary(v-if="!allItems.length")
  span No items in this space yet
</template>

<style lang="stylus">
.item-list
  .box-badge
    padding 1px 4px
    overflow hidden
    margin-top -1px
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
