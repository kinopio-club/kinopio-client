<template lang="pug">
aside.offscreen-markers
  .marker.top(v-if="offscreenCardsTop.length" :style="{ left: topMarkerOffset }")
    //- (v-if="hasDirectionTop")
  //- .marker.topleft(v-if="hasDirectionTopLeft")
  //- .marker.topright(v-if="hasDirectionTopRight")
  .marker.left
    //- (v-if="hasDirectionLeft")
  .marker.right
    //- (v-if="hasDirectionRight")
  .marker.bottom
    //- (v-if="hasDirectionBottom")
  //- .marker.bottomleft(v-if="hasDirectionBottomLeft")
  //- .marker.bottomright(v-if="hasDirectionBottomRight")
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'OffscreenMarkers',
  mounted () {
    window.addEventListener('scroll', this.updateOffscreenCards)
    this.updateOffscreenCards()
  },
  data () {
    return {
      offscreenCards: []
    }
  },
  computed: {
    // hasDirectionTop () { return this.hasDirection('top') },
    // hasDirectionTopLeft () { return this.hasDirection('topleft') },
    // hasDirectionTopRight () { return this.hasDirection('topright') },
    // hasDirectionLeft () { return this.hasDirection('left') },
    // hasDirectionRight () { return this.hasDirection('right') },
    // hasDirectionBottom () { return this.hasDirection('bottom') },
    // hasDirectionBottomLeft () { return this.hasDirection('bottomleft') },
    // hasDirectionBottomRight () { return this.hasDirection('bottomright') }

    // top marker
    offscreenCardsTop () { return this.offscreenCards.filter(card => card.direction === 'top') },
    topMarkerOffset () {
      let cards = this.offscreenCardsTop
      if (!cards.length) { return }
      cards = cards.map(card => card.x)
      const average = utils.averageOfNumbers(cards)
      return average + 'px'
    }
  },
  methods: {
    updateOffscreenCards () {
      let cards = utils.clone(this.$store.state.currentSpace.cards)
      cards = cards.filter(card => !utils.isCardInViewport(card))
      cards = cards.map(card => {
        const element = document.querySelector(`article [data-card-id="${card.id}"]`)
        const rect = element.getBoundingClientRect()
        card.x = rect.x + (rect.width / 2)
        card.direction = this.direction(card)
        return card
      })
      this.offscreenCards = cards || []
    },
    // hasDirection (direction) {
    //   return this.offscreenCards.find(card => {
    //     return card.direction === direction
    //   })
    // },
    direction (card) {
      const scrollX = window.scrollX
      const scrollY = window.scrollY
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      let x = ''
      let y = ''
      if (card.y > (viewportHeight + scrollY)) {
        y = 'bottom'
      } else if (card.y < scrollY) {
        y = 'top'
      }
      if (card.x > (viewportWidth + scrollX)) {
        x = 'right'
      } else if (card.x < scrollX) {
        x = 'left'
      }
      return y + x
    },
    updateMarkers () {
      let cards = utils.clone(this.$store.state.currentSpace.cards)
      this.offscreenCards = cards.filter(card => !utils.isCardInViewport(card))
      this.updateDirections()
    }
  }
}
</script>

<style lang="stylus">
height = 18px
width = 12px
edge = 4px

.offscreen-markers
  position fixed
  width 100%
  height 100%
  background-color rgba(255, 193, 93, 0.45)
  .marker
    width width
    height height
    background-repeat no-repeat
    background-size contain
    position absolute
    opacity 0.3
  .top
    top edge
    left "calc(50% -  %s)" % (width / 2)
    transform rotate(90deg)
  .topleft
    top edge
    left edge
    transform rotate(45deg)
  .topright
    top edge
    right edge
    transform rotate(135deg)
  .left
    top "calc(50% -  %s)" % (height / 2)
    left edge
  .right
    top "calc(50% -  %s)" % (height / 2)
    right edge
    transform rotate(180deg)
  .bottom
    bottom edge
    left "calc(50% -  %s)" % (width / 2)
    transform rotate(-90deg)
  .bottomleft
    bottom edge
    left edge
    transform rotate(-45deg)
  .bottomright
    bottom edge
    right edge
    transform rotate(-135deg)
</style>
