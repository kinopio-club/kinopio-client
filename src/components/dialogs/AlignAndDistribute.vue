<template lang="pug">
dialog.narrow.align-and-distribute(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Align {{cardsCount}} Cards
    .row
      button(@click="alignCardsVertically" :class="{active: isVerticallyAligned}")
        img.icon(src="@/assets/align-vertically.svg")
        span Align Vertically
    .row
      button(@click="alignCardsHorizontally" :class="{active: isHorizontallyAligned}")
        img.icon(src="@/assets/align-horizontally.svg")
        span Align Horizontally
  section
    p Evenly space out {{cardsCount}} cards
    p.badge.info(v-if="cannotSpaceOutCards") Select 3 or more cards to space out

    .row
      button(@click="evenlySpaceTopToBottom" :disabled="cannotSpaceOutCards" :class="{active: isEvenlySpacedTopToBottom}")
        img.icon(src="@/assets/space-out-top-to-bottom.svg")
        span Top to Bottom
    .row
      button(@click="evenlySpaceLeftToRight" :disabled="cannotSpaceOutCards" :class="{active: isEvenlySpacedLeftToRight}")
        img.icon.space-out-left-to-right(src="@/assets/space-out-left-to-right.svg")
        span Left to Right
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

export default {
  name: 'AlignAndDistribute',
  props: {
    visible: Boolean
  },
  computed: {
    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
    cardsCount () { return this.multipleCardsSelectedIds.length },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    cards () {
      return this.multipleCardsSelectedIds.map(cardId => {
        return this.$store.getters['currentSpace/cardById'](cardId)
      })
    },
    cannotSpaceOutCards () {
      return this.editableCards.length < 3
    },
    editableCards () {
      if (this.isSpaceMember) {
        return this.cards
      } else {
        return this.cards.filter(card => {
          return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
        })
      }
    },
    isVerticallyAligned () {
      const xValues = this.cards.map(card => card.x)
      return xValues.every(x => x === xValues[0])
    },
    isHorizontallyAligned () {
      const yValues = this.cards.map(card => card.y)
      return yValues.every(y => y === yValues[0])
    },
    isEvenlySpacedTopToBottom () {
      const cards = this.cardsSortedByY()
      const yDistances = this.yDistancesBetweenCards(cards)
      return yDistances.every(y => {
        return utils.isBetween({
          value: y,
          min: yDistances[0] - 1,
          max: yDistances[0] + 1
        })
      })
    },
    isEvenlySpacedLeftToRight () {
      const cards = this.cardsSortedByX()
      const xDistances = this.xDistancesBetweenCards(cards)
      return xDistances.every(x => {
        return utils.isBetween({
          value: x,
          min: xDistances[0] - 1,
          max: xDistances[0] + 1
        })
      })
    }
  },
  methods: {
    scrollIntoView () {
      const pinchZoomScale = utils.visualViewport().scale
      const pinchZoomScaleShouldFocus = utils.isBetween({
        value: pinchZoomScale,
        min: 0.8,
        max: 1.3
      })
      if (!pinchZoomScaleShouldFocus) { return }
      if (!utils.isMobile()) {
        const element = this.$refs.dialog
        scrollIntoView.scroll(element)
      }
    },
    alignCardsVertically () {
      const x = this.editableCards[0].x
      this.editableCards.forEach(card => {
        card = utils.clone(card)
        card.x = x
        this.updateCardPosition(card)
      })
    },
    alignCardsHorizontally () {
      const y = this.editableCards[0].y
      this.editableCards.forEach(card => {
        card = utils.clone(card)
        card.y = y
        this.updateCardPosition(card)
      })
    },
    cardsSortedByX () {
      return this.editableCards.sort((a, b) => {
        return a.x - b.x
      })
    },
    cardsSortedByY () {
      return this.editableCards.sort((a, b) => {
        return a.y - b.y
      })
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
    updateCardPosition (card) {
      this.$store.dispatch('currentSpace/updateCard', card)
      this.$nextTick(() => {
        this.$store.dispatch('currentSpace/updateCardConnectionPaths', { cardId: card.id, shouldUpdateApi: true })
      })
    },
    evenlySpaceTopToBottom () {
      const cards = utils.clone(this.cardsSortedByY())
      const yDistances = this.yDistancesBetweenCards(cards)
      const yAverage = Math.max(utils.averageOfNumbers(yDistances), 20)
      // update y positions
      let updatedCards = cards.map((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousElement = document.querySelector(`article [data-card-id="${previousCard.id}"]`)
          const previousRect = previousElement.getBoundingClientRect()
          const previousRectBottomSide = previousCard.y + previousRect.height
          card.y = previousRectBottomSide + yAverage
          return card
        }
      })
      updatedCards.shift()
      updatedCards.forEach(card => {
        this.updateCardPosition(card)
      })
    },
    evenlySpaceLeftToRight () {
      const cards = utils.clone(this.cardsSortedByX())
      const xDistances = this.xDistancesBetweenCards(cards)
      const xAverage = Math.max(utils.averageOfNumbers(xDistances), 20)
      // update x positions
      let updatedCards = cards.map((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousElement = document.querySelector(`article [data-card-id="${previousCard.id}"]`)
          const previousRect = previousElement.getBoundingClientRect()
          const previousRectRightSide = previousCard.x + previousRect.width
          card.x = previousRectRightSide + xAverage
          return card
        }
      })
      updatedCards.shift()
      updatedCards.forEach(card => {
        this.updateCardPosition(card)
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.align-and-distribute
  left 32px
  p + .row
    margin-top 10px
  .space-out-left-to-right
    vertical-align 1px
</style>
