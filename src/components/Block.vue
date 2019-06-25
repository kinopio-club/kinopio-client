<template lang="pug">
article(:style="position" :data-block-id="id")
  .block(
    @mousedown.prevent="startDraggingBlock"
    @touchstart.prevent="startDraggingBlock"
    @mouseup="showBlockDetails"
    @touchend="showBlockDetails"
    :class="{jiggle: isConnectingTo || isConnectingFrom}",
    :style="selectedColor"
    :data-block-id="id"
  )
    p {{name}}
    .connector(
      :style="testcolor"
      @mousedown.stop.prevent="startConnecting"
      @touchstart.stop.prevent="startConnecting"
      @click.stop
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
    },
    selectedColor () {
      const multipleBlocksSelected = this.$store.state.multipleBlocksSelected
      const color = this.$store.state.currentUser.color
      if (multipleBlocksSelected.includes(this.id)) {
        return { background: color }
      } else {
        return undefined
      }
    }
  },
  methods: {
    createCurrentConnection (event) {
      const cursor = utils.cursorPositionInViewport(event)
      this.$store.commit('currentConnection', {
        startBlockId: this.id
      })
      this.$store.commit('currentConnectionCursorStart', cursor)
    },
    startConnecting (event) {
      this.$store.commit('closeAllPopOvers')
      this.$store.commit('preventDraggedBlockFromShowingDetails', true)
      this.$store.commit('multipleBlocksSelected', [])
      if (!this.$store.state.currentUserIsDrawingConnection) {
        this.createCurrentConnection(event)
      }
      this.$store.commit('currentUserIsDrawingConnection', true)
    },
    checkIfShouldDragMultipleBlocks () {
      const multipleBlocksSelected = this.$store.state.multipleBlocksSelected
      if (!multipleBlocksSelected.includes(this.id)) {
        this.$store.commit('multipleBlocksSelected', [])
      }
    },
    startDraggingBlock () {
      this.$store.commit('closeAllPopOvers')
      this.$store.commit('currentUserIsDraggingBlock', true)
      this.$store.commit('currentDraggingBlockId', this.id)
      this.checkIfShouldDragMultipleBlocks()
      this.$store.dispatch('currentSpace/incrementSelectedBlocksZ')
    },
    showBlockDetails () {
      if (this.$store.state.preventDraggedBlockFromShowingDetails) {
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
