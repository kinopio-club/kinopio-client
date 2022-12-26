<template lang="pug">
dialog.narrow.card-list-item-options(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="positionStyles")
  section
    .row
      button(@click="moveCardToCurrentSpace")
        img.icon.visit(src="@/assets/visit.svg")
        span Move to This Space
    //- .row
    //-   button
    //-     span Move / copy?
      //- .segmented-buttons.move-or-copy-wrap
      //-   button(@click.left.stop="toggleCopyCardsIsVisible" :class="{ active: copyCardsIsVisible }")
      //-     span Copy
      //-     MoveOrCopyItems(:visible="copyCardsIsVisible" :actionIsMove="false" :exportData="exportData")
      //-   button(@click.left.stop="toggleMoveCardsIsVisible" :class="{ active: moveCardsIsVisible }" :disabled="!canEditAll.cards")
      //-     span Move
      //-     MoveOrCopyItems(:visible="moveCardsIsVisible" :actionIsMove="true" :exportData="exportData")

    .row
      button
        span Jump to Card
</template>

<script>
// import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

let prevWindowScroll

export default {
  name: 'cardListItemOptions',
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
      'windowScroll'
    ]),
    ...mapGetters([
    ]),
    visible () { return this.cardListItemOptionsIsVisible },
    positionStyles () {
      return {
        left: this.cardListItemOptionsPosition.x + 'px',
        top: this.cardListItemOptionsPosition.y + 'px'
      }
    }
  },
  methods: {
    moveCardToCurrentSpace () {
      const card = this.cardListItemOptionsCard
      console.log('🐸', card.name, card)
    // get center vp: half vp + scroll - ~halfcardwidthheight
    // api patch: update id w new card x,y, and spaceid
    // commit the card to state: currentCards/create
    // animate//highlight the card
    },
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
  position absolute
  width 190px !important
  // .double-line-height
  //   height 44px
  .icon.visit
    vertical-align 2px
</style>
