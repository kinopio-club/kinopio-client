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
      const xValues = this.cards.map(card => card.x)
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
      const origin = this.cards[0]
      const cardRight = origin.x + (origin.width * zoom)
      const xIsAligned = this.cards.every(card => {
        return utils.isBetween({
          value: card.x + (card.width * zoom),
          min: cardRight - 1,
          max: cardRight + 1
        })
      })
      return xIsAligned
    },
    isDistributedHorizontally () {
      if (this.cards.length < 3) { return }
      const cards = this.sortedByX.cards
      const xDistancesBetweenCards = this.xDistancesBetweenCards(cards)
      const distanceBetweenCards = Math.abs(xDistancesBetweenCards[0])
      let distanceIsEqual = true
      xDistancesBetweenCards.forEach((distance, index) => {
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
      const yValues = this.cards.map(card => card.y)
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
      const origin = this.cards[0]
      const cardBottom = origin.y + origin.height
      const yIsAligned = this.cards.every(card => card.y + card.height === cardBottom)
      return yIsAligned
    },
    isDistributedVertically () {
      if (this.cards.length < 3) { return }
      const cards = this.sortedByY.cards
      const yDistancesBetweenCards = this.yDistancesBetweenCards(cards)
      const distanceBetweenCards = yDistancesBetweenCards[0]
      let distanceIsEqual = true
      yDistancesBetweenCards.forEach((distance, index) => {
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
      const boxes = editableBoxes.sort((a, b) => {
        return a.x - b.x
      })
      return { cards, boxes }
    },
    sortedByY () {
      const editableCards = utils.clone(this.editableCards)
      const cards = editableCards.sort((a, b) => {
        return a.y - b.y
      })
      const editableBoxes = utils.clone(this.editableBoxes)
      const boxes = editableBoxes.sort((a, b) => {
        return a.y - b.y
      })
      return { cards, boxes }
    },
    sortedByXWidth () {
      const editableCards = utils.clone(this.editableCards)
      const cards = editableCards.sort((a, b) => {
        return (b.x + b.width) - (a.x + a.width)
      })
      const editableBoxes = utils.clone(this.editableBoxes)
      const boxes = editableBoxes.sort((a, b) => {
        return (b.x + b.width) - (a.x + a.width)
      })
      return { cards, boxes }
    },
    sortedByYHeight () {
      const editableCards = utils.clone(this.editableCards)
      const cards = editableCards.sort((a, b) => {
        return (b.y + b.height) - (a.y + a.height)
      })
      const editableBoxes = utils.clone(this.editableBoxes)
      const boxes = editableBoxes.sort((a, b) => {
        return (b.y + b.height) - (a.y + a.height)
      })
      return { cards, boxes }
    }

  },
  methods: {
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
      const xDistancesBetweenCards = this.xDistancesBetweenCards(cards)
      const averageDistance = utils.averageOfNumbers(xDistancesBetweenCards)
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
      const cards = this.sortedByY.cards
      const yDistancesBetweenCards = this.yDistancesBetweenCards(cards)
      const averageDistance = utils.averageOfNumbers(yDistancesBetweenCards)
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          card = utils.clone(card)
          card.y = previousCard.y + previousCard.height + averageDistance
          this.$store.dispatch('currentCards/update', card)
        }
      })
      this.updateConnectionPaths()
    },

    xDistancesBetweenCards (cards) {
      let xDistances = []
      cards.forEach((card, index) => {
        if (index > 0) {
          const element = document.querySelector(`article [data-card-id="${card.id}"]`)
          const rect = element.getBoundingClientRect()
          const previousElement = document.querySelector(`article [data-card-id="${cards[index - 1].id}"]`)
          const previousRect = previousElement.getBoundingClientRect()
          const previousRectRightSide = previousRect.x + previousRect.width + window.scrollX
          const rectLeftSide = rect.x + window.scrollX
          xDistances.push(rectLeftSide - previousRectRightSide)
        }
      })
      return xDistances
    },
    yDistancesBetweenCards (cards) {
      let yDistances = []
      cards.forEach((card, index) => {
        if (index > 0) {
          const element = document.querySelector(`article [data-card-id="${card.id}"]`)
          const rect = element.getBoundingClientRect()
          const previousElement = document.querySelector(`article [data-card-id="${cards[index - 1].id}"]`)
          const previousRect = previousElement.getBoundingClientRect()
          const previousRectBottomSide = previousRect.y + previousRect.height + window.scrollY
          const rectTopSide = rect.y + window.scrollY
          yDistances.push(rectTopSide - previousRectBottomSide)
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
