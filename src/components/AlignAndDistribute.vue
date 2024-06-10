<template lang="pug">
.align-and-distribute(v-if="visible")
  .segmented-buttons(v-if="shouldHideMoreOptions")
    //- |o
    button(title="Align Left and Distribute" :disabled="!canEditAll.cards" @click.left="alignLeft" :class="{active: isLeftAligned}")
      img.icon(src="@/assets/align-left-distributed.svg")
    //- ⎺o
    button(title="Align Top and Distribute" :disabled="!canEditAll.cards" @click.left="alignTop" :class="{active: isTopAligned}")
      img.icon.align-top(src="@/assets/align-left-distributed.svg")
    button(title="More Options" :disabled="!canEditAll.cards" @click.left="toggleMoreOptionsIsVisible" :class="{active: moreOptionsIsVisible}")
      img.icon.down-arrow(src="@/assets/down-arrow.svg")

  //- More Options
  .more-options(v-if="visible && !shouldHideMoreOptions")
    .segmented-buttons.first-row
      //- |o
      button(title="Align Left" :disabled="!canEditAll.cards" @click.left="alignLeft" :class="{active: isLeftAligned}")
        img.icon(src="@/assets/align-left.svg")
      //- o|o
      button(title="Center Horizontally" :disabled="!canEditAll.cards" @click.left="centerHorizontally" :class="{active: isCenteredHorizontally}")
        img.icon(src="@/assets/center-horizontally.svg")
      //- o|
      button(title="Align Right" :disabled="!canEditAll.cards" @click.left="alignRight" :class="{active: isRightAligned}")
        img.icon.align-right(src="@/assets/align-left.svg")
      //- | o |
      button(title="Distribute Horizontally" :disabled="!canDistribute" @click.left="distributeHorizontally" :class="{active: isDistributedHorizontally}")
        img.icon(src="@/assets/distribute-horizontally.svg")
    .segmented-buttons.last-row
      //- ⎺o
      button(title="Align Top" :disabled="!canEditAll.cards" @click.left="alignTop" :class="{active: isTopAligned}")
        img.icon.align-top(src="@/assets/align-left.svg")
      //- o-o
      button(title="Center Verticaly" :disabled="!canEditAll.cards" @click.left="centerVertically" :class="{active: isCenteredVertically}")
        img.icon.center-vertically(src="@/assets/center-horizontally.svg")
      //- _o
      button(title="Align Bottom" :disabled="!canEditAll.cards" @click.left="alignBottom" :class="{active: isBottomAligned}")
        img.icon.align-bottom(src="@/assets/align-left.svg")
      //- ⎺ o _
      button(title="Distribute Vertically" :disabled="!canDistribute" @click.left="distributeVertically" :class="{active: isDistributedVertically}")
        img.icon.distribute-vertically(src="@/assets/distribute-horizontally.svg")
</template>

<script>
import utils from '@/utils.js'
import consts from '@/consts.js'

import uniqBy from 'lodash-es/uniqBy'

export default {
  name: 'AlignAndDistribute',
  props: {
    visible: Boolean,
    numberOfSelectedItemsCreatedByCurrentUser: Object,
    shouldHideMoreOptions: Boolean,
    shouldDistributeWithAlign: Boolean,
    canEditAll: Object,
    cards: Object,
    editableCards: Object,
    connections: Object,
    boxes: Object,
    editableBoxes: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const { type } = mutation
      if (type === 'triggerSelectedItemsAlignLeft') {
        this.alignLeft()
      }
    })
  },
  computed: {
    moreOptionsIsVisible () { return this.$store.state.currentUser.shouldShowMoreAlignOptions },
    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
    multipleConnectionsSelectedIds () { return this.$store.state.multipleConnectionsSelectedIds },
    multipleBoxesSelectedIds () { return this.$store.state.multipleBoxesSelectedIds },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    spaceBetween () { return consts.spaceBetweenCards * this.spaceCounterZoomDecimal },
    canDistribute () {
      const minimumRequiredToDistribute = 3
      let cards, boxes
      if (this.isSpaceMember) {
        cards = this.multipleCardsSelectedIds.length >= minimumRequiredToDistribute
        boxes = this.multipleBoxesSelectedIds.length >= minimumRequiredToDistribute
      } else {
        cards = this.numberOfSelectedItemsCreatedByCurrentUser.cards >= minimumRequiredToDistribute
        boxes = this.numberOfSelectedItemsCreatedByCurrentUser.boxes >= minimumRequiredToDistribute
      }
      return Boolean(cards) || Boolean(boxes)
    },
    items () {
      const boxes = this.normalizeBoxes(this.boxes)
      return this.cards.concat(boxes)
    },

    // verify positioning

    yIsDistributed () {
      const cards = this.sortedByY.cards
      const zoom = this.spaceCounterZoomDecimal
      let yIsDistributed = true
      if (this.shouldDistributeWithAlign) {
        cards.forEach((card, index) => {
          if (index > 0) {
            const previousItem = cards[index - 1]
            const rect = utils.cardRectFromId(previousItem.id) || utils.boxRectFromId(previousItem.id) || previousItem
            const previousItemHeight = rect.height * zoom
            const previousBottomSide = previousItem.y + previousItemHeight
            const yDelta = card.y - previousBottomSide
            const isNotEquallyDistributed = !utils.isBetween({
              value: Math.abs(yDelta),
              min: consts.spaceBetweenCards - 1,
              max: consts.spaceBetweenCards + 1
            })
            if (isNotEquallyDistributed) {
              yIsDistributed = false
            }
          }
        })
      }
      return yIsDistributed
    },
    xIsDistributed () {
      const cards = this.sortedByX.cards
      const zoom = this.spaceCounterZoomDecimal
      let xIsDistributed = true
      if (this.shouldDistributeWithAlign) {
        cards.forEach((card, index) => {
          if (index > 0) {
            const previousItem = cards[index - 1]
            const rect = utils.cardRectFromId(previousItem.id) || utils.boxRectFromId(previousItem.id) || previousItem
            const previousItemWidth = rect.width * zoom
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
    },
    isLeftAligned () {
      const xValues = this.items.map(item => item.x)
      const xIsAligned = xValues.every(x => x === xValues[0])
      const yIsDistributed = this.yIsDistributed
      return xIsAligned && yIsDistributed
    },
    isCenteredHorizontally () {
      const cards = this.sortedByX.cards
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
    },
    isRightAligned () {
      const zoom = this.spaceCounterZoomDecimal
      const origin = this.items[0]
      const xRight = origin.x + origin.width
      const xIsAligned = this.items.every(item => {
        return utils.isBetween({
          value: item.x + item.width,
          min: xRight - 1,
          max: xRight + 1
        })
      })
      return xIsAligned
    },
    isDistributedHorizontally () {
      if (this.items.length < 3) { return }
      const items = this.sortedByX.all
      const xDistancesBetween = this.xDistancesBetween(items)
      const distanceBetweenCards = Math.abs(xDistancesBetween[0])
      let distanceIsEqual = true
      xDistancesBetween.forEach((distance, index) => {
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
    },
    isTopAligned () {
      const yValues = this.items.map(item => item.y)
      const yIsAligned = yValues.every(y => y === yValues[0])
      const xIsDistributed = this.xIsDistributed
      return yIsAligned && xIsDistributed
    },
    isCenteredVertically () {
      const cards = this.sortedByY.cards
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
    },
    isBottomAligned () {
      const origin = this.items[0]
      const yBottom = origin.y + origin.height
      const yIsAligned = this.items.every(item => {
        const bottomIsEqual = utils.isBetween({
          value: item.y + item.height,
          min: yBottom - 1,
          max: yBottom + 1
        })
        return bottomIsEqual
      })
      return yIsAligned
    },
    isDistributedVertically () {
      if (this.cards.length < 3) { return }
      const cards = this.sortedByY.cards
      const yDistancesBetween = this.yDistancesBetween(cards)
      const distanceBetweenCards = yDistancesBetween[0]
      let distanceIsEqual = true
      yDistancesBetween.forEach((distance, index) => {
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
    },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    sortedByX () {
      const editableCards = utils.clone(this.editableCards)
      const cards = editableCards.sort((a, b) => {
        return a.x - b.x
      })
      const editableBoxes = utils.clone(this.editableBoxes)
      let boxes = this.normalizeBoxes(editableBoxes)
      boxes = boxes.sort((a, b) => {
        return a.x - b.x
      })
      const all = cards.concat(boxes)
      return { cards, boxes, all }
    },
    sortedByY () {
      const editableCards = utils.clone(this.editableCards)
      const cards = editableCards.sort((a, b) => {
        return a.y - b.y
      })
      const editableBoxes = utils.clone(this.editableBoxes)
      let boxes = this.normalizeBoxes(editableBoxes)
      boxes = boxes.sort((a, b) => {
        return a.y - b.y
      })
      const all = cards.concat(boxes)
      return { cards, boxes, all }
    },
    sortedByXWidth () {
      const editableCards = utils.clone(this.editableCards)
      const cards = editableCards.sort((a, b) => {
        return (b.x + b.width) - (a.x + a.width)
      })
      const editableBoxes = utils.clone(this.editableBoxes)
      let boxes = this.normalizeBoxes(editableBoxes)
      boxes = boxes.sort((a, b) => {
        return (b.x + b.width) - (a.x + a.width)
      })
      const all = cards.concat(boxes)
      return { cards, boxes, all }
    },
    sortedByYHeight () {
      const editableCards = utils.clone(this.editableCards)
      const cards = editableCards.sort((a, b) => {
        return (b.y + b.height) - (a.y + a.height)
      })
      const editableBoxes = utils.clone(this.editableBoxes)
      let boxes = this.normalizeBoxes(editableBoxes)
      boxes = boxes.sort((a, b) => {
        return (b.y + b.height) - (a.y + a.height)
      })
      const all = cards.concat(boxes)
      return { cards, boxes, all }
    }

  },
  methods: {
    normalizeBoxes (boxes) {
      boxes = utils.clone(boxes)
      boxes = boxes.map(box => {
        box.width = box.resizeWidth
        box.height = box.resizeHeight
        return box
      })
      return boxes
    },
    toggleMoreOptionsIsVisible () {
      const value = !this.moreOptionsIsVisible
      this.$store.dispatch('currentUser/shouldShowMoreAlignOptions', value)
    },
    updateItem (item, type) {
      if (type === 'cards') { this.$store.dispatch('currentCards/update', item) }
      if (type === 'boxes') { this.$store.dispatch('currentBoxes/update', item) }
    },

    // ⎺o
    alignTop () {
      const cards = this.sortedByX.cards
      const boxes = this.sortedByX.boxes
      this.alignTopItems(cards, 'cards')
      this.alignTopItems(boxes, 'boxes')
    },
    alignTopItems (items, type) {
      const zoom = this.spaceCounterZoomDecimal
      let newItems = []
      const origin = items[0]
      items.forEach((item, index) => {
        if (index > 0) {
          item = utils.clone(item)
          item.y = origin.y
          if (this.shouldDistributeWithAlign) {
            const previousItem = newItems[index - 1]
            const rect = utils.cardRectFromId(previousItem.id) || utils.boxRectFromId(previousItem.id) || previousItem
            const previousRightSide = previousItem.x + (rect.width * zoom)
            item.x = previousRightSide + consts.spaceBetweenCards
          }
          this.updateItem(item, type)
        }
        newItems.push(item)
      })
      if (type === 'cards') { this.updateConnectionPaths() }
    },
    // o|o
    centerHorizontally () {
      const cards = this.sortedByX.cards
      const boxes = this.sortedByX.boxes
      this.centerHorizontallyItems(cards, 'cards')
      this.centerHorizontallyItems(boxes, 'boxes')
    },
    centerHorizontallyItems (items, type) {
      const origin = items[0]
      items.forEach((item, index) => {
        if (index > 0) {
          const previousItem = items[index - 1]
          const previousBottomSide = previousItem.y + previousItem.height
          item = utils.clone(item)
          item.x = origin.x + (origin.width / 2) - (item.width / 2)
          if (this.shouldDistributeWithAlign) {
            item.y = previousBottomSide + this.spaceBetween
          }
          this.updateItem(item, type)
        }
      })
      if (type === 'cards') { this.updateConnectionPaths() }
    },
    // o|
    alignRight () {
      const cards = this.sortedByXWidth.cards
      const boxes = this.sortedByXWidth.boxes
      this.alignRightItems(cards, 'cards')
      this.alignRightItems(boxes, 'boxes')
    },
    alignRightItems (items, type) {
      const zoom = this.spaceCounterZoomDecimal
      const origin = items[0]
      if (!origin) { return }
      let rect = utils.cardRectFromId(origin.id) || utils.boxRectFromId(origin.id) || origin
      const originWidth = rect.width * zoom
      items.forEach((item, index) => {
        if (index > 0) {
          item = utils.clone(item)
          rect = utils.cardRectFromId(item.id) || utils.boxRectFromId(item.id) || item
          const itemWidth = rect.width * zoom
          item.x = origin.x + originWidth - itemWidth
          this.updateItem(item, type)
        }
      })
      if (type === 'cards') { this.updateConnectionPaths() }
    },
    // | o |
    distributeHorizontally () {
      const cards = this.sortedByX.cards
      const boxes = this.sortedByX.boxes
      this.distributeHorizontallyItems(cards, 'cards')
      this.distributeHorizontallyItems(boxes, 'boxes')
    },
    distributeHorizontallyItems (items, type) {
      if (!items.length) { return }
      const xDistancesBetween = this.xDistancesBetween(items)
      const distance = utils.averageOfNumbers(xDistancesBetween)
      let previousItem = items[0]
      items.forEach((item, index) => {
        if (index > 0) {
          item = utils.clone(item)
          item.x = previousItem.x + previousItem.width + distance
          previousItem = item
          this.updateItem(item, type)
        }
      })
      if (type === 'cards') { this.updateConnectionPaths() }
    },
    // |o
    alignLeft () {
      const cards = this.sortedByY.cards
      const boxes = this.sortedByY.boxes
      this.alignLeftItems(cards, 'cards')
      this.alignLeftItems(boxes, 'boxes')
    },
    alignLeftItems (items, type) {
      const zoom = this.spaceCounterZoomDecimal
      let newItems = []
      const origin = items[0]
      items.forEach((item, index) => {
        if (index > 0) {
          item = utils.clone(item)
          item.x = origin.x
          if (this.shouldDistributeWithAlign) {
            const previousItem = newItems[index - 1]
            const rect = utils.cardRectFromId(previousItem.id) || utils.boxRectFromId(previousItem.id) || previousItem
            const previousItemHeight = rect.height * zoom
            const previousBottomSide = previousItem.y + previousItemHeight
            item.y = previousBottomSide + consts.spaceBetweenCards
          }
          this.updateItem(item, type)
        }
        newItems.push(item)
      })
      if (type === 'cards') { this.updateConnectionPaths() }
    },
    // o-o
    centerVertically () {
      const cards = this.sortedByX.cards
      const boxes = this.sortedByX.boxes
      this.centerVerticallyItems(cards, 'cards')
      this.centerVerticallyItems(boxes, 'boxes')
    },
    centerVerticallyItems (items, type) {
      const origin = items[0]
      items.forEach((item, index) => {
        if (index > 0) {
          item = utils.clone(item)
          if (this.shouldDistributeWithAlign) {
            const previousItem = items[index - 1]
            const previousRightSide = previousItem.x + previousItem.width
            item.x = previousRightSide + this.spaceBetween
          }
          item.y = origin.y + (origin.height / 2) - (item.height / 2)
          this.updateItem(item, type)
        }
      })
      if (type === 'cards') { this.updateConnectionPaths() }
    },
    // _o
    alignBottom () {
      const cards = this.sortedByYHeight.cards
      const boxes = this.sortedByYHeight.boxes
      this.alignBottomItems(cards, 'cards')
      this.alignBottomItems(boxes, 'boxes')
    },
    alignBottomItems (items, type) {
      const origin = items[0]
      items.forEach((item, index) => {
        if (index > 0) {
          item = utils.clone(item)
          item.y = origin.y + origin.height - item.height
          if (this.shouldDistributeWithAlign) {
            const previousItem = items[index - 1]
            const previousRightSide = previousItem.x + previousItem.width
            item.x = previousRightSide + this.spaceBetween
          }
          this.updateItem(item, type)
        }
      })
      if (type === 'cards') { this.updateConnectionPaths() }
    },
    // ⎺ o _
    distributeVertically () {
      const cards = this.sortedByY.cards
      const boxes = this.sortedByY.boxes
      this.distributeVerticallyItems(cards, 'cards')
      this.distributeVerticallyItems(boxes, 'boxes')
    },
    distributeVerticallyItems (items, type) {
      if (!items.length) { return }
      const yDistancesBetween = this.yDistancesBetween(items)
      const distance = Math.round(utils.averageOfNumbers(yDistancesBetween))
      let previousItem = items[0]
      items.forEach((item, index) => {
        if (index > 0) {
          item = utils.clone(item)
          item.y = previousItem.y + previousItem.height + distance
          previousItem = item
          this.updateItem(item, type)
        }
      })
      if (type === 'cards') { this.updateConnectionPaths() }
    },

    // utils

    xDistancesBetween (items) {
      let xDistances = []
      items.forEach((item, index) => {
        if (index > 0) {
          const previousItem = items[index - 1]
          const previousRightSide = previousItem.x + previousItem.width
          const leftSide = item.x
          xDistances.push(leftSide - previousRightSide)
        }
      })
      return xDistances
    },
    yDistancesBetween (items) {
      let yDistances = []
      items.forEach((item, index) => {
        if (index > 0) {
          const previousItem = items[index - 1]
          const previousBottomSide = previousItem.y + previousItem.height
          const topSide = item.y
          yDistances.push(topSide - previousBottomSide)
        }
      })
      return yDistances
    },
    updateConnectionPaths () {
      this.$nextTick(() => {
        let connections = []
        const multipleCardsSelectedIds = utils.clone(this.multipleCardsSelectedIds)
        const multipleConnectionsSelectedIds = utils.clone(this.multipleConnectionsSelectedIds)
        // this.$store.commit('clearMultipleSelected')
        if (!multipleCardsSelectedIds.length) { return }
        multipleCardsSelectedIds.forEach(cardId => {
          connections = connections.concat(this.$store.getters['currentConnections/byCardId'](cardId))
        })
        this.$store.commit('multipleCardsSelectedIds', multipleCardsSelectedIds)
        this.$store.commit('multipleConnectionsSelectedIds', multipleConnectionsSelectedIds)
        // updates
        connections = uniqBy(connections, 'id')
        this.$store.dispatch('currentConnections/updatePaths', { connections, shouldUpdateApi: true })
      })
    }
  }
}
</script>

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
