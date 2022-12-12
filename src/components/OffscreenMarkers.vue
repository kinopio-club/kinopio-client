<template lang="pug">
aside.offscreen-markers(v-if="isVisible" :style="positionStyles" :class="{ 'is-dark': isDark }")
  .marker.topleft(v-if="hasDirection('topleft')")
  .marker.topright(v-if="hasDirection('topright')")
  .marker.bottomleft(v-if="hasDirection('bottomleft')")
  .marker.bottomright(v-if="hasDirection('bottomright')")

  .marker.top(v-if="offscreenCards.top.length" :style="{ left: topPosition }")
  .marker.left(v-if="offscreenCards.left.length" :style="{ top: leftPosition }")
  .marker.right(v-if="offscreenCards.right.length" :style="{ top: rightPosition }")
  .marker.bottom(v-if="offscreenCards.bottom.length" :style="{ left: bottomPosition }")
</template>

<script>
import utils from '@/utils.js'
import backgroundImages from '@/data/backgroundImages.json'

import debounce from 'lodash-es/debounce'
import { mapState, mapGetters } from 'vuex'

const offscreenMarkers = new Worker('/web-workers/offscreen-markers.js')

export default {
  name: 'OffscreenMarkers',
  mounted () {
    offscreenMarkers.addEventListener('message', event => {
      this.offscreenCards = event.data
    })
    this.$store.subscribe((mutation, state) => {
      const { type } = mutation
      if (mutation.type === 'isLoadingSpace') {
        this.debouncedUpdateOffscreenMarkers()
        this.updateOffscreenMarkers()
      } else if (type === 'touchScrollOrigin') {
        this.debouncedUpdateOffscreenMarkers()
      }
    })
    window.addEventListener('scroll', this.handleScroll)
    visualViewport.addEventListener('resize', this.updateOffscreenMarkers)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.handleScroll)
    visualViewport.removeEventListener('resize', this.updateOffscreenMarkers)
  },
  data () {
    return {
      viewport: {},
      scrollPosition: { x: 0, y: 0 },
      offscreenCards: {
        top: [],
        left: [],
        right: [],
        bottom: [],
        topleft: [],
        topright: [],
        bottomleft: [],
        bottomright: []
      }
    }
  },
  computed: {
    ...mapState([
      'cardDetailsIsVisibleForCardId',
      'multipleSelectedActionsIsVisible',
      'connectionDetailsIsVisibleForConnectionId',
      'currentSpace',
      'isAddPage',
      'isTouchDevice',
      'touchScrollOrigin',
      'spaceZoomPercent',
      'zoomOrigin'
    ]),
    ...mapGetters([
      'spaceZoomDecimal',
      'currentCards/all',
      'currentScrollPosition',
      'transformCounterTouchScroll'
    ]),
    isVisible () {
      if (this.isAddPage) { return }
      const isTouchDevice = this.$store.getters.isTouchDevice
      if (!isTouchDevice) {
        return true
      }
      let isVisible = true
      if (this.dialogsVisible) { isVisible = false }
      return isVisible
    },
    positionStyles () {
      let position = {
        left: this.scrollPosition.x + 'px',
        top: this.scrollPosition.y + 'px'
      }
      if (this.isTouchDevice) {
        const transform = this.transformCounterTouchScroll
        position = { transform }
      }
      return position
    },

    dialogsVisible () {
      return Boolean(this.cardDetailsIsVisibleForCardId || this.multipleSelectedActionsIsVisible || this.connectionDetailsIsVisibleForConnectionId)
    },
    backgroundImage () {
      const background = this.currentSpace.background
      const backgroundImage = backgroundImages.find(image => {
        return image.url === background
      })
      return backgroundImage
    },
    isDark () {
      if (this.backgroundImage) {
        return this.backgroundImage.isDark
      } else {
        const color = this.currentSpace.backgroundTint
        return utils.colorIsDark(color)
      }
    },
    // top
    topPosition () {
      const offset = utils.outsideSpaceOffset().x
      let cards = this.offscreenCards.top
      if (!cards.length) { return }
      cards = cards.map(card => card.x + offset)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageLeft + 'px'
    },
    // left
    leftPosition () {
      const offset = utils.outsideSpaceOffset().y
      let cards = this.offscreenCards.left
      if (!cards.length) { return }
      cards = cards.map(card => card.y + offset)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageTop + 'px'
    },
    // right
    rightPosition () {
      const offset = utils.outsideSpaceOffset().y
      let cards = this.offscreenCards.right
      if (!cards.length) { return }
      cards = cards.map(card => card.y + offset)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageTop + 'px'
    },
    // bottom
    bottomPosition () {
      const offset = utils.outsideSpaceOffset().x
      let cards = this.offscreenCards.bottom
      if (!cards.length) { return }
      cards = cards.map(card => card.x + offset)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageLeft + 'px'
    }
  },
  methods: {
    hasDirection (direction) {
      return Boolean(this.offscreenCards[direction].length)
    },
    handleScroll () {
      this.updateScrollPosition()
      this.debouncedUpdateOffscreenMarkers()
    },
    updateScrollPosition () {
      this.scrollPosition = this.currentScrollPosition
    },
    debouncedUpdateOffscreenMarkers: debounce(function () {
      this.updateOffscreenMarkers()
    }, 20),
    updateOffscreenMarkers () {
      let cards = this['currentCards/all']
      cards = utils.clone(cards)
      const viewport = utils.visualViewport()
      this.viewport = viewport
      const zoom = this.spaceZoomDecimal
      let scroll = utils.clone(this.currentScrollPosition)
      scroll = utils.updatePositionWithSpaceOffset(scroll)
      offscreenMarkers.postMessage({ cards, viewport, zoom, scroll })
    }
  },
  watch: {
    touchScrollOrigin (value) {
      this.handleScroll()
    },
    spaceZoomPercent (value) {
      this.handleScroll()
    },
    zoomOrigin (value) {
      this.handleScroll()
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
  left 0
  top 0
  width 100dvw
  height 100dvh
  pointer-events none
  z-index 1
  opacity 0.5
  &.is-dark
    .marker
      filter invert(1)

  .marker
    width width
    height height
    background-repeat no-repeat
    background-size contain
    position absolute
    transition 0.1s all
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
