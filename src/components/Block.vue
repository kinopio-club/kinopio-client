<template lang="pug">
article(:style="position" :data-block-id="id")
  .block(
    @mousedown.prevent="startDraggingBlock"
    @touchstart.prevent="startDraggingBlock"
    @mouseup="showBlockDetails"
    @touchend="showBlockDetails"
    :class="{jiggle: isConnectingTo || isConnectingFrom || isBeingDragged, active: isConnectingTo || isConnectingFrom || isBeingDragged}",
    :style="selectedColor"
    :data-block-id="id"
  )
    p.name {{name}}
    .connector(
      :data-block-id="id"
      @mousedown="startConnecting"
      @touchstart="startConnecting"
    )
      button(:class="{ active: isConnectingTo || isConnectingFrom}")
        .connected-colors
          template(v-for="type in connectionTypes")
            .color(:style="{ background: type.color}")
        template(v-if="hasConnections")
          img.connector-icon(src="@/assets/connector-closed.svg")
        template(v-else)
          img.connector-icon(src="@/assets/connector-open.svg")

  BlockDetails(
    :block="block"
  )
</template>

<script>
import utils from '@/utils.js'
import BlockDetails from '@/components/dialogs/BlockDetails.vue'

export default {
  components: {
    BlockDetails
  },
  props: {
    block: Object
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
      let isBlockId
      const multipleBlocksSelected = this.$store.state.multipleBlocksSelected
      const currentDraggingBlock = this.$store.state.currentDraggingBlockId
      const isDraggingBlock = this.$store.state.currentUserIsDraggingBlock
      if (multipleBlocksSelected.includes(this.id) || currentDraggingBlock === this.id) {
        isBlockId = true
      }
      return Boolean(isDraggingBlock && isBlockId)
    },
    selectedColor () {
      const multipleBlocksSelected = this.$store.state.multipleBlocksSelected
      const color = this.$store.state.currentUser.color
      if (multipleBlocksSelected.includes(this.id)) {
        return { background: color }
      } else {
        return undefined
      }
    },
    connectionTypes () {
      return this.$store.getters['currentSpace/blockConnectionTypes'](this.id)
    },
    hasConnections () {
      const connections = this.$store.getters['currentSpace/blockConnections'](this.id)
      return Boolean(connections.length)
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
    addConnectionType () {
      // TODO if LS says use last connection, return / do nothing
      this.$store.commit('currentSpace/addConnectionType', {})
    },
    startConnecting (event) {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('preventDraggedBlockFromShowingDetails', true)
      this.$store.commit('multipleBlocksSelected', [])
      if (!this.$store.state.currentUserIsDrawingConnection) {
        this.addConnectionType()
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
  border-radius 3px
  user-select none
  display flex
  align-items flex-start
  background-color var(--block-background)
  max-width 235px
  cursor pointer
  &:hover,
  &.hover
    box-shadow var(--block-hover-shadow)
  &:active,
  &.active
    box-shadow var(--block-active-shadow)
  .name
    margin 8px
    margin-right 5px
    align-self stretch
    min-width 25px
    // multi-line wrapping
    display -webkit-box
    -webkit-box-orient vertical
    -webkit-line-clamp 3
    overflow hidden
  .connector
    padding 8px
    align-self right
    cursor cell
    button
      cursor cell
      position relative
      width: 20px
      height: 16px
      vertical-align top
    &:hover
      button
        box-shadow 3px 3px 0 rgba(0,0,0,0.25)
        background var(--hover-background)
    &:active
      button
        box-shadow none
        color var(--primary)
        background var(--active-background)
  .connected-colors
    position absolute
    left 0
    top 0
    display flex
    height 100%
    width 100%
    border-radius 2px
    overflow hidden
    .color
      width 100%
  .connector-icon
    position absolute
    left 4px
    top 2px
.jiggle
  animation jiggle 0.5s infinite ease-out forwards
@keyframes jiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-3deg)
  50%
    transform rotate(3deg)
  75%
    transform rotate(-3deg)
  100%
    transform rotate(0deg)

</style>
