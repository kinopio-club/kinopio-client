<template lang="pug">
.box(:key="box.id" :style="styles" :class="{hover: isHover, active: isDragging, 'box-jiggle': isDragging, 'is-resizing': isResizing}")
  .box-info(
    @pointerover="updateIsHover(true)"
    @pointerleave="updateIsHover(false)"
    @pointerdown="startBoxInfoInteraction"
    :style="labelStyles"
    :class="{unselectable: isPainting}"

    @pointerup.left="showBoxDetails"
    @keyup.stop.enter="showBoxDetails"
  )
    //- @touchstart="startLocking"
    //- @touchmove="updateCurrentTouchPosition"
    //- @touchend="showCardDetailsTouch"

    //- name
    span {{box.name}}
  //- resize
  .bottom-button-wrap(:class="{unselectable: isPainting}")
    .resize-button-wrap.inline-button-wrap(
        @pointerover="updateIsHover(true)"
        @pointerleave="updateIsHover(false)"
        @pointerdown.left.stop="startResizing"
        @touchstart.stop="startResizing"
      )
      button.inline-button.resize-button(
        tabindex="-1"
        :style="{background: color}"
      )
        img.resize-icon.icon(src="@/assets/resize.svg")

</template>

<script>
import utils from '@/utils.js'

const borderWidth = 2
let prevCursor

export default {
  name: 'Box',
  mounted () {
    window.addEventListener('pointermove', this.moveOrResizeBox)
    window.addEventListener('pointerup', this.endInteraction)
  },
  beforeUnmount () {
    window.removeEventListener('pointermove', this.moveOrResizeBox)
    window.removeEventListener('pointerup', this.endInteraction)
  },
  props: {
    box: Object
  },
  data () {
    return {
      isHover: false,
      newX: 0,
      newY: 0,
      newWidth: 0,
      newHeight: 0
    }
  },
  computed: {
    styles () {
      let { x, y, width, height, color } = this.box
      x = this.newX || x
      y = this.newY || y
      width = this.newWidth || width
      height = this.newHeight || height
      return {
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        height: height + 'px',
        border: `${borderWidth}px solid ${color}`
      }
    },
    color () { return this.box.color },
    labelStyles () {
      return {
        backgroundColor: this.color
      }
    },
    isPainting () { return this.$store.state.currentUserIsPainting },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isDragging () { return this.$store.state.currentUserIsDraggingBox },
    isResizing () { return this.$store.state.currentUserIsResizingBox }
  },
  methods: {
    clearState () {
      this.updateIsDragging(false)
      this.updateIsResizing(false)
      this.newWidth = 0
      this.newHeight = 0
      this.newX = 0
      this.newY = 0
    },
    moveOrResizeBox (event) {
      if (!this.isDragging && !this.isResizing) { return }
      const currentCursor = utils.cursorPositionInPage(event)
      const cursorDelta = {
        x: currentCursor.x - prevCursor.x,
        y: currentCursor.y - prevCursor.y
      }
      // update newx , etc.
      console.log('🌈 during move or resize', cursorDelta)
    },
    endInteraction (event) {
      console.log('🔵 endInteraction afterboxinteraction')

      // if (isResizing or dragging, update history, like afterdrag)

      // update dimensions and reset local newwidth/height

      this.clearState()
    },
    startResizing (event) {
      if (!this.canEditSpace) { return }
      if (utils.isMultiTouch(event)) { return }
      // this.$store.dispatch('history/pause')
      this.$store.dispatch('closeAllDialogs', 'Box.startResizing')
      this.$store.dispatch('clearMultipleSelected')
      this.updateIsResizing(true)
      prevCursor = utils.cursorPositionInPage(event)
      console.log('🚛🚛🚛 isresizing', prevCursor)
      // this.$store.commit('preventDraggedCardFromShowingDetails', true)
      // this.$store.dispatch('currentCards/incrementZ', this.id)
      this.$store.commit('currentUserIsResizingBox', true)
      // let boxIds = [this.id]
      // this.$store.commit('currentUserIsResizingBoxIds', boxIds)
      // const updates = {
      //   userId: this.$store.state.currentUser.id,
      //   cardIds: cardIds
      // }
      // this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteUserResizingBox' }) boxids?
    },
    startBoxInfoInteraction (event) {
      prevCursor = utils.cursorPositionInPage(event)
      this.updateIsDragging(true)
    },

    updateIsResizing (value) {
      this.$store.commit('currentUserIsResizingBox', value)
    },
    updateIsDragging (value) {
      this.$store.commit('currentUserIsDraggingBox', value)
    },
    updateIsHover (value) {
      if (this.isPainting) { return }
      this.isHover = value
    },
    // clearBoxInteractions () {}
    showBoxDetails (event) {
      // if dragging (and has dragged) then { return }
      // this.$store.dispatch('currentBoxes/afterMove')
      if (this.$store.state.currentUserIsPainting) { return }
      // if (isMultiTouch) { return }
      if (this.$store.state.currentUserIsPanningReady || this.$store.state.currentUserIsPanning) { return }
      this.clearState()
      // if (!this.canEditCard) { this.$store.commit('triggerReadOnlyJiggle') } // caneditspace?
      // const userId = this.$store.state.currentUser.id
      // const cardsWereDragged = this.$store.state.cardsWereDragged // boxesWereDragged

      // this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
      // this.preventDraggedButtonBadgeFromShowingDetails = this.$store.state.preventDraggedCardFromShowingDetails
      // if (this.$store.state.preventDraggedCardFromShowingDetails) { return }

      this.$store.dispatch('closeAllDialogs', 'Box.showBoxDetails')
      this.$store.dispatch('clearMultipleSelected')
      this.$store.commit('boxDetailsIsVisibleForBoxId', this.box.id)
      // this.$store.commit('preventCardDetailsOpeningAnimation', true)

      event.stopPropagation() // only stop propagation if cardDetailsIsVisible
      // this.$store.commit('currentUserIsDraggingCard', false)
    }

    // toggleBoxDetails, set boxdetailsposition, boxDetailsIsVisible (like carddetails)
  }
}
</script>

<style lang="stylus">
.box
  position absolute
  border-radius 5px
  min-height 100px
  min-width 100px
  pointer-events none
  &.hover
    box-shadow var(--hover-shadow)
  &.active
    box-shadow var(--active-shadow)
  &.is-resizing
    box-shadow var(--active-shadow)

  .box-info
    pointer-events all
    position absolute
    cursor pointer
    padding 8px
    padding-right 10px
    border-bottom-right-radius 5px
    &:hover
      box-shadow var(--hover-shadow)
    &:active
      box-shadow var(--active-shadow)

  .bottom-button-wrap
    pointer-events all
    position absolute
    right 0px
    bottom 0px
    display flex
    .resize-button-wrap
      z-index 1
      cursor ew-resize
      button
        cursor ew-resize
    img
      -webkit-user-drag none

  .resize-icon
    position absolute
    left 4px
    top 4.5px

.box-jiggle
  animation boxJiggle 0.5s infinite ease-out forwards

@media (prefers-reduced-motion)
  .box-jiggle
    animation none

@keyframes boxJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-1deg)
  50%
    transform rotate(1deg)
  75%
    transform rotate(-1deg)
  100%
    transform rotate(0deg)

</style>
