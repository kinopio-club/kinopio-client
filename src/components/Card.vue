<template lang="pug">
.card(
  :style="position"
  :data-card-id="id"
  @mousedown="startDraggingCard"
  @touchstart="startDraggingCard"
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
      this.$store.commit('currentUserIsDrawingConnection', true)
      let start = utils.clone(event.srcElement.getBoundingClientRect())
      start.cardId = event.target.dataset.cardId
      this.$store.commit('currentConnectionStart', start)
    },
    startConnectingTouch () {
      this.$store.commit('viewportIsLocked', true)
      this.startConnecting()
    },
    showCardDetailsPop () {
      console.log('🌸 showCardDetailsPop')
    },
    startDraggingCard () {
      this.$store.commit('currentUserIsDraggingCard', true)
      console.log('start drag')
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
