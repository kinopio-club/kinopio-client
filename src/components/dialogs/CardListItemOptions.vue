<template lang="pug">
dialog.narrow.card-list-item-options(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="positionStyles")
  section(v-if="!cardIsInCurrentSpace")
    .row
      button(@click="copyCard" :class="{active: isLoadingCopy}")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy to This Space
        Loader(:visible="isLoadingCopy")
    .row
      button(@click="moveCard" :class="{active: isLoadingMove}")
        img.icon.cut(src="@/assets/cut.svg")
        span Move to This Space
        Loader(:visible="isLoadingMove")
  section
    .row
      button
        span Jump to Card
</template>

<script>
// import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

import { mapState, mapGetters } from 'vuex'

let prevWindowScroll

export default {
  name: 'cardListItemOptions',
  components: {
    Loader
  },
  mounted () {
    this.updatePrevWindowScroll()
    window.addEventListener('scroll', this.updatePosition)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePosition)
  },
  data () {
    return {
      isLoadingCopy: false,
      isLoadingMove: false
    }
  },
  computed: {
    ...mapState([
      'cardListItemOptionsPosition',
      'cardListItemOptionsCard',
      'cardListItemOptionsIsVisible',
      'windowScroll',
      'currentSpace'
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
    }
  },
  methods: {
    async copyCard () {
      this.isLoadingCopy = true
      await this.copyCardToCurrentSpace()
      this.isLoadingCopy = false
    },
    async moveCard () {
      this.isLoadingMove = true
      await this.copyCardToCurrentSpace()
      // const card = this.cardListItemOptionsCard
      // remove original card

      // this.isLoadingMove = false
    },
    async copyCardToCurrentSpace () {
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
  .icon.visit
    vertical-align 2px
  .loader
    vertical-align -2px
    margin-left 5px
</style>
