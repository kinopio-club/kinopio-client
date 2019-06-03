<template lang="pug">
article.card(
  :style="position"
  :data-card-id="id"
  @mousedown="startDraggingCard"
  @touchstart="startDraggingCardTouch"
  @click="showCardDetailsPop"
)
  p {{name}}
  .connector(
    :style="testcolor"
    @mousedown.stop="startConnecting"
    @touchstart.stop="startConnectingTouch"
    :data-card-id="id"
    :class="{ active: isActive }"
  ) O
</template>

<script>
import randomcolor from 'randomcolor'
import utils from '@/utils.js'

export default {
  props: {
    id: Number,
    x: Number,
    y: Number,
    name: String
  },
  created () {
    this.color = randomcolor({ luminosity: 'light' })
  },
  data () {
    return {
      color: undefined
    }
  },
  computed: {
    testcolor () {
      return { background: this.color }
    },
    position () {
      return {
        left: `${this.x}px`,
        top: `${this.y}px`
      }
    },
    isActive () {
      const currentConnection = this.$store.state.currentConnection
      if (currentConnection) {
        return parseInt(currentConnection.cardId) === this.id
      } else {
        return undefined
      }
    }
  },
  methods: {
    startConnecting () {
      console.log('🚒startConnecting')
      this.$store.commit('currentUserIsDrawingConnection', true)
      let start = utils.clone(event.srcElement.getBoundingClientRect())
      start.cardId = this.id
      this.$store.commit('currentConnectionStart', start)
    },
    startConnectingTouch () {
      this.$store.commit('scrollOnViewportEdges', true)
      this.startConnecting()
    },
    startDraggingCard () {
      this.$store.commit('currentUserIsDraggingCard', true)
      this.$store.commit('currentDraggingCardId', this.id)
      this.$store.commit('currentDragCardStartPosition', utils.cursorPosition(event))
    },
    startDraggingCardTouch () {
      this.$store.commit('scrollOnViewportEdges', true)
      this.startDraggingCard()
    },
    showCardDetailsPop () {
      if (this.$store.state.preventDraggedCardFromClicking) {
        this.$store.commit('preventDraggedCardFromClicking', false)
        return
      }
      console.log('🌸 showCardDetailsPop')
    }
  }
}
</script>

<style lang="stylus">
.card
  user-select: none
  display flex
  pointer-events all
  background-color var(--secondary-background)
  position absolute
  max-width 235px
  cursor pointer
  white-space nowrap
  > p
    align-self stretch
    margin 8px
  .connector
    background-color pink
    padding 8px
    align-self right
    cursor cell
    &:hover
      background-color lightgrey !important //temp
    &:active,
    &.active
      background-color grey !important //temp
</style>
