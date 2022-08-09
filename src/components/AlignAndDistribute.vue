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
      img.down-arrow(src="@/assets/down-arrow.svg")

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
      button(title="Distribute Horizontally" :disabled="!canDistributeCards" @click.left="distributeHorizontally" :class="{active: isDistributedHorizontally}")
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
      button(title="Distribute Vertically" :disabled="!canDistributeCards" @click.left="distributeVertically" :class="{active: isDistributedVertically}")
        img.icon.distribute-vertically(src="@/assets/distribute-horizontally.svg")
</template>

<script>
import utils from '@/utils.js'

import uniqBy from 'lodash-es/uniqBy'

const spaceBetweenCards = 12

export default {
  name: 'AlignAndDistribute',
  props: {
    visible: Boolean,
    numberOfSelectedItemsCreatedByCurrentUser: Object,
    shouldHideMoreOptions: Boolean,
    shouldAutoDistribute: Boolean,
    canEditAll: Object,
    cards: Object,
    editableCards: Object,
    connections: Object,
    boxes: Object,
    editableBoxes: Object
  },
  computed: {
    moreOptionsIsVisible () { return this.$store.state.currentUser.shouldShowMoreAlignOptions },
    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
    multipleConnectionsSelectedIds () { return this.$store.state.multipleConnectionsSelectedIds },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    canDistributeCards () {
      if (!this.canEditAll.cards) { return }
      const minimumRequiredToDistribute = 3
      let cards
      if (this.isSpaceMember) {
        cards = this.multipleCardsSelectedIds.length >= minimumRequiredToDistribute
      } else {
        cards = this.numberOfSelectedItemsCreatedByCurrentUser.cards >= minimumRequiredToDistribute
      }
      return Boolean(cards)
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
      if (this.shouldAutoDistribute) {
        cards.forEach((card, index) => {
          if (index > 0) {
            const previousCard = cards[index - 1]
            const previousCardHeight = Math.round(previousCard.height * zoom)
            const previousBottomSide = previousCard.y + previousCardHeight
            const cardYDelta = card.y - previousBottomSide
            const isNotEquallyDistributed = !utils.isBetween({
              value: Math.abs(cardYDelta),
              min: spaceBetweenCards - 1,
              max: spaceBetweenCards + 1
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
      if (this.shouldAutoDistribute) {
        cards.forEach((card, index) => {
          if (index > 0) {
            const previousCard = cards[index - 1]
            const previousCardWidth = Math.round(previousCard.width * zoom)
            const previousRightSide = previousCard.x + previousCardWidth
            const cardXDelta = card.x - previousRightSide
            const isNotEquallyDistributed = !utils.isBetween({
              value: Math.abs(cardXDelta),
              min: spaceBetweenCards - 1,
              max: spaceBetweenCards + 1
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
      const xRight = origin.x + (origin.width * zoom)
      const xIsAligned = this.items.every(item => {
        return utils.isBetween({
          value: item.x + (item.width * zoom),
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
      const yIsAligned = this.items.every(item => item.y + item.height === yBottom)
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

    // ⎺o
    alignTop () {
      const cards = this.sortedByX.cards
      let newCards = []
      const origin = cards[0]
      const zoom = this.spaceCounterZoomDecimal
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = newCards[index - 1]
          const previousRightSide = previousCard.x + (previousCard.width * zoom)
          card = utils.clone(card)
          card.y = origin.y
          if (this.shouldAutoDistribute) {
            card.x = previousRightSide + spaceBetweenCards
          }
          this.$store.dispatch('currentCards/update', card)
        }
        newCards.push(card)
      })
      this.updateConnectionPaths()
    },
    // o|o
    centerHorizontally () {
      const cards = this.sortedByX.cards
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousBottomSide = previousCard.y + previousCard.height
          card = utils.clone(card)
          card.x = origin.x + (origin.width / 2) - (card.width / 2)
          if (this.shouldAutoDistribute) {
            card.y = previousBottomSide + spaceBetweenCards
          }
          this.$store.dispatch('currentCards/update', card)
        }
      })
      this.updateConnectionPaths()
    },
    // o|
    alignRight () {
      const cards = this.sortedByXWidth.cards
      const origin = cards[0]
      const zoom = this.spaceCounterZoomDecimal
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousBottomSide = previousCard.y + (previousCard.height * zoom)
          card = utils.clone(card)
          card.x = origin.x + (origin.width * zoom) - (card.width * zoom)
          if (this.shouldAutoDistribute) {
            card.y = previousBottomSide + spaceBetweenCards
          }
          this.$store.dispatch('currentCards/update', card)
        }
      })
      this.updateConnectionPaths()
    },
    // | o |
    distributeHorizontally () {
      const cards = this.sortedByX.cards
      const xDistancesBetween = this.xDistancesBetween(cards)
      const averageDistance = utils.averageOfNumbers(xDistancesBetween)
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          card = utils.clone(card)
          card.x = previousCard.x + previousCard.width + averageDistance
          this.$store.dispatch('currentCards/update', card)
        }
      })
      this.updateConnectionPaths()
    },
    // |o
    alignLeft () {
      const cards = this.sortedByY.cards
      let newCards = []
      const origin = cards[0]
      const zoom = this.spaceCounterZoomDecimal
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = newCards[index - 1]
          const previousBottomSide = previousCard.y + (previousCard.height * zoom)
          card = utils.clone(card)
          card.x = origin.x
          if (this.shouldAutoDistribute) {
            card.y = previousBottomSide + spaceBetweenCards
          }
          this.$store.dispatch('currentCards/update', card)
        }
        newCards.push(card)
      })
      this.updateConnectionPaths()
    },
    // o-o
    centerVertically () {
      const cards = this.sortedByX.cards
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousRightSide = previousCard.x + previousCard.width
          card = utils.clone(card)
          if (this.shouldAutoDistribute) {
            card.x = previousRightSide + spaceBetweenCards
          }
          card.y = origin.y + (origin.height / 2) - (card.height / 2)
          this.$store.dispatch('currentCards/update', card)
        }
      })
      this.updateConnectionPaths()
    },
    // _o
    alignBottom () {
      const cards = this.sortedByYHeight.cards
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousRightSide = previousCard.x + previousCard.width
          card = utils.clone(card)
          card.y = origin.y + origin.height - card.height
          if (this.shouldAutoDistribute) {
            card.x = previousRightSide + spaceBetweenCards
          }
          this.$store.dispatch('currentCards/update', card)
        }
      })
      this.updateConnectionPaths()
    },
    // ⎺ o _
    distributeVertically () {
      const items = this.sortedByY.all
      const yDistancesBetween = this.yDistancesBetween(items)
      const averageDistance = utils.averageOfNumbers(yDistancesBetween)
      items.forEach((item, index) => {
        if (index > 0) {
          const previousItem = items[index - 1]
          item = utils.clone(item)
          item.y = previousItem.y + previousItem.height + averageDistance
          this.$store.dispatch('currentCards/update', item)
        }
      })
      this.updateConnectionPaths()
    },

    xDistancesBetween (items) {
      let xDistances = []
      items.forEach((item, index) => {
        if (index > 0) {
          const previousItem = items[index - 1]
          const previousRightSide = previousItem.x + previousItem.width + window.scrollX
          const leftSide = item.x + window.scrollX
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
          const previousBottomSide = previousItem.y + previousItem.height + window.scrollY
          const topSide = item.y + window.scrollY
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
        this.$store.commit('clearMultipleSelected')
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
