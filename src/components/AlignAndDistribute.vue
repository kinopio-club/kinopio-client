<template lang="pug">
.align-and-distribute(v-if="visible")
  .segmented-buttons(v-if="shouldHideMoreOptions")
    //- |o
    button(title="Align Left" :disabled="!canEditSome.cards" @click.left="alignLeft" :class="{active: isLeftAligned}")
      img.icon(src="@/assets/align-left-distributed.svg")
    //- ⎺o
    button(title="Align Top" :disabled="!canEditSome.cards" @click.left="alignTop" :class="{active: isTopAligned}")
      img.icon.align-top(src="@/assets/align-left-distributed.svg")
    button(title="More Options" :disabled="!canEditSome.cards" @click.left="toggleMoreOptionsIsVisible" :class="{active: moreOptionsIsVisible}")
      img.down-arrow(src="@/assets/down-arrow.svg")

  //- More Options
  .more-options(v-if="visible && !shouldHideMoreOptions")
    .segmented-buttons.first-row
      //- |o
      button(title="Align Left" :disabled="!canEditSome.cards" @click.left="alignLeft" :class="{active: isLeftAligned}")
        img.icon(src="@/assets/align-left.svg")
      //- o|o
      button(title="Center Horizontally" :disabled="!canEditSome.cards" @click.left="centerHorizontally" :class="{active: isCenteredHorizontally}")
        img.icon(src="@/assets/center-horizontally.svg")
      //- o|
      button(title="Align Right" :disabled="!canEditSome.cards" @click.left="alignRight" :class="{active: isRightAligned}")
        img.icon.align-right(src="@/assets/align-left.svg")
      //- | o |
      button(title="Distribute Horizontally" :disabled="!canDistributeCards" @click.left="distributeHorizontally" :class="{active: isDistributedHorizontally}")
        img.icon(src="@/assets/distribute-horizontally.svg")
    .segmented-buttons.last-row
      //- ⎺o
      button(title="Align Top" :disabled="!canEditSome.cards" @click.left="alignTop" :class="{active: isTopAligned}")
        img.icon.align-top(src="@/assets/align-left.svg")
      //- o-o
      button(title="Center Verticaly" :disabled="!canEditSome.cards" @click.left="centerVertically" :class="{active: isCenteredVertically}")
        img.icon.center-vertically(src="@/assets/center-horizontally.svg")
      //- _o
      button(title="Align Bottom" :disabled="!canEditSome.cards" @click.left="alignBottom" :class="{active: isBottomAligned}")
        img.icon.align-bottom(src="@/assets/align-left.svg")
      //- ⎺ o _
      button(title="Distribute Vertically" :disabled="!canDistributeCards" @click.left="distributeVertically" :class="{active: isDistributedVertically}")
        img.icon.distribute-vertically(src="@/assets/distribute-horizontally.svg")
</template>

<script>
import utils from '@/utils.js'

const spaceBetweenCards = 12

export default {
  name: 'AlignAndDistribute',
  props: {
    visible: Boolean,
    numberOfSelectedItemsCreatedByCurrentUser: Object,
    shouldHideMoreOptions: Boolean,
    shouldAutoDistribute: Boolean
  },
  computed: {
    moreOptionsIsVisible () { return this.$store.state.currentUser.shouldShowMoreAlignOptions },
    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
    multipleConnectionsSelectedIds () { return this.$store.state.multipleConnectionsSelectedIds },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    cards () {
      const cards = this.multipleCardsSelectedIds.map(cardId => {
        let card = this.$store.getters['currentSpace/cardById'](cardId)
        const element = document.querySelector(`article [data-card-id="${cardId}"]`)
        const rect = element.getBoundingClientRect()
        card.width = rect.width
        card.height = rect.height
        return card
      })
      return cards || []
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
    connections () {
      return this.multipleConnectionsSelectedIds.map(id => {
        return this.$store.getters['currentSpace/connectionById'](id)
      })
    },
    canEditSome () {
      if (this.isSpaceMember) { return { cards: true, connections: true, any: true } }
      const cards = this.numberOfSelectedItemsCreatedByCurrentUser.cards > 0
      const connections = this.numberOfSelectedItemsCreatedByCurrentUser.connections > 0
      const any = cards || connections
      return { cards, connections, any }
    },
    canDistributeCards () {
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
      const cards = this.cards
      let yIsDistributed = true
      if (this.shouldAutoDistribute) {
        cards.forEach((card, index) => {
          if (index > 0) {
            const previousCard = cards[index - 1]
            const previousBottomSide = previousCard.y + previousCard.height
            if (card.y - previousBottomSide !== spaceBetweenCards) {
              yIsDistributed = false
            }
          }
        })
      }
      return yIsDistributed
    },
    xIsDistributed () {
      const cards = this.cards
      let xIsDistributed = true
      if (this.shouldAutoDistribute) {
        cards.forEach((card, index) => {
          if (index > 0) {
            const previousCard = cards[index - 1]
            const previousRightSide = previousCard.x + previousCard.width
            if (card.x - previousRightSide !== spaceBetweenCards) {
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
      const cards = this.cardsSortedByX()
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
      const origin = this.cards[0]
      const cardRight = origin.x + origin.width
      const xIsAligned = this.cards.every(card => card.x + card.width === cardRight)
      return xIsAligned
    },
    isDistributedHorizontally () {
      if (this.cards.length < 3) { return }
      const cards = this.cardsSortedByX()
      const xDistancesBetweenCards = this.xDistancesBetweenCards(cards)
      const distanceBetweenCards = xDistancesBetweenCards[0]
      if (distanceBetweenCards < spaceBetweenCards) { return }
      let distanceIsEqual = true
      xDistancesBetweenCards.forEach((distance, index) => {
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
      const cards = this.cardsSortedByY()
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
      const cards = this.cardsSortedByY()
      const yDistancesBetweenCards = this.yDistancesBetweenCards(cards)
      const distanceBetweenCards = yDistancesBetweenCards[0]
      if (distanceBetweenCards < spaceBetweenCards) { return }
      let distanceIsEqual = true
      yDistancesBetweenCards.forEach((distance, index) => {
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
    }
  },
  methods: {
    toggleMoreOptionsIsVisible () {
      const value = !this.moreOptionsIsVisible
      this.$store.dispatch('currentUser/shouldShowMoreAlignOptions', value)
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
    cardsSortedByXWidth () {
      return this.editableCards.sort((a, b) => {
        return (b.x + b.width) - (a.x + a.width)
      })
    },
    cardsSortedByYHeight () {
      return this.editableCards.sort((a, b) => {
        return (b.y + b.height) - (a.y + a.height)
      })
    },
    // ⎺o
    alignTop () {
      const cards = this.cardsSortedByX()
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousRightSide = previousCard.x + previousCard.width
          card = utils.clone(card)
          card.y = origin.y
          if (this.shouldAutoDistribute) {
            card.x = previousRightSide + spaceBetweenCards
          }
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    // o|o
    centerHorizontally () {
      const cards = this.cardsSortedByX()
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
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    // o|
    alignRight () {
      const cards = this.cardsSortedByXWidth()
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousBottomSide = previousCard.y + previousCard.height
          card = utils.clone(card)
          card.x = origin.x + origin.width - card.width
          if (this.shouldAutoDistribute) {
            card.y = previousBottomSide + spaceBetweenCards
          }
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    // | o |
    distributeHorizontally () {
      const cards = this.cardsSortedByX()
      const xDistancesBetweenCards = this.xDistancesBetweenCards(cards)
      const averageDistance = utils.averageOfNumbers(xDistancesBetweenCards)
      let distance = Math.max(averageDistance, spaceBetweenCards)
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          card = utils.clone(card)
          card.x = previousCard.x + previousCard.width + distance
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    // |o
    alignLeft () {
      const cards = this.cardsSortedByY()
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousBottomSide = previousCard.y + previousCard.height
          card = utils.clone(card)
          card.x = origin.x
          if (this.shouldAutoDistribute) {
            card.y = previousBottomSide + spaceBetweenCards
          }
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    // o-o
    centerVertically () {
      const cards = this.cardsSortedByX()
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
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    // _o
    alignBottom () {
      const cards = this.cardsSortedByYHeight()
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
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    // ⎺ o _
    distributeVertically () {
      const cards = this.cardsSortedByY()
      const yDistancesBetweenCards = this.yDistancesBetweenCards(cards)
      const averageDistance = utils.averageOfNumbers(yDistancesBetweenCards)
      let distance = Math.max(averageDistance, spaceBetweenCards)
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          card = utils.clone(card)
          card.y = previousCard.y + previousCard.height + distance
          this.$store.dispatch('currentSpace/updateCard', card)
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
        const multipleCardsSelectedIds = utils.clone(this.multipleCardsSelectedIds)
        const multipleConnectionsSelectedIds = utils.clone(this.multipleConnectionsSelectedIds)
        this.$store.commit('clearMultipleSelected')
        multipleCardsSelectedIds.forEach(cardId => {
          this.$store.dispatch('currentSpace/updateCardConnectionPaths', { cardId, shouldUpdateApi: true })
        })
        this.$store.commit('multipleCardsSelectedIds', multipleCardsSelectedIds)
        this.$store.commit('multipleConnectionsSelectedIds', multipleConnectionsSelectedIds)
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
  .segmented-buttons
    &.first-row
      button
        margin-bottom -1px
      button:first-child
        border-bottom-left-radius 0
      button:last-child
        border-bottom-right-radius 0
    &.last-row
      button:first-child
        border-top-left-radius 0
      button:last-child
        border-top-right-radius 0

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
