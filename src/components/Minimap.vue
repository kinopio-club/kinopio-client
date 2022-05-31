<template lang="pug">
.overlay.minimap(v-if="isVisible" @click="scrollTo" @pointerup="endPanningViewport" @mousemove="panViewport" :style="overlayStyle" @touchmove.stop.prevent)
  .overlay-background(:style="overlayBackgroundStyle")
  //- viewport box
  .viewport-wrap(:style="viewportWrapStyle")
    .viewport.blink(:style="viewportStyle" @pointerdown="startPanningViewport")
    .viewport-top(:style="viewportChildStyle" @pointerdown="startPanningViewport")
      .button-wrap(@pointerdown.stop @pointerup="hideMinimap")
        button.small-button.active
          img.icon(src="@/assets/minimap.svg")
  //- connections
  canvas#minimap-connections
  //- cards
  .cards-wrap
    template(v-for="card in cards")
      .card(:style="cardStyle(card)" :class="{ 'transparent-background': card.imageUrl, 'is-in-viewport': isInViewport(card) }" :data-card-minimap-id="card.id")
  //- remote users
  template(v-for="user in spaceMembers")
    UserLabel(:user="user" :scale="scale")
</template>

<script>
import UserLabel from '@/components/UserLabel.vue'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'

const maxScale = 0.4
let canvas, context

export default {
  name: 'ComponentName',
  components: {
    UserLabel
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'spaceZoomPercent') {
        if (!this.isVisible) { return }
        this.$nextTick(() => {
          this.debouncedInit()
        })
      }
    })
  },
  mounted () {
    window.addEventListener('scroll', this.updateViewport)
    window.addEventListener('resize', this.debouncedInit)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updateViewport)
    window.removeEventListener('resize', this.debouncedInit)
  },
  data () {
    return {
      boundary: {},
      scale: 1,
      cards: [],
      viewport: {},
      isPanningViewport: false,
      cursor: null,
      connections: []
    }
  },
  computed: {
    spaceMembers () {
      const excludeCurrentUser = true
      return this.$store.getters['currentSpace/members'](excludeCurrentUser)
    },
    isVisible () { return this.$store.state.minimapIsVisible },
    overlayStyle () {
      return { cursor: this.cursor }
    },
    overlayBackgroundStyle () {
      const backgroundColor = this.$store.state.currentSpace.backgroundTint
      return {
        cursor: this.cursor,
        backgroundColor
      }
    },
    viewportLeft () { return Math.round(this.viewport.left * this.scale) },
    viewportTop () { return Math.round(this.viewport.top * this.scale) },
    viewportWidth () { return Math.round(this.viewport.width * this.scale) },
    viewportHeight () { return Math.round(this.viewport.height * this.scale) },
    viewportWrapStyle () {
      return {
        left: `${this.viewportLeft}px`,
        top: `${this.viewportTop}px`,
        width: `${this.viewportWidth}px`,
        height: `${this.viewportHeight}px`
      }
    },
    viewportStyle () {
      return {
        borderColor: this.viewport.color,
        cursor: this.cursor
      }
    },
    viewportChildStyle () {
      return {
        backgroundColor: this.viewport.color,
        cursor: this.cursor
      }
    }
  },
  methods: {
    hideMinimap () {
      this.$store.commit('minimapIsVisible', false)
    },
    startPanningViewport (event) {
      this.isPanningViewport = true
      this.cursor = 'grabbing'
      this.scrollTo(event, 'auto')
    },
    endPanningViewport () {
      this.isPanningViewport = false
      this.cursor = null
    },
    panViewport (event) {
      if (!this.isVisible) { return }
      if (!this.isPanningViewport) { return }
      this.scrollTo(event, 'auto')
    },
    debouncedInit: debounce(async function () {
      this.init()
    }, { leading: true }, 350),
    init () {
      this.initBoundary()
      this.initScale()
      this.updateViewport()
      this.initConnections()
      this.initCards()
      this.$nextTick(() => {
        this.initConnectionCanvas()
        this.drawConnections()
      })
    },
    initBoundary () {
      const cards = this.$store.getters['currentCards/all']
      let width = 0
      let height = 0
      cards.forEach(card => {
        const x = card.x + card.width
        const y = card.y + card.height
        if (x > width) {
          width = x
        }
        if (y > height) {
          height = y
        }
      })
      this.boundary = { width, height }
    },
    initScale () {
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      const scaleX = viewportWidth / this.boundary.width
      const scaleY = viewportHeight / this.boundary.height
      const squish = 0.05
      let scale = Math.min(scaleX, scaleY)
      scale = Math.min(utils.roundFloat(scale - squish), maxScale)
      this.scale = scale
    },
    updateViewport () {
      if (!this.isVisible) { return }
      const zoom = this.$store.getters.spaceCounterZoomDecimal
      const color = this.$store.state.currentUser.color
      let width = this.$store.state.viewportWidth * zoom
      let height = this.$store.state.viewportHeight * zoom
      let x = window.scrollX * zoom
      let y = window.scrollY * zoom
      this.viewport = {
        color,
        width: width,
        height: height,
        left: x,
        top: y
      }
    },
    scrollTo (event, behavior) {
      behavior = behavior || 'smooth'
      this.$store.dispatch('closeAllDialogs', 'minimap')
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      const zoom = this.$store.getters.spaceZoomDecimal
      let position = utils.cursorPositionInViewport(event)
      position = {
        x: position.x * zoom,
        y: position.y * zoom
      }
      position = {
        x: position.x / this.scale,
        y: position.y / this.scale
      }
      let scrollTo = {
        x: position.x - (viewportWidth / 2),
        y: position.y - (viewportHeight / 2)
      }
      scrollTo = {
        x: Math.round(scrollTo.x),
        y: Math.round(scrollTo.y)
      }
      scrollTo = {
        left: scrollTo.x,
        top: scrollTo.y,
        behavior
      }
      window.scrollTo(scrollTo)
    },

    // Connections

    scaleCoordinates (coords) {
      const offset = 15
      // x
      coords.x = (coords.x + offset) * this.scale
      coords.x = Math.round(coords.x)
      // y
      coords.y = (coords.y + offset) * this.scale
      coords.y = Math.round(coords.y)
      return coords
    },
    scaleConnectionPath (path) {
      let pathStart = utils.coordsFromConnectionPath(path)
      let pathCurvePoint = utils.curveControlPointFromPath(path)
      let pathEnd = utils.endCoordsFromConnectionPath(path)
      pathStart = this.scaleCoordinates(pathStart)
      pathCurvePoint = this.scaleCoordinates(pathCurvePoint)
      pathEnd = this.scaleCoordinates(pathEnd)
      path = `m${pathStart.x},${pathStart.y} q${pathCurvePoint.x},${pathCurvePoint.y} ${pathEnd.x},${pathEnd.y}`
      return path
    },
    initConnectionCanvas () {
      canvas = document.getElementById('minimap-connections')
      context = canvas.getContext('2d')
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      canvas.width = viewportWidth * window.devicePixelRatio
      canvas.height = viewportHeight * window.devicePixelRatio
      canvas.style.width = viewportWidth + 'px'
      canvas.style.height = viewportHeight + 'px'
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
    },
    initConnections () {
      let connections = utils.clone(this.$store.getters['currentConnections/all'])
      connections = connections.map(connection => {
        const path = this.scaleConnectionPath(connection.path)
        let color = this.$store.getters['currentConnections/typeByTypeId'](connection.connectionTypeId)
        color = color.color
        return {
          id: connection.id,
          path,
          color
        }
      })
      this.connections = connections
    },
    drawConnections () {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.lineWidth = 4
      context.lineCap = 'round'
      this.connections.forEach(connection => {
        context.strokeStyle = connection.color
        const path = new Path2D(connection.path)
        context.stroke(path)
      })
    },

    // Cards

    imageUrlFromCard (card) {
      const imageUrlIsUrlPreview = card.urlPreviewImage && card.urlPreviewIsVisible
      if (imageUrlIsUrlPreview) {
        return card.urlPreviewImage
      }
      const urls = utils.urlsFromString(card.name)
      if (urls) {
        return urls.find(url => utils.urlIsImage(url))
      }
    },
    initCards () {
      let cards = this.$store.getters['currentCards/all']
      const maxImageUrls = 20
      let imageUrls = 0
      cards = cards.map(card => {
        let imageUrl
        if (imageUrls <= maxImageUrls) {
          imageUrl = this.imageUrlFromCard(card)
          if (imageUrl) { imageUrls += 1 }
        }
        return {
          id: card.id,
          x: Math.round(card.x),
          y: Math.round(card.y),
          width: Math.round(card.width),
          height: Math.round(card.height),
          backgroundColor: card.backgroundColor,
          imageUrl
        }
      })
      this.cards = cards
    },
    cardStyle (card) {
      const offset = 10 // .cards margin / 2
      let backgroundImage
      if (card.imageUrl) {
        backgroundImage = `url('${card.imageUrl}')`
      }
      const position = {
        width: `${Math.round(card.width * this.scale)}px`,
        height: `${Math.round(card.height * this.scale)}px`,
        left: `${Math.round(card.x * this.scale - offset)}px`,
        top: `${Math.round(card.y * this.scale - offset)}px`,
        cursor: this.cursor,
        backgroundColor: card.backgroundColor,
        backgroundImage
      }
      return position
    },
    isInViewport (card) {
      const zoom = this.$store.getters.spaceZoomDecimal
      card = {
        x: card.x * zoom,
        y: card.y * zoom,
        width: card.width * zoom,
        height: card.height * zoom
      }
      return utils.isCardInViewport(card)
    }
  },
  watch: {
    isVisible (value) {
      if (value) {
        this.init()
      }
    }
  }
}
</script>

<style lang="stylus">
.overlay.minimap,
.overlay-background
  position fixed
  top 0
  left 0
  width 100vw
  height 100vh
  cursor pointer
  .overlay-background
    background-color var(--primary-background)
    opacity 0.5
  canvas
    position absolute
    opacity 0.99
  .cards-wrap
    position absolute
    left 0
    margin 20px
  .card
    position absolute
    background-color var(--secondary-background)
    border-radius 3px
    background-size cover
    transition 0.3s box-shadow
    &.transparent-background
      background-color transparent !important
    &.is-in-viewport
      box-shadow 5px 5px 0 var(--light-shadow)
  // copied from Community.vue
  .small-button
    padding 0
    padding-left 6px
    padding-right 6px
    margin-left 6px

  --viewport-top-height 22px
  --viewport-top-inset 2px
  .viewport-wrap
    position absolute
    &:hover
      .viewport-top
        height calc(var(--viewport-top-height) + 2px)
  .viewport,
  .viewport-top
    top 0
    left 0
    width 100%
    height 100%
    z-index 1
  .viewport
    position absolute
    transform-origin top left
    border 2px solid
    border-radius 5px
    cursor grab
    box-shadow var(--hover-shadow)
    &:hover
      box-shadow var(--active-shadow)
    &:active
      box-shadow 8px 8px 0 var(--light-shadow)
  .viewport-top
    position absolute
    height var(--viewport-top-height)
    border-top-left-radius 2px
    border-top-right-radius 2px
    cursor grab
    left var(--viewport-top-inset)
    top var(--viewport-top-inset)
    width calc(100% - (var(--viewport-top-inset) * 2))
    text-align right
    .button-wrap
      padding-top 2px
      padding-right 1px
    .small-button
      margin 0
      img
        height 11px

.blink
  animation-duration 0.2s
  animation-name blink
  animation-iteration-count infinite
  animation-direction alternate
  animation-timing-function ease-out
@keyframes blink
  0%
    opacity 1
  100%
    opacity 0.6
</style>
