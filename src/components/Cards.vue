<template lang="pug">
.cards
  template(v-for="overlap in cardOverlaps")
    .badge.label-badge.card-overlap-indicator(v-if="canEditSpace" :style="{ left: overlap.x + 'px', top: overlap.y + 'px' }" @click.left="selectOverlap(overlap)")
      span {{overlap.length}}
  //- locked cards rendered in LockedItems
  template(v-for="card in unlockedCards")
    Card(:card="card")
</template>

<script>
import Card from '@/components/Card.vue'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'

const cardOverlaps = new Worker('/web-workers/card-overlaps.js')

export default {
  name: 'Cards',
  components: {
    Card
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateCardOverlaps') {
        this.updateCardOverlapsDebounced()
      }
    })
  },
  mounted () {
    window.addEventListener('scroll', this.updateCardOverlapsDebounced)
    window.addEventListener('resize', this.updateCardOverlapsDebounced)
    this.updateCardOverlaps()
    cardOverlaps.addEventListener('message', event => {
      this.cardOverlaps = event.data
    })
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updateCardOverlapsDebounced)
    window.removeEventListener('resize', this.updateCardOverlapsDebounced)
  },
  data () {
    return {
      cardOverlaps: []
    }
  },
  computed: {
    isPainting () { return this.$store.state.currentUserIsPainting },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    zoomScale () {
      return {
        transform: `scale(${this.spaceZoomDecimal})`
      }
    },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    unlockedCards () { return this.$store.getters['currentCards/isNotLocked'] }
  },
  methods: {
    updateCardOverlapsDebounced: debounce(function () {
      this.updateCardOverlaps()
    }, 500, { leading: true }),
    updateCardOverlaps () {
      let cards = this.$store.getters['currentCards/all']
      cards = utils.clone(cards)
      const viewport = utils.visualViewport()
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      cardOverlaps.postMessage({ cards, viewport, zoom })
    },
    mergeOverlapGroup (previousValue, currentValue) {
      let x = previousValue.x || 0
      if (currentValue.x > x) {
        x = currentValue.x
      }
      let y = previousValue.y || 0
      if (currentValue.y > y) {
        y = currentValue.y
      }
      return { x, y }
    },
    selectOverlap (overlap) {
      this.$store.dispatch('closeAllDialogs', 'Space.selectOverlap')
      const threshold = 20
      const position = {
        x: overlap.x + threshold,
        y: overlap.y + threshold
      }
      this.$store.commit('multipleCardsSelectedIds', overlap.ids)
      this.$store.commit('multipleSelectedActionsPosition', position)
      this.$store.commit('multipleSelectedActionsIsVisible', true)
    }
  }
}
</script>

<style lang="stylus">
.boxes
  position absolute
  top 0
</style>
