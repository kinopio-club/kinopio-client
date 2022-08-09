<template lang="pug">
.box(
  :key="box.id"
  :data-box-id="box.id"
  :style="styles"
  :class="{hover: isHover, active: isDragging, 'box-jiggle': isDragging, 'is-resizing': isResizing}"
)

  //- name
  .box-info(
    :data-box-id="box.id"
    @mouseover="updateIsHover(true)"
    @mouseleave="updateIsHover(false)"
    @mousedown.left="startBoxInfoInteraction"
    :style="labelStyles"
    :class="{unselectable: isPainting}"

    @mouseup.left="showBoxDetails"
    @keyup.stop.enter="showBoxDetails"

    @touchstart="startLocking"
    @touchmove="updateCurrentTouchPosition"
    @touchend="showBoxDetailsTouch"
  )
    .locking-frame(v-if="isLocking" :style="lockingFrameStyle")
    template(v-if="isH1")
      h1 {{h1Name}}
    template(v-else-if="isH2")
      h2 {{h2Name}}
    template(v-else)
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

  //- fill
  .background.filled(v-if="hasFill" :style="{background: color}")

</template>

<script>
import utils from '@/utils.js'

import randomColor from 'randomcolor'
import uniq from 'lodash-es/uniq'

const borderWidth = 2
let prevCursor, currentCursor

// locking
// long press to touch drag card
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking
// let isMultiTouch
let initialTouchEvent = {}
let touchPosition = {}
let currentTouchPosition = {}

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
      boxWasDragged: false,
      isLocking: false,
      lockingPercent: 0,
      lockingAlpha: 0
    }
  },
  computed: {
    normalizedBox () {
      return this.normalizeBox(this.box)
    },
    styles () {
      let { x, y, resizeWidth, resizeHeight } = this.normalizedBox
      x = Math.max(this.newX || x, 50)
      y = Math.max(this.newY || y, 50)
      const width = this.newWidth || resizeWidth
      const height = this.newHeight || resizeHeight
      return {
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        height: height + 'px',
        border: `${borderWidth}px solid ${this.color}`
      }
    },
    isSelected () {
      const selectedIds = this.$store.state.multipleBoxesSelectedIds
      return selectedIds.includes(this.box.id)
    },
    userColor () { return this.$store.state.currentUser.color },
    color () {
      if (this.isSelected) {
        return this.userColor
      } else {
        return this.normalizedBox.color
      }
    },
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
      return isDragging && (isCurrent || this.isSelected)
    },
    isResizing () {
      const isResizing = this.$store.state.currentUserIsResizingBox
      const isCurrent = this.$store.state.currentUserIsInteractingBoxId === this.box.id
      return isResizing && isCurrent
    },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    isH1 () {
      const pattern = 'h1Pattern'
      return this.nameHasPattern(pattern)
    },
    isH2 () {
      const pattern = 'h2Pattern'
      return this.nameHasPattern(pattern)
    },
    h1Name () {
      return this.box.name.replace('# ', '')
    },
    h2Name () {
      return this.box.name.replace('## ', '')
    },
    canEditBox () { return this.$store.getters['currentUser/canEditBox']() },
    lockingFrameStyle () {
      const initialPadding = 65 // matches initialLockCircleRadius in magicPaint
      const initialBorderRadius = 50
      const padding = initialPadding * this.lockingPercent
      const borderRadius = Math.max((this.lockingPercent * initialBorderRadius), 5) + 'px'
      const size = `calc(100% + ${padding}px)`
      const position = -(padding / 2) + 'px'
      return {
        width: size,
        height: size,
        left: position,
        top: position,
        background: this.userColor,
        opacity: this.lockingAlpha,
        borderRadius: borderRadius
      }
    },
    multipleBoxesIsSelected () { return Boolean(this.$store.state.multipleBoxesSelectedIds.length) },
    currentBoxIsSelected () {
      const selected = this.$store.state.multipleBoxesSelectedIds
      return selected.find(id => this.box.id === id)
    },
    selectedBoxes () {
      let boxIds = this.$store.state.multipleBoxesSelectedIds
      if (this.isDragging) {
        boxIds = boxIds.concat(this.box.id)
      }
      boxIds = uniq(boxIds)
      return boxIds.map(id => this.$store.getters['currentBoxes/byId'](id))
    }
  },
  methods: {
    normalizeBox (box) {
      const init = 200
      box = utils.clone(box)
      box.x = box.x || init
      box.y = box.y || init
      box.resizeWidth = box.resizeWidth || init
      box.resizeHeight = box.resizeHeight || init
      box.color = box.color || randomColor({ luminosity: 'light' })
      box.fill = box.fill || 'filled'
      return box
    },
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
        if (!this.multipleBoxesIsSelected) {
          this.$store.commit('preventMultipleSelectedActionsIsVisible', true)
        }
        this.broadcastMove()
      }
      this.boxWasDragged = true
    },
    startResizing (event) {
      if (!this.canEditSpace) { return }
      if (utils.isMultiTouch(event)) { return }
      this.updateIsResizing(true)
      this.updatePrevCursor(event)
      event.preventDefault() // allows resizing box without scrolling on mobile
    },
    startBoxInfoInteraction (event) {
      this.updatePrevCursor(event)
      if (!this.currentBoxIsSelected) {
        this.$store.dispatch('clearMultipleSelected')
      }
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      this.$store.commit('currentDraggingCardId', '')
      this.$store.dispatch('closeAllDialogs', 'Box.startBoxInfoInteraction')
      const preventSelect = event.shiftKey
      this.updateIsDragging(true, preventSelect)
    },
    updatePrevCursor (event) {
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
        if (this.isCardInSelectedBoxes(card)) {
          this.$store.dispatch('addToMultipleCardsSelected', card.id)
        }
      })
    },
    isCardInSelectedBoxes (card) {
      if (card.isLocked) { return }
      const boxes = this.selectedBoxes
      const isInside = boxes.find(box => {
        box = this.normalizeBox(box)
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
      })
      return isInside
    },
    updateIsHover (value) {
      if (this.isPainting) { return }
      this.isHover = value
    },
    showBoxDetails (event) {
      if (this.boxWasDragged) { return }
      if (this.$store.state.currentUserIsPainting) { return }
      if (this.$store.state.currentUserIsPanningReady || this.$store.state.currentUserIsPanning) { return }
      this.clearState()
      this.$store.dispatch('closeAllDialogs', 'Box.showBoxDetails')
      this.$store.dispatch('clearMultipleSelected')
      this.$store.commit('boxDetailsIsVisibleForBoxId', this.box.id)
      event.stopPropagation() // only stop propagation if cardDetailsIsVisible
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
      if (!this.multipleBoxesIsSelected) {
        setTimeout(() => {
          this.$store.dispatch('clearMultipleSelected')
          this.$store.commit('preventMultipleSelectedActionsIsVisible', false)
          // }
        }, 100)
      }
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
    },

    // h1, h2

    nameHasPattern (pattern) {
      const result = utils.markdown()[pattern].exec(this.box.name)
      return Boolean(result)
    },

    // touch locking

    cancelLocking () {
      shouldCancelLocking = true
    },

    cancelLockingAnimationFrame () {
      this.isLocking = false
      this.lockingPercent = 0
      this.lockingAlpha = 0
      shouldCancelLocking = false
    },

    startLocking (event) {
      console.log('startLocking', event)
      this.updateTouchPosition(event)
      this.updateCurrentTouchPosition(event)
      this.isLocking = true
      shouldCancelLocking = false
      setTimeout(() => {
        if (!lockingAnimationTimer) {
          lockingAnimationTimer = window.requestAnimationFrame(this.lockingAnimationFrame)
        }
      }, lockingPreDuration)
    },
    lockingAnimationFrame (timestamp) {
      if (!lockingStartTime) {
        lockingStartTime = timestamp
      }
      const elaspedTime = timestamp - lockingStartTime
      const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
      if (!utils.cursorsAreClose(touchPosition, currentTouchPosition)) {
        this.notifyPressAndHoldToDrag()
        this.cancelLockingAnimationFrame()
      }
      if (shouldCancelLocking) {
        this.cancelLockingAnimationFrame()
      }
      if (this.isLocking && percentComplete <= 1) {
        // const minSize = circleRadius
        const percentRemaining = Math.abs(percentComplete - 1)
        this.lockingPercent = percentRemaining
        const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
        this.lockingAlpha = alpha
        window.requestAnimationFrame(this.lockingAnimationFrame)
      } else if (this.isLocking && percentComplete > 1) {
        console.log('🔒🐢 box lockingAnimationFrame locked')
        lockingAnimationTimer = undefined
        lockingStartTime = undefined
        this.isLocking = false
        console.log('locked', initialTouchEvent.touches)

        this.startBoxInfoInteraction(initialTouchEvent)
        // this.$store.commit('triggeredTouchCardDragPosition', touchPosition)
      } else {
        window.cancelAnimationFrame(lockingAnimationTimer)
        lockingAnimationTimer = undefined
        lockingStartTime = undefined
        this.cancelLockingAnimationFrame()
      }
    },

    notifyPressAndHoldToDrag () {
      // const isDrawingConnection = this.$store.state.currentUserIsDrawingConnection
      // if (isDrawingConnection) { return }
      const hasNotified = this.$store.state.hasNotifiedPressAndHoldToDrag
      if (!hasNotified) {
        this.$store.commit('addNotification', { message: 'Press and hold to drag boxes', icon: 'press-and-hold' })
      }
      this.$store.commit('hasNotifiedPressAndHoldToDrag', true)
    },

    updateTouchPosition (event) {
      initialTouchEvent = event
      // isMultiTouch = false
      // if (utils.isMultiTouch(event)) {
      //   isMultiTouch = true
      //   return
      // }
      touchPosition = utils.cursorPositionInViewport(event)
      // const isDrawingConnection = this.$store.state.currentUserIsDrawingConnection
      // if (isDrawingConnection) {
      //   event.preventDefault() // allows swipe to scroll, before card locked
      // }
    },
    updateCurrentTouchPosition (event) {
      currentTouchPosition = utils.cursorPositionInViewport(event)
      if (this.isDragging || this.isResizing) {
        event.preventDefault() // allows dragging boxes without scrolling
      }
    },

    touchIsNearTouchPosition (event) {
      const currentPosition = utils.cursorPositionInViewport(event)
      const touchBlur = 12
      const isTouchX = utils.isBetween({
        value: currentPosition.x,
        min: touchPosition.x - touchBlur,
        max: touchPosition.x + touchBlur
      })
      const isTouchY = utils.isBetween({
        value: currentPosition.y,
        min: touchPosition.y - touchBlur,
        max: touchPosition.y + touchBlur
      })
      if (isTouchX && isTouchY) {
        return true
      }
    },
    showBoxDetailsTouch (event) {
      this.cancelLocking()
      if (this.touchIsNearTouchPosition(event)) {
        this.showBoxDetails(event)
      }
      // const userId = this.$store.state.currentUser.id
      // this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
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

  h1
    font-family var(--serif-font)
    font-size 22px
    font-weight bold
    margin 0
    display inline-block
  h2
    font-family var(--serif-font)
    font-weight normal
    font-size 20px
    margin 0
    display inline-block

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

  .locking-frame
    position absolute
    z-index -1
    pointer-events none

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
