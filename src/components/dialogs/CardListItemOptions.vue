<template lang="pug">
dialog.narrow.card-list-item-options(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="positionStyles")
  section(v-if="!cardIsInCurrentSpace")
    .row
      button(@click="copyCard" :disabled="spaceIsReadOnly")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy to This Space
    .row
      button(@click="moveCard" :disabled="spaceIsReadOnly")
        img.icon.cut(src="@/assets/cut.svg")
        span Move to This Space
    .row(v-if="spaceIsReadOnly")
      .badge.info Space is Read Only
  section
    .row
      button(@click="jumpToCard")
        span Jump to Card
</template>

<script>
import utils from '@/utils.js'

import { nanoid } from 'nanoid'
import { mapState, mapGetters } from 'vuex'

let prevWindowScroll

export default {
  name: 'cardListItemOptions',
  components: {
  },
  mounted () {
    this.updatePrevWindowScroll()
    window.addEventListener('scroll', this.updatePosition)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePosition)
  },
  computed: {
    ...mapState([
      'cardListItemOptionsPosition',
      'cardListItemOptionsCard',
      'cardListItemOptionsIsVisible',
      'windowScroll',
      'currentSpace',
      'viewportHeight',
      'viewportWidth'
    ]),
    ...mapGetters([
    ]),
    visible () { return this.cardListItemOptionsIsVisible },
    positionStyles () {
      return {
        left: this.cardListItemOptionsPosition.x + 'px',
        top: this.cardListItemOptionsPosition.y + 'px'
      }
    },
    cardIsInCurrentSpace () {
      console.log(this.cardListItemOptionsCard.spaceId, this.currentSpace.id)
      return this.cardListItemOptionsCard.spaceId === this.currentSpace.id
    },
    spaceIsReadOnly () { return !this.$store.getters['currentUser/canEditSpace']() }
  },
  methods: {
    copyCard () {
      if (this.spaceIsReadOnly) { return }
      this.copyCardToCurrentSpace()
    },
    moveCard () {
      if (this.spaceIsReadOnly) { return }
      this.copyCardToCurrentSpace()
      const card = this.cardListItemOptionsCard
      this.$store.dispatch('api/addToQueue', { name: 'deleteCard', body: card }, { root: true })
      this.$store.commit('cardListItemOptionsIsVisible', false)
      this.$store.commit('triggerRemoveCardFromCardList', card)
    },
    copyCardToCurrentSpace () {
      let card = utils.clone(this.cardListItemOptionsCard)
      card.id = nanoid()
      const position = {
        x: this.windowScroll.x - card.width + (this.viewportWidth / 2),
        y: this.windowScroll.y - card.height + (this.viewportHeight / 2)
      }
      this.$store.dispatch('currentCards/add', {
        id: card.id,
        name: card.name,
        position
      })
      this.$store.dispatch('currentCards/showCardDetails', card.id)
    },
    jumpToCard () {
      const card = this.cardListItemOptionsCard
      if (this.currentSpace.id !== card.spaceId) {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        this.$store.dispatch('currentSpace/changeSpace', {
          space: { id: card.spaceId },
          isRemote: true
        })
      } else {
        this.$store.dispatch('currentCards/showCardDetails', card.id)
      }
    },

    // dialog position

    updatePrevWindowScroll () {
      prevWindowScroll = {
        x: window.scrollX,
        y: window.scrollY
      }
    },
    updatePosition () {
      const delta = {
        x: this.windowScroll.x - prevWindowScroll.x,
        y: this.windowScroll.y - prevWindowScroll.y
      }
      this.$store.commit('cardListItemOptionsPosition', {
        x: this.cardListItemOptionsPosition.x + delta.x,
        y: this.cardListItemOptionsPosition.y + delta.y
      })
      this.updatePrevWindowScroll()
    }
  },
  watch: {
    visible (value) {
      if (!value) { return }
      this.updatePrevWindowScroll()
    }
  }
}
</script>

<style lang="stylus">
dialog.card-list-item-options
  width 190px !important
  position absolute
  .icon.visit
    vertical-align 2px
</style>
