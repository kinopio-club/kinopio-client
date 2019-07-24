<template lang="pug">
aside.offscreen-markers
  .marker.top(v-if="hasDirectionTop")
  .marker.topleft(v-if="hasDirectionTopLeft")
  .marker.topright(v-if="hasDirectionTopRight")
  .marker.left(v-if="hasDirectionLeft")
  .marker.right(v-if="hasDirectionRight")
  .marker.bottom(v-if="hasDirectionBottom")
  .marker.bottomleft(v-if="hasDirectionBottomLeft")
  .marker.bottomright(v-if="hasDirectionBottomRight")
</template>

<script>
let observer

export default {
  name: 'OffscreenMarkers',
  mounted () {
    this.updateCardsObserver()
  },
  data () {
    return {
      offscreenCards: []
    }
  },
  computed: {
    hasDirectionTop () { return this.hasDirection('top') },
    hasDirectionTopLeft () { return this.hasDirection('topleft') },
    hasDirectionTopRight () { return this.hasDirection('topright') },
    hasDirectionLeft () { return this.hasDirection('left') },
    hasDirectionRight () { return this.hasDirection('right') },
    hasDirectionBottom () { return this.hasDirection('bottom') },
    hasDirectionBottomLeft () { return this.hasDirection('bottomleft') },
    hasDirectionBottomRight () { return this.hasDirection('bottomright') }
  },
  methods: {
    hasDirection (direction) {
      return this.offscreenCards.find(card => {
        return card.direction === direction
      })
    },
    updateDirections () {
      this.offscreenCards.map(card => {
        let x = ''
        let y = ''
        const scrollX = window.scrollX
        const scrollY = window.scrollY
        const viewportWidth = this.$store.state.viewportWidth
        const viewportHeight = this.$store.state.viewportHeight
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
        card.direction = y + x
        return card
      })
    },
    updateCardsObserver () {
      const cards = document.querySelectorAll('.card')
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const cardId = entry.target.dataset.cardId
          const cardX = entry.target.dataset.cardX
          const cardY = entry.target.dataset.cardY
          if (entry.intersectionRatio > 0) {
            this.offscreenCards = this.offscreenCards.filter(card => {
              return card.id !== cardId
            })
          } else {
            const card = {
              id: cardId,
              x: cardX,
              y: cardY
            }
            this.offscreenCards.push(card)
          }
        })

        this.updateDirections()
      })
      cards.forEach(card => {
        observer.observe(card)
      })
    }
  },

  watch: {
    cards (state) {
      observer.disconnect()
      this.updateCardsObserver()
    }
  }

}
</script>

<style lang="stylus">
height = 18px
width = 12px
edge = 4px

.offscreen-markers
  pointer-events none
  .marker
    width width
    height height
    background-repeat no-repeat
    background-size contain
    position fixed
    z-index calc(var(--max-z) - 1)
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
