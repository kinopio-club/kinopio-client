<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

import uniqBy from 'lodash-es/uniqBy'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const listStore = useListStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerSelectedItemsAlignLeft') {
        alignLeft()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onMounted(() => {
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
const multipleCardsSelectedIds = computed(() => globalStore.multipleCardsSelectedIds)
const multipleConnectionsSelectedIds = computed(() => globalStore.multipleConnectionsSelectedIds)
const multipleBoxesSelectedIds = computed(() => globalStore.multipleBoxesSelectedIds)
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const spaceBetween = computed(() => consts.spaceBetweenCards * spaceCounterZoomDecimal.value)
const items = computed(() => {
  const boxes = normalizeDimensions(props.boxes)
  const lists = normalizeDimensions(props.lists)
  return props.cards.concat(boxes, lists)
})
const toggleMoreOptionsIsVisible = () => {
  const value = !moreOptionsIsVisible.value
  userStore.updateUser({ shouldShowMoreAlignOptions: value })
}
const ySpaceBetweenCards = (card) => {
  let value = consts.spaceBetweenCards
  if (card?.counterIsVisible) {
    value += 10
  }
  return value
}
const canEdit = computed(() => {
  let value
  if (props.cards.length) {
    value = props.canEditAll.cards
  }
  // if (props.connections) {
  //   value = props.canEditAll.connections
  // }
  // if (props.boxes.length) {
  //   value = props.canEditAll.boxes
  // }
  if (props.lists.length) {
    value = props.canEditAll.all
  }
  return value
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
  const minimumRequiredToDistribute = 3
  const cards = filterItems(props.cards)
  const boxes = filterItems(props.boxes)
  const lists = props.lists
  const isCards = cards.length >= minimumRequiredToDistribute
  const isBoxes = boxes.length >= minimumRequiredToDistribute
  const isLists = lists.length >= minimumRequiredToDistribute
  const canDistribute = Boolean(isCards) || Boolean(isBoxes) || Boolean(isLists)
  return !canDistribute
})

// verify positioning

const yIsDistributed = computed(() => {
  const cards = sortedByY.value.cards
  const zoom = spaceCounterZoomDecimal.value
  let isDistributed = true
  if (props.shouldDistributeWithAlign) {
    cards.forEach((card, index) => {
      if (index > 0) {
        const previousItem = cards[index - 1]
        const rect = utils.cardElementDimensions({ id: previousItem.id }) || utils.boxElementDimensions({ id: previousItem.id }) || previousItem
        const previousItemHeight = rect.height
        const previousBottomSide = previousItem.y + previousItemHeight
        const yDelta = card.y - previousBottomSide
        const isNotEquallyDistributed = !utils.isBetween({
          value: Math.abs(yDelta),
          min: consts.spaceBetweenCards - 1,
          max: consts.spaceBetweenCards + 1
        })
        if (isNotEquallyDistributed) {
          isDistributed = false
        }
      }
    })
  }
  return isDistributed
})
const xIsDistributed = computed(() => {
  const cards = sortedByX.value.cards
  const zoom = spaceCounterZoomDecimal.value
  let xIsDistributed = true
  if (props.shouldDistributeWithAlign) {
    cards.forEach((card, index) => {
      if (index > 0) {
        const previousItem = cards[index - 1]
        const rect = utils.cardElementDimensions({ id: previousItem.id }) || utils.boxElementDimensions({ id: previousItem.id }) || previousItem
        const previousItemWidth = rect.width
        const previousRightSide = previousItem.x + previousItemWidth
        const xDelta = card.x - previousRightSide
        const isNotEquallyDistributed = !utils.isBetween({
          value: Math.abs(xDelta),
          min: consts.spaceBetweenCards - 1,
          max: consts.spaceBetweenCards + 1
        })
        if (isNotEquallyDistributed) {
          xIsDistributed = false
        }
      }
    })
  }
  return xIsDistributed
})
const isLeftAligned = computed(() => {
  const xValues = items.value.map(item => item.x)
  const xIsAligned = xValues.every(x => x === xValues[0])
  return xIsAligned && yIsDistributed.value
})
const isCenteredHorizontally = computed(() => {
  const cards = sortedByX.value.cards
  if (!cards.length) { return }
  const origin = cards[0]
  const cardsCenterX = origin.x + (origin.width / 2)
  let centerIsEqual = true
  cards.forEach(card => {
    const roundedCenterIsEqual = utils.isBetween({
      value: card.x + (card.width / 2),
      min: cardsCenterX - 1,
      max: cardsCenterX + 1
    })
    if (!roundedCenterIsEqual) {
      centerIsEqual = false
    }
  })
  return centerIsEqual
})
const isRightAligned = computed(() => {
  const zoom = spaceCounterZoomDecimal.value
  const origin = items.value[0]
  const xRight = origin.x + origin.width
  const xIsAligned = items.value.every(item => {
    return utils.isBetween({
      value: item.x + item.width,
      min: xRight - 1,
      max: xRight + 1
    })
  })
  return xIsAligned
})
const isDistributedHorizontally = computed(() => {
  if (items.value.length < 3) { return }
  const sortedItems = sortedByX.value.all
  const distances = xDistancesBetween(sortedItems)
  const distanceBetweenCards = Math.abs(distances[0])
  let distanceIsEqual = true
  distances.forEach((distance, index) => {
    distance = Math.abs(distance)
    const roundedDistanceIsEqual = utils.isBetween({
      value: distance,
      min: distanceBetweenCards - 1,
      max: distanceBetweenCards + 1
    })
    if (!roundedDistanceIsEqual) {
      distanceIsEqual = false
    }
  })
  return distanceIsEqual
})
const isTopAligned = computed(() => {
  const yValues = items.value.map(item => item.y)
  const yIsAligned = yValues.every(y => y === yValues[0])
  return yIsAligned && xIsDistributed.value
})
const isCenteredVertically = computed(() => {
  const cards = sortedByY.value.cards
  if (!cards.length) { return }
  const origin = cards[0]
  const cardsCenterY = origin.y + (origin.height / 2)
  let centerIsEqual = true
  cards.forEach(card => {
    const roundedCenterIsEqual = utils.isBetween({
      value: card.y + (card.height / 2),
      min: cardsCenterY - 1,
      max: cardsCenterY + 1
    })
    if (!roundedCenterIsEqual) {
      centerIsEqual = false
    }
  })
  return centerIsEqual
})
const isBottomAligned = computed(() => {
  const origin = items.value[0]
  const yBottom = origin.y + origin.height
  const yIsAligned = items.value.every(item => {
    const bottomIsEqual = utils.isBetween({
      value: item.y + item.height,
      min: yBottom - 1,
      max: yBottom + 1
    })
    return bottomIsEqual
  })
  return yIsAligned
})
const isDistributedVertically = computed(() => {
  if (props.cards.length < 3) { return }
  const cards = sortedByY.value.cards
  const distancesBetween = yDistancesBetween(cards)
  const distanceBetweenCards = distancesBetween[0]
  let distanceIsEqual = true
  distancesBetween.forEach((distance, index) => {
    distance = Math.abs(distance)
    const roundedDistanceIsEqual = utils.isBetween({
      value: distance,
      min: distanceBetweenCards - 1,
      max: distanceBetweenCards + 1
    })
    if (!roundedDistanceIsEqual) {
      distanceIsEqual = false
    }
  })
  return distanceIsEqual
})

// sort items

const processSort = (items, sortFn) => {
  let processed = utils.clone(items)
  processed = normalizeDimensions(processed)
  processed = sortFn(processed)
  return processed
}
const computedSort = (sortFn) => computed(() => {
  const cards = processSort(props.editableCards, sortFn)
  const boxes = processSort(props.editableBoxes, sortFn)
  const lists = processSort(props.lists, sortFn)
  const all = cards.concat(boxes, lists)
  return { cards, boxes, lists, all }
})
const sortByXWidth = (items) => {
  return items.sort((a, b) => {
    return (b.x + b.width) - (a.x + a.width)
  })
}
const sortByYHeight = (items) => {
  return items.sort((a, b) => {
    return (b.y + b.height) - (a.y + a.height)
  })
}
const normalizeDimensions = (items) => {
  items = utils.clone(items)
  items = items.map(item => {
    item.width = item.resizeWidth || item.width
    item.height = item.resizeHeight || item.height
    return item
  })
  return items
}
// computed properties using the sort factory
const sortedByX = computedSort(utils.sortByX)
const sortedByY = computedSort(utils.sortByY)
const sortedByXWidth = computedSort(sortByXWidth)
const sortedByYHeight = computedSort(sortByYHeight)

// update items

const updateItem = (item, type) => {
  if (type === 'cards' && !item.listId) { // skip list cards
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

// update positions

const getItemDimensions = (item) => {
  return utils.cardElementDimensions({ id: item.id }) ||
  utils.boxElementDimensions({ id: item.id }) ||
  utils.listElementDimensions({ id: item.id }) ||
  item
}

// ⎺o
const alignTop = () => {
  const cards = sortedByX.value.cards
  const boxes = sortedByX.value.boxes
  const lists = sortedByX.value.lists
  alignTopItems(cards, 'cards')
  alignTopItems(boxes, 'boxes')
  alignTopItems(lists, 'lists')
}
const alignTopItems = (items, type) => {
  const zoom = spaceCounterZoomDecimal.value
  const newItems = []
  const origin = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.y = origin.y
      if (props.shouldDistributeWithAlign) {
        const previousItem = newItems[index - 1]
        const rect = getItemDimensions(previousItem)
        const previousRightSide = previousItem.x + rect.width
        item.x = previousRightSide + consts.spaceBetweenCards
      }
      updateItem(item, type)
    }
    newItems.push(item)
  })
  if (type === 'cards') { updateConnectionPaths() }
}
// o|o
const centerHorizontally = () => {
  const cards = sortedByX.value.cards
  const boxes = sortedByX.value.boxes
  const lists = sortedByX.value.lists
  centerHorizontallyItems(cards, 'cards')
  centerHorizontallyItems(boxes, 'boxes')
  centerHorizontallyItems(lists, 'lists')
}
const centerHorizontallyItems = (items, type) => {
  const origin = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      const previousItem = items[index - 1]
      const previousBottomSide = previousItem.y + previousItem.height
      item = utils.clone(item)
      item.x = origin.x + (origin.width / 2) - (item.width / 2)
      if (props.shouldDistributeWithAlign) {
        item.y = previousBottomSide + spaceBetween.value
      }
      updateItem(item, type)
    }
  })
  if (type === 'cards') { updateConnectionPaths() }
}
// o|
const alignRight = () => {
  const cards = sortedByXWidth.value.cards
  const boxes = sortedByXWidth.value.boxes
  const lists = sortedByXWidth.value.lists
  alignRightItems(cards, 'cards')
  alignRightItems(boxes, 'boxes')
  alignRightItems(lists, 'lists')
}
const alignRightItems = (items, type) => {
  const zoom = spaceCounterZoomDecimal.value
  const origin = items[0]
  if (!origin) { return }
  let rect = getItemDimensions(origin)
  const originWidth = rect.width
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      rect = getItemDimensions(item)
      const itemWidth = rect.width
      item.x = origin.x + originWidth - itemWidth
      updateItem(item, type)
    }
  })
  if (type === 'cards') { updateConnectionPaths() }
}
// | o |
const distributeHorizontally = () => {
  const cards = sortedByX.value.cards
  const boxes = sortedByX.value.boxes
  const lists = sortedByX.value.lists
  distributeHorizontallyItems(cards, 'cards')
  distributeHorizontallyItems(boxes, 'boxes')
  distributeHorizontallyItems(lists, 'lists')
}
const distributeHorizontallyItems = (items, type) => {
  if (!items.length) { return }
  const distances = xDistancesBetween(items)
  const distance = utils.averageOfNumbers(distances)
  let previousItem = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.x = previousItem.x + previousItem.width + distance
      previousItem = item
      updateItem(item, type)
    }
  })
  if (type === 'cards') { updateConnectionPaths() }
}
// |o
const alignLeft = () => {
  const cards = sortedByY.value.cards
  const boxes = sortedByY.value.boxes
  const lists = sortedByY.value.lists
  alignLeftItems(cards, 'cards')
  alignLeftItems(boxes, 'boxes')
  alignLeftItems(lists, 'lists')
}
const alignLeftItems = (items, type) => {
  const zoom = spaceCounterZoomDecimal.value
  const newItems = []
  const origin = items[0]

  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.x = origin.x
      if (props.shouldDistributeWithAlign) {
        const previousItem = newItems[index - 1]
        const rect = getItemDimensions(previousItem)
        const previousItemHeight = rect.height
        const previousBottomSide = previousItem.y + previousItemHeight
        item.y = previousBottomSide + ySpaceBetweenCards(previousItem)
      }
      console.log(origin.x, item.x, item.name)
      console.log('☎️☎️', item, type)

      updateItem(item, type)
    }
    newItems.push(item)
  })
  if (type === 'cards') { updateConnectionPaths() }
}
// o-o
const centerVertically = () => {
  const cards = sortedByX.value.cards
  const boxes = sortedByX.value.boxes
  const lists = sortedByX.value.lists
  centerVerticallyItems(cards, 'cards')
  centerVerticallyItems(boxes, 'boxes')
  centerVerticallyItems(lists, 'lists')
}
const centerVerticallyItems = (items, type) => {
  const origin = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      if (props.shouldDistributeWithAlign) {
        const previousItem = items[index - 1]
        const previousRightSide = previousItem.x + previousItem.width
        item.x = previousRightSide + spaceBetween.value
      }
      item.y = origin.y + (origin.height / 2) - (item.height / 2)
      updateItem(item, type)
    }
  })
  if (type === 'cards') { updateConnectionPaths() }
}
// _o
const alignBottom = () => {
  const cards = sortedByYHeight.value.cards
  const boxes = sortedByYHeight.value.boxes
  const lists = sortedByYHeight.value.lists
  alignBottomItems(cards, 'cards')
  alignBottomItems(boxes, 'boxes')
  alignBottomItems(lists, 'lists')
}
const alignBottomItems = (items, type) => {
  const origin = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.y = origin.y + origin.height - item.height
      if (props.shouldDistributeWithAlign) {
        const previousItem = items[index - 1]
        const previousRightSide = previousItem.x + previousItem.width
        item.x = previousRightSide + spaceBetween.value
      }
      updateItem(item, type)
    }
  })
  if (type === 'cards') { updateConnectionPaths() }
}
// ⎺ o _
const distributeVertically = () => {
  const cards = sortedByY.value.cards
  const boxes = sortedByY.value.boxes
  const lists = sortedByY.value.lists
  distributeVerticallyItems(cards, 'cards')
  distributeVerticallyItems(boxes, 'boxes')
  distributeVerticallyItems(lists, 'lists')
}
const distributeVerticallyItems = (items, type) => {
  if (!items.length) { return }
  const distances = yDistancesBetween(items)
  const distance = Math.round(utils.averageOfNumbers(distances))
  let previousItem = items[0]
  items.forEach((item, index) => {
    if (index > 0) {
      item = utils.clone(item)
      item.y = previousItem.y + previousItem.height + distance
      previousItem = item
      updateItem(item, type)
    }
  })
  if (type === 'cards') { updateConnectionPaths() }
}

// distances between

const xDistancesBetween = (items) => {
  const xDistances = []
  items.forEach((item, index) => {
    if (index > 0) {
      const previousItem = items[index - 1]
      const previousRightSide = previousItem.x + previousItem.width
      const leftSide = item.x
      xDistances.push(leftSide - previousRightSide)
    }
  })
  return xDistances
}
const yDistancesBetween = (items) => {
  const yDistances = []
  items.forEach((item, index) => {
    if (index > 0) {
      const previousItem = items[index - 1]
      const previousBottomSide = previousItem.y + previousItem.height
      const topSide = item.y
      yDistances.push(topSide - previousBottomSide)
    }
  })
  return yDistances
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
      button(title="Center Verticaly" :disabled="!canEdit" @click.left="centerVertically" :class="{active: isCenteredVertically}")
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
