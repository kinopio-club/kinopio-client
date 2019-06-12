<template lang="pug">
article(:style="position")
  .block(
    :data-block-id="id"
    @mousedown="startDraggingBlock"
    @touchstart="startDraggingBlockTouch"
    @click="showBlockDetails"
    :class="{jiggle: isConnectingTo || isConnectingFrom}"
  )
    p {{name}}
    .connector(
      :style="testcolor"
      @mousedown.stop="startConnecting"
      @touchstart.stop="startConnectingTouch"
      :data-block-id="id"
      :class="{ active: isConnectingTo }"
    ) O
  BlockDetails(
    :block="block"
  )
</template>

<script>
import randomcolor from 'randomcolor'
import utils from '@/utils.js'
import BlockDetails from '@/components/pop-overs/BlockDetails.vue'

export default {
  components: {
    BlockDetails
  },
  props: {
    block: Object
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
    id () { return this.block.id },
    x () { return this.block.x },
    y () { return this.block.y },
    z () { return this.block.z },
    name () { return this.block.name },

    testcolor () {
      return { background: this.color }
    },
    position () {
      return {
        left: `${this.x}px`,
        top: `${this.y}px`,
        zIndex: this.z
      }
    },
    isConnectingTo () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      if (currentConnectionSuccess) {
        return currentConnectionSuccess.blockId === this.id
      } else {
        return undefined
      }
    },
    isConnectingFrom () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      const currentConnection = this.$store.state.currentConnection
      if (currentConnectionSuccess) {
        return currentConnection.startBlockId === this.id
      } else {
        return undefined
      }
    }
  },
  methods: {
    startConnecting () {
      this.$store.commit('closeAllPopOvers')
      this.$store.commit('currentUserIsDrawingConnection', true)
      let connectorRect = utils.clone(event.srcElement.getBoundingClientRect())
      this.$store.commit('currentConnection', {
        startBlockId: this.id,
        startConnectorRect: connectorRect
      })
    },
    startConnectingTouch () {
      this.startConnecting()
    },
    startDraggingBlock () {
      const cursor = utils.cursorPosition(event)
      const currentDraggingBlock = {
        id: this.id,
        x: cursor.x,
        y: cursor.y
      }
      this.$store.commit('currentSpace/incrementBlockZ', this.id)
      this.$store.commit('currentUserIsDraggingBlock', true)
      this.$store.commit('currentDraggingBlock', currentDraggingBlock)
    },
    startDraggingBlockTouch () {
      this.startDraggingBlock()
    },
    showBlockDetails () {
      if (this.$store.state.preventDraggedBlockFromOpeningAfterDrag) {
        this.$store.commit('preventDraggedBlockFromOpeningAfterDrag', false)
        return
      }
      this.$store.commit('closeAllPopOvers')
      this.$store.commit('currentSpace/blockDetailsVisible', this.id)
    }
  }
}
</script>

<style lang="stylus">
article
  pointer-events all
  position absolute
.block
  user-select: none
  display flex
  background-color var(--block-background)
  max-width 235px
  position absolute
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
.jiggle
  animation: jiggle 0.5s infinite ease-out forwards
@keyframes jiggle
  0%
    transform: rotate(0deg)
  25%
    transform: rotate(-3deg)
  50%
    transform: rotate(3deg)
  75%
    transform: rotate(-3deg)
  100%
    transform: rotate(0deg)
</style>
