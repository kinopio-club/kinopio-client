<template lang="pug">
.overlay.minimap(v-if="isVisible" @click="scrollTo" @pointerup="endPanningViewport" :style="overlayStyle")
  .overlay-background(:style="overlayBackgroundStyle")
  .viewport-wrap(:style="viewportWrapStyle")
    .viewport(:style="viewportStyle" @pointerdown="startPanningViewport" :class="{ blink: !isPanningViewport }")
    .viewport-top(:style="viewportChildStyle" @pointerdown="startPanningViewport")
    .viewport-background(:style="viewportChildStyle")
  .cards-wrap
    template(v-for="card in cards")
      .card(:style="cardStyle(card)" :class="{ 'transparent-background': card.imageUrl }" :data-card-minimap-id="card.id")
  //- template(v-for="user in spaceMembers")
    //- UserLabel(:user="user") // see Space.vue

</template>

<script>
import utils from '@/utils.js'

const maxScale = 0.4

export default {
  name: 'ComponentName',
  components: {
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateRemoteUserCursor') {
        this.updateRemoteCursors()
      }
    })
  },
  mounted () {
    window.addEventListener('scroll', this.updateViewport)
    window.addEventListener('mousemove', this.panViewport)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updateViewport)
    window.removeEventListener('mousemove', this.panViewport)
  },
  data () {
    return {
      boundary: {},
      scale: 1,
      cards: [],
      viewport: {},
      isPanningViewport: false,
      cursor: null
    }
  },
  computed: {
    isVisible () { return this.$store.state.minimapIsVisible },
    spaceMembers () {
      const excludeCurrentUser = true
      return this.$store.getters['currentSpace/members'](excludeCurrentUser)
    },

    overlayStyle () {
      return { cursor: this.cursor }
    },

    overlayBackgroundStyle () {
      const backgroundColor = this.$store.state.currentSpace.backgroundTint
      return {
        backgroundColor,
        cursor: this.cursor
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
    update () {
      this.updateBoundary()
      this.updateScale()
      this.updateViewport()
      this.updateCards()
    },
    updateBoundary () {
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
    updateScale () {
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
      const color = this.$store.state.currentUser.color
      let width = this.$store.state.viewportWidth
      let height = this.$store.state.viewportHeight
      let x = window.scrollX
      let y = window.scrollY
      this.viewport = {
        color,
        width: width,
        height: height,
        left: x,
        top: y
      }
    },
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
    updateCards () {
      let cards = this.$store.getters['currentCards/all']
      cards = cards.map(card => {
        const imageUrl = this.imageUrlFromCard(card)
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
    scrollTo (event, behavior) {
      behavior = behavior || 'smooth'
      this.$store.dispatch('closeAllDialogs', 'minimap')
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      let position = {
        x: event.clientX / this.scale,
        y: event.clientY / this.scale
      }
      let scrollTo = {
        x: position.x - (viewportWidth / 2),
        y: position.y - (viewportHeight / 2)
      }
      scrollTo = {
        left: Math.max(0, scrollTo.x),
        top: Math.max(0, scrollTo.y),
        behavior
      }
      window.scrollTo(scrollTo)
    }
  },
  watch: {
    isVisible (value) {
      if (value) {
        this.update()
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
    opacity 0.8
  .cards-wrap
    position absolute
    left 0
    margin 20px
    opacity 0.9
  .card
    position absolute
    background-color var(--secondary-background)
    border-radius 1px
    background-size cover
    &.transparent-background
      background-color transparent !important
  .viewport-wrap
    position absolute
    &:hover
      .viewport-top
        height 12px
  .viewport,
  .viewport-top,
  .viewport-background
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
    &:hover
      box-shadow var(--active-shadow)
      animation none
    &:active
      box-shadow 8px 8px 0 var(--light-shadow)
  .viewport-top
    position absolute
    height 10px
    border-top-left-radius 2px
    border-top-right-radius 2px
    cursor grab
    left 2px
    top 2px
    width calc(100% - 4px)
    &:hover
      height 12px
  .viewport-background
    position absolute
    opacity 0.3
    pointer-events none
    border-radius 3px
    mix-blend-mode multiply
    top 12px
    height calc(100% - 14px)
    left 2px
    width calc(100% - 4px)
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
