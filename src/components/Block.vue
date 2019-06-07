<template lang="pug">
article.block(
  :style="position"
  :data-block-id="id"
  @mousedown="startDraggingBlock"
  @touchstart="startDraggingBlockTouch"
  @click="showBlockDetailsPop"
)
  p {{name}}
  .connector(
    :style="testcolor"
    @mousedown.stop="startConnecting"
    @touchstart.stop="startConnectingTouch"
    :data-block-id="id"
    :class="{ active: isActive }"
  ) O
</template>

<script>
import randomcolor from 'randomcolor'
import utils from '@/utils.js'

export default {
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
    isActive () {
      const currentConnection = this.$store.state.currentConnection
      if (currentConnection) {
        return currentConnection.blockId === this.id
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
      start.blockId = this.id
      this.$store.commit('currentConnectionStart', start)
    },
    startConnectingTouch () {
      this.startConnecting()
    },
    startDraggingBlock () {
      this.$store.commit('currentSpace/incrementBlockZ', this.id)
      this.$store.commit('currentUserIsDraggingBlock', true)
      this.$store.commit('currentDraggingBlockId', this.id)
      this.$store.commit('currentDragBlockStartPosition', utils.cursorPosition(event))
    },
    startDraggingBlockTouch () {
      this.startDraggingBlock()
    },
    showBlockDetailsPop () {
      if (this.$store.state.preventDraggedBlockFromClicking) {
        this.$store.commit('preventDraggedBlockFromClicking', false)
        return
      }
      console.log('🌸 showBlockDetailsPop')
    }
  }
}
</script>

<style lang="stylus">
.block
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
