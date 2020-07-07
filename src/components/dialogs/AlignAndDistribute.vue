<template lang="pug">
dialog.narrow.align-and-distribute(v-if="visible" :open="visible" @click.stop ref="dialog")
  //- section.coordinates
  //-   label(for="x") X
  //-   input(name="x" type="text" placeholder="mixed" v-model="x")
  //-   label(for="x") Y
  //-   input(name="y" type="text" placeholder="mixed" v-model="y")

  section
    p Align {{cardsCount}} Cards
    .row
      button(@click="alignCardsVertically" :class="{active: isVerticallyAligned}")
        img.icon(src="@/assets/align-vertically.svg")
        span Vertically Align
    .row
      button
        img.icon(src="@/assets/align-horizontally.svg")
        span Horizontally Align

  section
    p Evenly space out {{cardsCount}} cards
    p.badge.info(v-if="cannotDistributeCards") Select 3 or more cards to space out

    .row
      button(:disabled="cannotDistributeCards")
        img.icon(src="@/assets/distribute-evenly-vertically.svg")
        span Vertically Even
    .row
      button(:disabled="cannotDistributeCards")
        img.icon.distribute-evenly-horizontally(src="@/assets/distribute-evenly-horizontally.svg")
        span Horizontal Even

</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil
import utils from '@/utils.js'

export default {
  name: 'AlignAndDistribute',
  props: {
    visible: Boolean
  },
  // data () {
  //   return {
  //     colors: []
  //   }
  // },
  computed: {
    multipleCardsSelectedIds () { return this.$store.state.multipleCardsSelectedIds },
    cardsCount () { return this.multipleCardsSelectedIds.length },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    cards () {
      return this.multipleCardsSelectedIds.map(cardId => {
        return this.$store.getters['currentSpace/cardById'](cardId)
      })
    },
    cannotDistributeCards () {
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
    }
    // x: {
    //   get () {
    //     return ''
    //   },
    //   // set (newValue) {
    //   // }
    // },
    // y: {
    //   get () {
    //     return ''
    //   },
    //   // set (newValue) {
    //   // }
    // },

  },
  methods: {
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    alignCardsVertically () {
      const x = this.editableCards[0].x
      this.editableCards.forEach(card => {
        card = utils.clone(card)
        card.x = x
        this.$store.dispatch('currentSpace/updateCard', card)
        this.$nextTick(() => {
          this.$store.dispatch('currentSpace/updateCardConnectionPaths', { cardId: card.id, shouldUpdateApi: true })
        })
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
  .distribute-evenly-horizontally
    vertical-align 1px
</style>
