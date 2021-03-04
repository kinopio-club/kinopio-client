<template lang="pug">
.align-and-distribute.button-wrap(v-if="visible")
  //- More Options
  template(v-if="moreOptionsIsVisible")
    .row.multi-height-row
      div
        .segmented-buttons.first-row
          button(title="Align Left" :disabled="!canEditSome.cards" @click.left="alignLeft" :class="{active: isLeftAligned}")
            img.icon(src="@/assets/align-left.svg")
          //- TODO center-horizontally
          button(title="Center Horizontally" :disabled="!canEditSome.cards" @click.left="centerHorizontally" :class="{active: isLeftAligned}")
            img.icon(src="@/assets/center-horizontally.svg")
          //- TODO align-right
          button(title="Align Right" :disabled="!canEditSome.cards" @click.left="alignRight" :class="{active: isLeftAligned}")
            img.icon.align-right(src="@/assets/align-left.svg")
          //- TODO distribute-horizontally
          button(v-if="!shouldAutoDistribute" title="Distribute Horizontally" :disabled="!canDistributeCards" @click.left="distributeHorizontally" :class="{active: isLeftAligned}")
            img.icon(src="@/assets/distribute-horizontally.svg")

        .segmented-buttons.last-row
          button(title="Align Top" :disabled="!canEditSome.cards" @click.left="alignTop" :class="{active: isTopAligned}")
            img.icon.align-top(src="@/assets/align-left.svg")
          //- TODO center-verticaly
          button(title="Center Verticaly" :disabled="!canEditSome.cards" @click.left="centerVertically" :class="{active: isTopAligned}")
            img.icon.center-vertically(src="@/assets/center-horizontally.svg")
          //- TODO align-bottom
          button(title="Align Bottom" :disabled="!canEditSome.cards" @click.left="alignBottom" :class="{active: isTopAligned}")
            img.icon.align-bottom(src="@/assets/align-left.svg")
          //- TODO distribute-vertically
          button(v-if="!shouldAutoDistribute" title="Distribute Vertically" :disabled="!canDistributeCards" @click.left="distributeVertically" :class="{active: isTopAligned}")
            img.icon.distribute-vertically(src="@/assets/distribute-horizontally.svg")

          button(title="Less Options" :disabled="!canEditSome.cards" @click.left="toggleMoreOptionsIsVisible" :class="{active: moreOptionsIsVisible}")
            img.down-arrow.up-arrow(src="@/assets/down-arrow.svg")

      //- Auto Distribute
      .checkbox-wrap
        label(title="Auto Distribute" :class="{active: shouldAutoDistribute}" @click.left.prevent="toggleShouldAutoDistribute" @keydown.stop.enter="toggleShouldAutoDistribute")
          input(type="checkbox" v-model="shouldAutoDistribute")
          img.icon(src="@/assets/auto-distribute.svg")

  //- Less Options
  template(v-else)
    .segmented-buttons
      button(title="Align Left" :disabled="!canEditSome.cards" @click.left="alignLeft" :class="{active: isLeftAligned}")
        img.icon(src="@/assets/align-left.svg")
      button(title="Align Top" :disabled="!canEditSome.cards" @click.left="alignTop" :class="{active: isTopAligned}")
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
  data () {
    return {
      // - TODO change this to be a persistent user pref, more from store to user
      shouldAutoDistribute: true
    }
  },
  computed: {
    moreOptionsIsVisible () {
      // - TODO change this to be a persistent user pref, more from store to user
      return this.$store.state.alignAndDistributeMoreOptionsIsVisible
    },
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
    toggleShouldAutoDistribute () {
      const value = !this.shouldAutoDistribute
      this.shouldAutoDistribute = value
      // - TODO change this to be a persistent user pref
      // this.$store.commit('currentUser/shouldAutoDistribute', value)
    },
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
    alignTop () {
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
    centerHorizontally () {
      const cards = this.cardsSortedByX()
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousElement = document.querySelector(`article [data-card-id="${previousCard.id}"]`)
          const previousRect = previousElement.getBoundingClientRect()
          const previousRectBottomSide = previousCard.y + previousRect.height
          card = utils.clone(card)
          card.x = origin.x + (origin.width / 2) - (card.width / 2)
          card.y = previousRectBottomSide + spaceBetweenCards
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    alignRight () {
      const cards = this.cardsSortedByXWidth()
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousElement = document.querySelector(`article [data-card-id="${previousCard.id}"]`)
          const previousRect = previousElement.getBoundingClientRect()
          const previousRectBottomSide = previousCard.y + previousRect.height
          card = utils.clone(card)
          card.x = origin.x + origin.width - card.width
          card.y = previousRectBottomSide + spaceBetweenCards
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },

    distributeHorizontally () {
      // Y|skdlfj| 20/spaceBetweenCards |blahb|X

    },

    alignLeft () {
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
    centerVertically () {
      const cards = this.cardsSortedByX()
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousRightSide = previousCard.x + previousCard.width
          card = utils.clone(card)
          card.x = previousRightSide + spaceBetweenCards
          card.y = origin.y + (origin.height / 2) - (card.height / 2)
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    alignBottom () {
      const cards = this.cardsSortedByYHeight()
      const origin = cards[0]
      cards.forEach((card, index) => {
        if (index > 0) {
          const previousCard = cards[index - 1]
          const previousRightSide = previousCard.x + previousCard.width
          card = utils.clone(card)
          card.y = origin.y + origin.height - card.height
          card.x = previousRightSide + spaceBetweenCards
          this.$store.dispatch('currentSpace/updateCard', card)
        }
      })
      this.updateConnectionPaths()
    },
    distributeVertically () {

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
  .multi-height-row
    align-items flex-end
    margin-bottom 10px !important
    .checkbox-wrap
      margin-left 6px
</style>
