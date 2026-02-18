<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const listStore = useListStore()
const userStore = useUserStore()

let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name }) => {
      if (name === 'triggerSelectedItemsAlignLeft') {
        alignLeft()
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

const props = defineProps({
  visible: Boolean,
  shouldHideMoreOptions: Boolean,
  shouldDistributeWithAlign: Boolean,
  canEditAll: Object,
  cards: Array,
  editableCards: Array,
  connections: Array,
  boxes: Array,
  editableBoxes: Array,
  lists: Array
})

const spaceCounterZoomDecimal = computed(() => globalStore.getSpaceCounterZoomDecimal)
const moreOptionsIsVisible = computed(() => userStore.shouldShowMoreAlignOptions)
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const spaceBetween = computed(() => consts.spaceBetweenCards * spaceCounterZoomDecimal.value)

const toggleMoreOptionsIsVisible = () => {
  userStore.updateUser({ shouldShowMoreAlignOptions: !moreOptionsIsVisible.value })
}
const ySpaceBetweenCards = (item) => {
  let value = consts.spaceBetweenCards
  if (item?.counterIsVisible) { value += 10 }
  return value
}
const canEdit = computed(() => {
  if (props.lists.length) { return props.canEditAll.all }
  return props.canEditAll.cards
})

// All items unified

const normalizeDimensions = (items) => {
  return utils.clone(items).map(item => {
    item.width = item.resizeWidth || item.width
    item.height = item.resizeHeight || item.height
    return item
  })
}
const tagItemTypes = (items, type) => items.map(item => ({ ...item, _type: type }))

const allItems = computed(() => {
  const cards = tagItemTypes(normalizeDimensions(props.editableCards), 'cards')
  const boxes = tagItemTypes(normalizeDimensions(props.editableBoxes), 'boxes')
  const lists = tagItemTypes(normalizeDimensions(props.lists), 'lists')
  return cards.concat(boxes, lists)
})

// verify positioning
const allItemsForVerify = computed(() => {
  const cards = tagItemTypes(normalizeDimensions(props.cards), 'cards')
  const boxes = tagItemTypes(normalizeDimensions(props.boxes), 'boxes')
  const lists = tagItemTypes(normalizeDimensions(props.lists), 'lists')
  return cards.concat(boxes, lists)
})

// disabled

const filterItems = (items) => {
  return items.filter(item => {
    const isUser = item.userId === userStore.id
    const isInList = Boolean(item.listId)
    if (isSpaceMember.value) {
      return !isInList
    } else {
      return isUser && !isInList
    }
  })
}
const isDistributeDisabled = computed(() => {
  const minimumRequired = 3
  const cards = filterItems(props.cards)
  const boxes = filterItems(props.boxes)
  const lists = props.lists
  return cards.length < minimumRequired && boxes.length < minimumRequired && lists.length < minimumRequired
})

// sort

const sortByXWidth = (items) => items.slice().sort((a, b) => (b.x + b.width) - (a.x + a.width))
const sortByYHeight = (items) => items.slice().sort((a, b) => (b.y + b.height) - (a.y + a.height))

const sortedByX = computed(() => utils.sortByX(utils.clone(allItems.value)))
const sortedByY = computed(() => utils.sortByY(utils.clone(allItems.value)))
const sortedByXWidth = computed(() => sortByXWidth(allItems.value))
const sortedByYHeight = computed(() => sortByYHeight(allItems.value))

// verify positioning

const yIsDistributed = computed(() => {
  if (!props.shouldDistributeWithAlign) { return true }
  const items = utils.sortByY(utils.clone(allItemsForVerify.value))
  let isDistributed = true
  items.forEach((item, index) => {
    if (index > 0) {
      const previousItem = items[index - 1]
      const rect = utils.cardElementDimensions({ id: previousItem.id }) || utils.boxElementDimensions({ id: previousItem.id }) || previousItem
      const previousBottomSide = previousItem.y + rect.height
      const yDelta = item.y - previousBottomSide
      if (!utils.isBetween({ value: Math.abs(yDelta), min: consts.spaceBetweenCards - 1, max: consts.spaceBetweenCards + 1 })) {
        isDistributed = false
      }
    }
  })
  return isDistributed
})
const xIsDistributed = computed(() => {
  if (!props.shouldDistributeWithAlign) { return true }
  const items = utils.sortByX(utils.clone(allItemsForVerify.value))
  let isDistributed = true
  items.forEach((item, index) => {
    if (index > 0) {
      const previousItem = items[index - 1]
      const rect = utils.cardElementDimensions({ id: previousItem.id }) || utils.boxElementDimensions({ id: previousItem.id }) || previousItem
      const previousRightSide = previousItem.x + rect.width
      const xDelta = item.x - previousRightSide
      if (!utils.isBetween({ value: Math.abs(xDelta), min: consts.spaceBetweenCards - 1, max: consts.spaceBetweenCards + 1 })) {
        isDistributed = false
      }
    }
  })
  return isDistributed
})
const isLeftAligned = computed(() => {
  const xValues = allItemsForVerify.value.map(item => item.x)
  return xValues.every(x => x === xValues[0]) && yIsDistributed.value
})
const isCenteredHorizontally = computed(() => {
  const items = utils.sortByX(utils.clone(allItemsForVerify.value))
  if (!items.length) { return }
  const origin = items[0]
  const centerX = origin.x + (origin.width / 2)
  return items.every(item => utils.isBetween({ value: item.x + (item.width / 2), min: centerX - 1, max: centerX + 1 }))
})
const isRightAligned = computed(() => {
  const items = allItemsForVerify.value
  if (!items.length) { return }
  const xRight = items[0].x + items[0].width
  return items.every(item => utils.isBetween({ value: item.x + item.width, min: xRight - 1, max: xRight + 1 }))
})
const isDistributedHorizontally = computed(() => {
  if (allItemsForVerify.value.length < 3) { return }
  const items = utils.sortByX(utils.clone(allItemsForVerify.value))
  const distances = xDistancesBetween(items)
  const base = Math.abs(distances[0])
  return distances.every(d => utils.isBetween({ value: Math.abs(d), min: base - 1, max: base + 1 }))
})
const isTopAligned = computed(() => {
  const yValues = allItemsForVerify.value.map(item => item.y)
  return yValues.every(y => y === yValues[0]) && xIsDistributed.value
})
const isCenteredVertically = computed(() => {
  const items = utils.sortByY(utils.clone(allItemsForVerify.value))
  if (!items.length) { return }
  const origin = items[0]
  const centerY = origin.y + (origin.height / 2)
  return items.every(item => utils.isBetween({ value: item.y + (item.height / 2), min: centerY - 1, max: centerY + 1 }))
})
const isBottomAligned = computed(() => {
  const items = allItemsForVerify.value
  if (!items.length) { return }
  const yBottom = items[0].y + items[0].height
  return items.every(item => utils.isBetween({ value: item.y + item.height, min: yBottom - 1, max: yBottom + 1 }))
})
const isDistributedVertically = computed(() => {
  if (allItemsForVerify.value.length < 3) { return }
  const items = utils.sortByY(utils.clone(allItemsForVerify.value))
  const distances = yDistancesBetween(items)
  const base = distances[0]
  return distances.every(d => utils.isBetween({ value: Math.abs(d), min: base - 1, max: base + 1 }))
})

// update items

const updateItem = (item) => {
  const type = item._type
  if (type === 'cards' && !item.listId) {
    cardStore.updateCard(item)
  }
  if (type === 'boxes') {
    boxStore.updateBox(item)
  }
  if (type === 'lists') {
    listStore.updateList(item)
    cardStore.updateCardPositionsInList(item)
  }
}
const updateCardDimensions = async () => {
  await nextTick()
  const ids = props.cards.map(card => card.id)
  await cardStore.updateCardsDimensions(ids)
  await nextTick()
  await nextTick()
}
const updateConnectionPaths = async () => {
  await updateCardDimensions()
  const alignableItemIds = globalStore.multipleCardsSelectedIds.concat(globalStore.multipleBoxesSelectedIds)
  connectionStore.updateConnectionPathsByItemIds(alignableItemIds)
}

// get element dimensions

const getItemDimensions = (item) => {
  return utils.cardElementDimensions({ id: item.id }) ||
    utils.boxElementDimensions({ id: item.id }) ||
    utils.listElementDimensions({ id: item.id }) ||
    item
}

// align and distribute actions (all items together)

// |o
const alignLeft = () => {
  const items = sortedByY.value
  const origin = items[0]
  const newItems = []
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.x = origin.x
      if (props.shouldDistributeWithAlign) {
        const previousItem = newItems[index - 1]
        const rect = getItemDimensions(previousItem)
        item.y = previousItem.y + rect.height + ySpaceBetweenCards(previousItem)
      }
      updateItem(item)
    }
    newItems.push(item)
  })
  updateConnectionPaths()
}

// ⎺o
const alignTop = () => {
  const items = sortedByX.value
  const origin = items[0]
  const newItems = []
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.y = origin.y
      if (props.shouldDistributeWithAlign) {
        const previousItem = newItems[index - 1]
        const rect = getItemDimensions(previousItem)
        item.x = previousItem.x + rect.width + consts.spaceBetweenCards
      }
      updateItem(item)
    }
    newItems.push(item)
  })
  updateConnectionPaths()
}

// o|o
const centerHorizontally = () => {
  const items = sortedByX.value
  const origin = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      const previousItem = items[index - 1]
      item = utils.clone(item)
      item.x = origin.x + (origin.width / 2) - (item.width / 2)
      if (props.shouldDistributeWithAlign) {
        item.y = previousItem.y + previousItem.height + spaceBetween.value
      }
      updateItem(item)
    }
  })
  updateConnectionPaths()
}

// o|
const alignRight = () => {
  const items = sortedByXWidth.value
  const origin = items[0]
  if (!origin) { return }
  const originRect = getItemDimensions(origin)
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      const rect = getItemDimensions(item)
      item.x = origin.x + originRect.width - rect.width
      updateItem(item)
    }
  })
  updateConnectionPaths()
}

// | o |
const distributeHorizontally = () => {
  const items = sortedByX.value
  if (!items.length) { return }
  const distances = xDistancesBetween(items)
  const distance = utils.averageOfNumbers(distances)
  let previousItem = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.x = previousItem.x + previousItem.width + distance
      previousItem = item
      updateItem(item)
    }
  })
  updateConnectionPaths()
}

// o-o
const centerVertically = () => {
  const items = sortedByX.value
  const origin = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.y = origin.y + (origin.height / 2) - (item.height / 2)
      if (props.shouldDistributeWithAlign) {
        const previousItem = items[index - 1]
        item.x = previousItem.x + previousItem.width + spaceBetween.value
      }
      updateItem(item)
    }
  })
  updateConnectionPaths()
}

// _o
const alignBottom = () => {
  const items = sortedByYHeight.value
  const origin = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.y = origin.y + origin.height - item.height
      if (props.shouldDistributeWithAlign) {
        const previousItem = items[index - 1]
        item.x = previousItem.x + previousItem.width + spaceBetween.value
      }
      updateItem(item)
    }
  })
  updateConnectionPaths()
}

// ⎺ o _
const distributeVertically = () => {
  const items = sortedByY.value
  if (!items.length) { return }
  const distances = yDistancesBetween(items)
  const distance = Math.round(utils.averageOfNumbers(distances))
  let previousItem = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.y = previousItem.y + previousItem.height + distance
      previousItem = item
      updateItem(item)
    }
  })
  updateConnectionPaths()
}

// distances between

const xDistancesBetween = (items) => {
  const distances = []
  items.forEach((item, index) => {
    if (index > 0) {
      const prev = items[index - 1]
      distances.push(item.x - (prev.x + prev.width))
    }
  })
  return distances
}
const yDistancesBetween = (items) => {
  const distances = []
  items.forEach((item, index) => {
    if (index > 0) {
      const prev = items[index - 1]
      distances.push(item.y - (prev.y + prev.height))
    }
  })
  return distances
}
</script>

<template lang="pug">
.align-and-distribute(v-if="visible")
  .segmented-buttons(v-if="shouldHideMoreOptions")
    //- |o
    button(title="Align Left and Distribute" :disabled="!canEdit" @click.left="alignLeft" :class="{active: isLeftAligned}")
      img.icon(src="@/assets/align-left-distributed.svg")
    //- ⎺o
    button(title="Align Top and Distribute" :disabled="!canEdit" @click.left="alignTop" :class="{active: isTopAligned}")
      img.icon.align-top(src="@/assets/align-left-distributed.svg")
    button(title="More Options" :disabled="!canEdit" @click.left="toggleMoreOptionsIsVisible" :class="{active: moreOptionsIsVisible}")
      img.icon.down-arrow(src="@/assets/down-arrow.svg")

  //- More Options
  .more-options(v-if="visible && !shouldHideMoreOptions")
    .segmented-buttons.first-row
      //- |o
      button(title="Align Left" :disabled="!canEdit" @click.left="alignLeft" :class="{active: isLeftAligned}")
        img.icon(src="@/assets/align-left.svg")
      //- o|o
      button(title="Center Horizontally" :disabled="!canEdit" @click.left="centerHorizontally" :class="{active: isCenteredHorizontally}")
        img.icon(src="@/assets/center-horizontally.svg")
      //- o|
      button(title="Align Right" :disabled="!canEdit" @click.left="alignRight" :class="{active: isRightAligned}")
        img.icon.align-right(src="@/assets/align-left.svg")
      //- | o |
      button(title="Distribute Horizontally" :disabled="isDistributeDisabled" @click.left="distributeHorizontally" :class="{active: isDistributedHorizontally}")
        img.icon(src="@/assets/distribute-horizontally.svg")
    .segmented-buttons.last-row
      //- ⎺o
      button(title="Align Top" :disabled="!canEdit" @click.left="alignTop" :class="{active: isTopAligned}")
        img.icon.align-top(src="@/assets/align-left.svg")
      //- o-o
      button(title="Center Vertically" :disabled="!canEdit" @click.left="centerVertically" :class="{active: isCenteredVertically}")
        img.icon.center-vertically(src="@/assets/center-horizontally.svg")
      //- _o
      button(title="Align Bottom" :disabled="!canEdit" @click.left="alignBottom" :class="{active: isBottomAligned}")
        img.icon.align-bottom(src="@/assets/align-left.svg")
      //- ⎺ o _
      button(title="Distribute Vertically" :disabled="isDistributeDisabled" @click.left="distributeVertically" :class="{active: isDistributedVertically}")
        img.icon.distribute-vertically(src="@/assets/distribute-horizontally.svg")
</template>

<style lang="stylus">
.align-and-distribute
  .down-arrow
    padding 0
    vertical-align 2px
  .up-arrow
    transform rotate(180deg)

  .align-top
    transform rotate(90deg)
  .align-bottom
    transform rotate(-90deg)
  .align-right
    transform rotate(180deg)
  .center-vertically
    transform rotate(-90deg)
  .distribute-vertically
    transform rotate(90deg)
  .more-options
    margin 0
    margin-top 10px
</style>
