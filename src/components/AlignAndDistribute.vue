<template lang="pug">
.align-and-distribute.button-wrap(v-if="visible")
  .segmented-buttons
    button(:disabled="!canEditSome.cards" @click.left="alignAndDistributeCardsVertically" :class="{active: isVerticallyAligned}")
      img.icon(src="@/assets/align-vertically.svg")
    button(:disabled="!canEditSome.cards" @click.left="alignAndDistributeCardsHorizontally" :class="{active: isHorizontallyAligned}")
      img.icon(src="@/assets/align-horizontally.svg")
    button(:disabled="!canEditSome.cards" @click.left="toggleMoreOptionsIsVisible" :class="{active: moreOptionsIsVisible}")
      img.down-arrow(src="@/assets/down-arrow.svg")
</template>

<script>
import utils from '@/utils.js'

const spaceBetweenCards = 12

export default {
  name: 'AlignAndDistribute',
  props: {
    visible: Boolean,
    numberOfSelectedItemsCreatedByCurrentUser: Object
  },
  computed: {
    moreOptionsIsVisible () { return this.$store.state.alignAndDistributeMoreOptionsIsVisible },
    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
    multipleConnectionsSelectedIds () { return this.$store.state.multipleConnectionsSelectedIds },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    cards () {
      const cards = this.multipleCardsSelectedIds.map(cardId => {
        return this.$store.getters['currentSpace/cardById'](cardId)
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
    isVerticallyAligned () {
      const xValues = this.cards.map(card => card.x)
      return xValues.every(x => x === xValues[0])
    },
    isHorizontallyAligned () {
      const yValues = this.cards.map(card => card.y)
      return yValues.every(y => y === yValues[0])
    },
    canEditSome () {
      if (this.isSpaceMember) { return { cards: true, connections: true, any: true } }
      const cards = this.numberOfSelectedItemsCreatedByCurrentUser.cards > 0
      const connections = this.numberOfSelectedItemsCreatedByCurrentUser.connections > 0
      const any = cards || connections
      return { cards, connections, any }
    }
  },
  methods: {
    toggleMoreOptionsIsVisible () {
      const value = !this.moreOptionsIsVisible
      this.$store.commit('alignAndDistributeMoreOptionsIsVisible', value)
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
    alignAndDistributeCardsVertically () {
      const cards = this.cardsSortedByY()
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
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },

    alignAndDistributeCardsHorizontally () {
      const cards = this.cardsSortedByX()
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
</style>
