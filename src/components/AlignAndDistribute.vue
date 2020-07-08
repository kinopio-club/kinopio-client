<template lang="pug">
//- dialog.narrow.align-and-distribute(v-if="visible" :open="visible" @click.stop ref="dialog")
//-   section
//-     p Align {{cardsCount}} Cards
//-     .row
//-       button(@click="alignCardsVertically" :class="{active: isVerticallyAligned}")
//-         img.icon(src="@/assets/align-vertically.svg")
//-         span Align Vertically
//-     .row
//-       button(@click="alignCardsHorizontally" :class="{active: isHorizontallyAligned}")
//-         img.icon(src="@/assets/align-horizontally.svg")
//-         span Align Horizontally
//-   section
//-     p Evenly space out {{cardsCount}} cards
//-     p.badge.info(v-if="cannotSpaceOutCards") Select 3 or more cards to space out

//-     .row
//-       button(@click="evenlySpaceTopToBottom" :disabled="cannotSpaceOutCards" :class="{active: isEvenlySpacedTopToBottom}")
//-         img.icon(src="@/assets/space-out-top-to-bottom.svg")
//-         span Top to Bottom
//-     .row
//-       button(@click="evenlySpaceLeftToRight" :disabled="cannotSpaceOutCards" :class="{active: isEvenlySpacedLeftToRight}")
//-         img.icon.space-out-left-to-right(src="@/assets/space-out-left-to-right.svg")
//-         span Left to Right
.button-wrap(v-if="visible")
  .segmented-buttons

    button(:disabled="!canEditSome.cards" @click="alignAndDistributeCardsVertically" :class="{active: isVerticallyAligned}")
      img.icon(src="@/assets/align-vertically.svg")
    button(:disabled="!canEditSome.cards" @click="alignAndDistributeCardsHorizontally" :class="{active: isHorizontallyAligned}")
      img.icon(src="@/assets/align-horizontally.svg")

</template>

<script>
import utils from '@/utils.js'

const spaceBetweenCards = 12

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
    // cannotSpaceOutCards () {
    //   return this.editableCards.length < 3
    // },
    editableCards () {
      if (this.isSpaceMember) {
        return this.cards
      } else {
        return this.cards.filter(card => {
          return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
        })
      }
    },

    // cardsOrientation () {
    //   const cardsSortedByX = this.cardsSortedByX()
    //   const cardsSortedByY = this.cardsSortedByY()
    //   let cardsDeltaX = cardsSortedByX.map((card, index) => {
    //     if (index > 0) {
    //       const origin = cardsSortedByX[0]
    //       return card.x - origin.x
    //     }
    //   })
    //   cardsDeltaX.shift()
    //   let cardsDeltaY = cardsSortedByY.map((card, index) => {
    //     if (index > 0) {
    //       const origin = cardsSortedByY[0]
    //       return card.y - origin.y
    //     }
    //   })
    //   cardsDeltaY.shift()
    //   const delta = {
    //     x: Math.max(...cardsDeltaX),
    //     y: Math.max(...cardsDeltaY)
    //   }
    //   if (delta.x > delta.y) {
    //     return 'x'
    //   } else {
    //     return 'y'
    //   }
    // },

    isVerticallyAligned () {
      const xValues = this.cards.map(card => card.x)
      return xValues.every(x => x === xValues[0])
    },
    isHorizontallyAligned () {
      const yValues = this.cards.map(card => card.y)
      return yValues.every(y => y === yValues[0])
    },
    // isEvenlySpacedTopToBottom () {
    //   const cards = this.cardsSortedByY()
    //   const yDistances = this.yDistancesBetweenCards(cards)
    //   return yDistances.every(y => {
    //     return utils.isBetween({
    //       value: y,
    //       min: yDistances[0] - 1,
    //       max: yDistances[0] + 1
    //     })
    //   })
    // },
    // isEvenlySpacedLeftToRight () {
    //   const cards = this.cardsSortedByX()
    //   const xDistances = this.xDistancesBetweenCards(cards)
    //   return xDistances.every(x => {
    //     return utils.isBetween({
    //       value: x,
    //       min: xDistances[0] - 1,
    //       max: xDistances[0] + 1
    //     })
    //   })
    // },
    canEditSome () {
      if (this.isSpaceMember) { return { cards: true, connections: true, any: true } }
      const cards = this.numberOfSelectedItemsCreatedByCurrentUser.cards > 0
      const connections = this.numberOfSelectedItemsCreatedByCurrentUser.connections > 0
      const any = cards || connections
      return { cards, connections, any }
    }

  },
  methods: {
    alignAndDistributeCardsVertically () {
      const cards = this.editableCards
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousElement = document.querySelector(`article [data-card-id="${previousCard.id}"]`)
          const previousRect = previousElement.getBoundingClientRect()
          const previousRectBottomSide = previousCard.y + previousRect.height
          card = utils.clone(card)
          card.x = origin.x
          card.y = previousRectBottomSide + spaceBetweenCards
          // return card
          this.updateCardPosition(card)
        }
      })
      //       updatedCards.shift()
      // console.log('🌸 updatedCards', updatedCards)
      //       updatedCards.forEach(card => {
      //         this.updateCardPosition(card)
      //       })
    },

    alignAndDistributeCardsHorizontally () {
      const cards = this.editableCards
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousElement = document.querySelector(`article [data-card-id="${previousCard.id}"]`)
          const previousRect = previousElement.getBoundingClientRect()
          const previousRectRightSide = previousCard.x + previousRect.width

          card = utils.clone(card)
          card.y = origin.y
          card.x = previousRectRightSide + spaceBetweenCards
          // return card
          this.updateCardPosition(card)
        }
      })
    },

    // alignAndDistributeCardsHorizontally () {
    //   const origin = this.editableCards[0]
    //   this.editableCards.forEach((card, index) => {
    //     card = utils.clone(card)
    //     card.y = origin.y
    //     this.updateCardPosition(card)
    //   })
    // },
    // // cardsSortedByX () {
    //   return this.editableCards.sort((a, b) => {
    //     return a.x - b.x
    //   })
    // },
    // cardsSortedByY () {
    //   return this.editableCards.sort((a, b) => {
    //     return a.y - b.y
    //   })
    // },
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
    }
    // evenlySpaceTopToBottom () {
    //   const cards = utils.clone(this.cardsSortedByY())
    //   const yDistances = this.yDistancesBetweenCards(cards)
    //   const yAverage = Math.max(utils.averageOfNumbers(yDistances), 20)
    //   // update y positions
    //   let updatedCards = cards.map((card, index) => {
    //     if (index > 0) {
    //       const previousCard = cards[index - 1]
    //       const previousElement = document.querySelector(`article [data-card-id="${previousCard.id}"]`)
    //       const previousRect = previousElement.getBoundingClientRect()
    //       const previousRectBottomSide = previousCard.y + previousRect.height
    //       card.y = previousRectBottomSide + yAverage
    //       return card
    //     }
    //   })
    //   updatedCards.shift()
    //   updatedCards.forEach(card => {
    //     this.updateCardPosition(card)
    //   })
    // },
    // evenlySpaceLeftToRight () {
    //   const cards = utils.clone(this.cardsSortedByX())
    //   const xDistances = this.xDistancesBetweenCards(cards)
    //   const xAverage = Math.max(utils.averageOfNumbers(xDistances), 20)
    //   // update x positions
    //   let updatedCards = cards.map((card, index) => {
    //     if (index > 0) {
    //       const previousCard = cards[index - 1]
    //       const previousElement = document.querySelector(`article [data-card-id="${previousCard.id}"]`)
    //       const previousRect = previousElement.getBoundingClientRect()
    //       const previousRectRightSide = previousCard.x + previousRect.width
    //       card.x = previousRectRightSide + xAverage
    //       return card
    //     }
    //   })
    //   updatedCards.shift()
    //   updatedCards.forEach(card => {
    //     this.updateCardPosition(card)
    //   })
    // }
  }
}
</script>

<style lang="stylus">
</style>
