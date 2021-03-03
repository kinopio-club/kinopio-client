<template lang="pug">
.align-and-distribute.button-wrap(v-if="visible")
  //- More Options
  template(v-if="moreOptionsIsVisible")
    .segmented-buttons.first-row
      button(title="Align Left" :disabled="!canEditSome.cards" @click.left="alignCardsLeft" :class="{active: isLeftAligned}")
        img.icon(src="@/assets/align-left.svg")
      //- TODO center-horizontally
      button(title="Center Horizontally" :disabled="!canEditSome.cards" @click.left="alignCardsLeft" :class="{active: isLeftAligned}")
        img.icon(src="@/assets/center-horizontally.svg")
      //- TODO align-right
      button(title="Align Right" :disabled="!canEditSome.cards" @click.left="alignCardsLeft" :class="{active: isLeftAligned}")
        img.icon.align-right(src="@/assets/align-left.svg")
      //- TODO distribute-horizontally
      button(title="Distribute Horizontally" :disabled="!canDistributeCards" @click.left="alignCardsLeft" :class="{active: isLeftAligned}")
        img.icon(src="@/assets/distribute-horizontally.svg")

    .segmented-buttons.last-row
      button(title="Align Top" :disabled="!canEditSome.cards" @click.left="alignCardsTop" :class="{active: isTopAligned}")
        img.icon.align-top(src="@/assets/align-left.svg")
      //- TODO center-verticaly
      button(title="Center Verticaly" :disabled="!canEditSome.cards" @click.left="alignCardsTop" :class="{active: isTopAligned}")
        img.icon.center-vertically(src="@/assets/center-horizontally.svg")
      //- TODO align-bottom
      button(title="Align Bottom" :disabled="!canEditSome.cards" @click.left="alignCardsTop" :class="{active: isTopAligned}")
        img.icon.align-bottom(src="@/assets/align-left.svg")
      //- TODO distribute-vertically
      button(title="Distribute Vertically" :disabled="!canDistributeCards" @click.left="alignCardsTop" :class="{active: isTopAligned}")
        img.icon.distribute-vertically(src="@/assets/distribute-horizontally.svg")

      button(title="Less Options" :disabled="!canEditSome.cards" @click.left="toggleMoreOptionsIsVisible" :class="{active: moreOptionsIsVisible}")
        img.down-arrow.up-arrow(src="@/assets/down-arrow.svg")

  //- Less Options
  template(v-else)
    .segmented-buttons
      button(title="Align Left" :disabled="!canEditSome.cards" @click.left="alignCardsLeft" :class="{active: isLeftAligned}")
        img.icon(src="@/assets/align-left.svg")
      button(title="Align Top" :disabled="!canEditSome.cards" @click.left="alignCardsTop" :class="{active: isTopAligned}")
        img.icon.align-top(src="@/assets/align-left.svg")
      button(title="More Options" :disabled="!canEditSome.cards" @click.left="toggleMoreOptionsIsVisible" :class="{active: moreOptionsIsVisible}")
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
    isLeftAligned () {
      const xValues = this.cards.map(card => card.x)
      return xValues.every(x => x === xValues[0])
    },
    isTopAligned () {
      const yValues = this.cards.map(card => card.y)
      return yValues.every(y => y === yValues[0])
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
    alignCardsLeft () {
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

    alignCardsTop () {
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
      margin-bottom 10px
      button:first-child
        border-top-left-radius 0
  .align-top
    transform rotate(90deg)
  .align-bottom
    transform rotate(-90deg)
  .align-right
    transform rotate(180deg)
  .center-vertically
    transform rotate(-90deg)
  .distribute-vertically
    transform rotate(90deg) translateX(1px)
</style>
