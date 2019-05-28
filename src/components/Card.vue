<template lang="pug">
.card(
  :style="position"
  :data-card-id="id"
)
  p {{name}}
  .connector(
    :style="testcolor"
    @mousedown="startConnecting"
    @touchstart="startConnectingTouch"
    :data-card-id="id"
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
    }
  },
  methods: {
    startConnecting () {
      this.$store.commit('currentUserIsDrawingConnection', true)
      let origin = utils.clone(event.srcElement.getBoundingClientRect())
      origin.cardId = event.target.dataset.cardId
      this.$store.commit('drawingConnectionOrigin', origin)
    },
    startConnectingTouch () {
      this.$store.commit('viewportIsLocked', true)
      this.startConnecting()
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
  > p
    align-self stretch
    margin 8px
  .connector
    background-color pink
    padding 8px
    align-self right
    cursor cell
    &:hover
      background-color grey !important //temp
    &:active,
    &.active
      background-color lightgrey !important //temp
</style>
