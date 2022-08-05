<template lang="pug">
.box(
  :key="box.id"
  :data-box-id="box.id"
  :style="styles"
  :class="{hover: isHover, active: isDragging, 'box-jiggle': isDragging, 'is-resizing': isResizing}"
)
  .box-info(
    @pointerover="updateIsHover(true)"
    @pointerleave="updateIsHover(false)"
    @pointerdown.left="startBoxInfoInteraction"
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

  // background
  .background.filled(v-if="hasFill" :style="{background: color}")

</template>

<script>
import utils from '@/utils.js'

import randomColor from 'randomcolor'

const borderWidth = 2
let prevCursor, currentCursor

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
      newHeight: 0,
      boxWasDragged: false
    }
  },
  computed: {
    normalizedBox () {
      const init = 200
      let box = utils.clone(this.box)
      box.x = box.x || init
      box.y = box.y || init
      box.resizeWidth = box.resizeWidth || init
      box.resizeHeight = box.resizeHeight || init
      box.color = box.color || randomColor({ luminosity: 'light' })
      box.fill = box.fill || 'filled'
      return box
    },
    styles () {
      let { x, y, resizeWidth, resizeHeight, color } = this.normalizedBox
      x = Math.max(this.newX || x, 50)
      y = Math.max(this.newY || y, 50)
      const width = this.newWidth || resizeWidth
      const height = this.newHeight || resizeHeight
      return {
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        height: height + 'px',
        border: `${borderWidth}px solid ${color}`
      }
    },
    color () { return this.normalizedBox.color },
    fill () { return this.normalizedBox.fill },
    hasFill () { return this.fill !== 'empty' },
    labelStyles () {
      return {
        backgroundColor: this.color
      }
    },
    isPainting () { return this.$store.state.currentUserIsPainting },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isDragging () {
      const isDragging = this.$store.state.currentUserIsDraggingBox
      const isCurrent = this.$store.state.currentUserIsInteractingBoxId === this.box.id
      return isDragging && isCurrent
    },
    isResizing () {
      const isResizing = this.$store.state.currentUserIsResizingBox
      const isCurrent = this.$store.state.currentUserIsInteractingBoxId === this.box.id
      return isResizing && isCurrent
    },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal }
  },
  methods: {
    moveOrResizeBox (event) {
      if (!this.isDragging && !this.isResizing) { return }
      currentCursor = utils.cursorPositionInPage(event)
      currentCursor = {
        x: currentCursor.x * this.spaceCounterZoomDecimal,
        y: currentCursor.y * this.spaceCounterZoomDecimal
      }
      let delta
      if (prevCursor) {
        delta = {
          x: currentCursor.x - prevCursor.x,
          y: currentCursor.y - prevCursor.y
        }
      } else {
        delta = { x: 0, y: 0 }
        prevCursor = currentCursor
      }
      if (this.isResizing) {
        this.newWidth = this.box.resizeWidth + delta.x
        this.newHeight = this.box.resizeHeight + delta.y
        this.broadcastResize()
      } else if (this.isDragging) {
        this.newX = this.box.x + delta.x
        this.newY = this.box.y + delta.y
        this.$store.commit('currentUserIsDraggingCard', true)
        this.$store.commit('preventMultipleSelectedActionsIsVisible', true)
        this.broadcastMove()
      }
      this.boxWasDragged = true
    },
    startResizing (event) {
      if (!this.canEditSpace) { return }
      if (utils.isMultiTouch(event)) { return }
      this.updateIsResizing(true)
      this.updatePrevCursor()
    },
    startBoxInfoInteraction (event) {
      this.updatePrevCursor()
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      this.$store.commit('currentDraggingCardId', '')
      this.$store.dispatch('closeAllDialogs', 'Box.startBoxInfoInteraction')
      this.$store.dispatch('clearMultipleSelected')
      const preventSelect = event.shiftKey
      this.updateIsDragging(true, preventSelect)
    },
    updatePrevCursor () {
      prevCursor = utils.cursorPositionInPage(event)
      prevCursor = {
        x: prevCursor.x * this.spaceCounterZoomDecimal,
        y: prevCursor.y * this.spaceCounterZoomDecimal
      }
    },
    updateIsResizing (value) {
      this.$store.commit('currentUserIsResizingBox', value)
      if (value) {
        this.$store.commit('currentUserIsInteractingBoxId', this.box.id)
      }
    },
    updateIsDragging (value, preventSelect) {
      this.$store.commit('currentUserIsDraggingBox', value)
      if (value && !preventSelect) {
        this.$store.commit('currentUserIsInteractingBoxId', this.box.id)
        this.selectContainedCards()
      }
    },
    selectContainedCards () {
      const cardMap = this.$store.state.currentCards.cardMap
      cardMap.forEach(card => {
        if (this.isCardInBox(card)) {
          this.$store.dispatch('addToMultipleCardsSelected', card.id)
        }
      })
    },
    isCardInBox (card) {
      if (card.isLocked) { return }
      const box = this.normalizedBox
      const { x, y } = box
      const width = box.resizeWidth
      const height = box.resizeHeight
      // ┌─────────────────────────────────────┐
      // │ Box                                 │
      // │                                     │
      // │                                     │
      // │                                     │
      // │      x1 = x          x2 = x + w     │
      // │         ██───────────────██         │
      // │         │                 │         │
      // │         │      Card       │         │
      // │         │                 │         │
      // │         ██───────────────██         │
      // │      y1 = y          y2 = y + h     │
      // │                                     │
      // │                                     │
      // │                                     │
      // │                                     │
      // └─────────────────────────────────────┘
      const x1 = utils.isBetween({
        value: card.x,
        min: x,
        max: x + width
      })
      const x2 = utils.isBetween({
        value: card.x + card.width,
        min: x,
        max: x + width
      })
      const xIsInside = x1 || x2
      const y1 = utils.isBetween({
        value: card.y,
        min: y,
        max: y + height
      })
      const y2 = utils.isBetween({
        value: card.y + card.height,
        min: y,
        max: y + height
      })
      const yIsInside = y1 || y2
      return xIsInside && yIsInside
    },

    updateIsHover (value) {
      if (this.isPainting) { return }
      this.isHover = value
    },
    // clearBoxInteractions () {}
    showBoxDetails (event) {
      if (this.boxWasDragged) { return }
      // console.log(prevCursor, currentCursor)
      // const cursorsAreClose = utils.cursorsAreClose(prevCursor, currentCursor)
      // console.log('🌍 showBoxDetails', cursorsAreClose)
      // if (!cursorsAreClose) { return }

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
    },
    endInteraction (event) {
      let box
      if (this.isResizing) {
        box = {
          resizeWidth: this.newWidth,
          resizeHeight: this.newHeight
        }
      }
      if (this.isDragging) {
        box = {
          x: this.newX || this.box.x,
          y: this.newY || this.box.y
        }
      }
      if (!box) { return }
      box.id = this.box.id
      this.$store.dispatch('history/resume')
      this.$store.dispatch('currentBoxes/update', box)
      this.$store.dispatch('currentCards/updateCardMap')
      this.clearState()
    },
    clearState () {
      this.updateIsDragging(false)
      this.updateIsResizing(false)
      this.newWidth = 0
      this.newHeight = 0
      this.newX = 0
      this.newY = 0
      this.boxWasDragged = false
      prevCursor = null
      setTimeout(() => {
        this.$store.commit('preventMultipleSelectedActionsIsVisible', false)
        this.$store.dispatch('clearMultipleSelected')
      }, 100)
    },

    // broadcast

    broadcastResize () {
      const box = {
        id: this.box.id,
        resizeWidth: this.newWidth,
        resizeHeight: this.newHeight
      }
      this.$store.dispatch('broadcast/update', { updates: { box }, type: 'resizeBox', handler: 'currentBoxes/resizeBroadcast' })
    },
    broadcastMove () {
      const box = {
        id: this.box.id,
        x: this.newX,
        y: this.newY
      }
      this.$store.dispatch('broadcast/update', { updates: { box }, type: 'moveBox', handler: 'currentBoxes/moveBroadcast' })
    }
  }
}
</script>

<style lang="stylus">
.box
  --min-box-size 70px
  position absolute
  border-radius 5px
  min-height var(--min-box-size)
  min-width var(--min-box-size)
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
    word-break break-word
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

  .background
    position absolute
    left 0px
    top 0px
    width 100%
    height 100%
    z-index -1
    &.filled
      opacity 0.5

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
