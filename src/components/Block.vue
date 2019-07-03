<template lang="pug">
article(:style="position" :data-block-id="id")
  .block(
    @mousedown.prevent="startDraggingBlock"
    @touchstart.prevent="startDraggingBlock"
    @mouseup="showBlockDetails"
    @touchend="showBlockDetails"
    :class="{jiggle: isConnectingTo || isConnectingFrom || isBeingDragged}",
    :style="selectedColor"
    :data-block-id="id"
  )
    p.name {{name}}
    .connector(
      :style="testcolor"
      @mousedown="startConnecting"
      @touchstart="startConnecting"
      :data-block-id="id"
      :class="{ active: isConnectingTo || isConnectingFrom}"
    ) O
  BlockDetails(
    :block="block"
  )
</template>

<script>
import randomcolor from 'randomcolor'
import utils from '@/utils.js'
import BlockDetails from '@/components/dialogs/BlockDetails.vue'

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
        return false
      }
    },
    isConnectingFrom () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      const currentConnection = this.$store.state.currentConnection
      if (currentConnectionSuccess) {
        return currentConnection.startBlockId === this.id
      } else {
        return false
      }
    },
    isBeingDragged () {
      const isDraggingBlock = this.$store.state.currentUserIsDraggingBlock
      const isBlockId = this.$store.state.currentDraggingBlockId === this.id
      if (isDraggingBlock && isBlockId) {
        return true
      } else {
        return false
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
      this.$store.commit('closeAllDialogs')
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
      if (this.$store.state.currentUserIsDrawingConnection) { return }
      this.$store.commit('closeAllDialogs')
      this.$store.commit('currentUserIsDraggingBlock', true)
      this.$store.commit('currentDraggingBlockId', this.id)
      this.checkIfShouldDragMultipleBlocks()
      this.$store.dispatch('currentSpace/incrementSelectedBlocksZ')
    },
    showBlockDetails (event) {
      if (this.$store.state.preventDraggedBlockFromShowingDetails) { return }
      this.$store.commit('currentUserIsDraggingBlock', false)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('currentSpace/blockDetailsVisible', this.id)
      event.stopPropagation() // only stop propagation if blockDetailsVisible
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
  cursor pointer
  padding 8px
  .name
    margin 0
    margin-right 5px
    align-self stretch
    min-width: 25px
    // multi-line wrapping
    display -webkit-box
    -webkit-box-orient vertical
    -webkit-line-clamp 3
    overflow hidden

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
