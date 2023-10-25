<template lang="pug">
.box(
  :key="box.id"
  :data-box-id="box.id"
  :data-is-locked="isLocked"
  :style="styles"
  :class="{hover: isHover, active: isDragging, 'box-jiggle': shouldJiggle, 'is-resizing': isResizing}"
)

  //- name
  .box-info(
    :data-box-id="box.id"
    :style="labelStyles"
    :class="{unselectable: isPainting, 'is-dark': colorIsDark}"
    tabindex="0"

    @mouseover="updateIsHover(true)"
    @mouseleave="updateIsHover(false)"
    @mousedown.left="startBoxInfoInteraction"

    @mouseup.left="endBoxInfoInteraction"
    @keyup.stop.enter="endBoxInfoInteraction"

    @touchstart="startLocking"
    @touchmove="updateCurrentTouchPosition"
    @touchend="endBoxInfoInteractionTouch"
  )
    .locking-frame(v-if="isLocking" :style="lockingFrameStyle")
    template(v-if="isH1")
      h1 {{h1Name}}
    template(v-else-if="isH2")
      h2 {{h2Name}}
    template(v-else)
      span {{box.name}}

    .selected-user-avatar(v-if="isRemoteSelected || isRemoteBoxDetailsVisible" :style="{backgroundColor: remoteSelectedColor || remoteBoxDetailsVisibleColor}")
      img(src="@/assets/anon-avatar.svg")

  .lock-button-wrap.inline-button-wrap(v-if="isLocked")
    button.inline-button(tabindex="-1" :style="{background: color}")
      img.icon.lock-icon(src="@/assets/lock.svg")

  //- resize
  .bottom-button-wrap(v-if="resizeIsVisible" :class="{unselectable: isPainting}")
    .resize-button-wrap.inline-button-wrap(
        @pointerover="updateIsHover(true)"
        @pointerleave="updateIsHover(false)"
        @mousedown.left="startResizing"
        @touchstart="startResizing"
      )
      button.inline-button.resize-button(
        tabindex="-1"
      )
        img.resize-icon.icon(src="@/assets/resize-corner.svg")

  //- fill
  .background.filled(v-if="hasFill" :style="{background: color}")
  //- snap guides
  .snap-guide.right(v-if="snapGuideSide === 'right'" :style="snapGuideStyles")
  .snap-guide.left(v-if="snapGuideSide === 'left'" :style="snapGuideStyles")
  .snap-guide.top(v-if="snapGuideSide === 'top'" :style="snapGuideStyles")
  .snap-guide.bottom(v-if="snapGuideSide === 'bottom'" :style="snapGuideStyles")

</template>

<script>
import utils from '@/utils.js'

import randomColor from 'randomcolor'

const borderWidth = 2
// let prevCursor

// locking
// long press to touch drag card
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking
let isMultiTouch
let initialTouchEvent = {}
let touchPosition = {}
let currentTouchPosition = {}

export default {
  name: 'Box',
  props: {
    box: Object
  },
  mounted () {
    const element = document.querySelector(`.box-info[data-box-id="${this.box.id}"]`)
    const DOMRect = element.getBoundingClientRect()
    console.log('🍇box', this.box.id, this.box.infoWidth, DOMRect.width)
    // operation updateBox  w width
  },
  data () {
    return {
      isHover: false,
      isLocking: false,
      lockingPercent: 0,
      lockingAlpha: 0
    }
  },
  computed: {
    snapGuideStyles () {
      if (this.isDragging) {
        return { background: this.userColor }
      } else {
        return { background: this.box.color }
      }
    },
    snapGuideSide () {
      const isDragging = this.$store.state.currentUserIsDraggingBox
      if (!isDragging) { return null }
      let guides = this.$store.state.currentBoxes.snapGuides
      const snapGuide = guides.find(guide => {
        const isTarget = guide.target.id === this.box.id
        const isOrigin = guide.origin.id === this.box.id
        return isTarget || isOrigin
      })
      if (!snapGuide) { return null }
      if (snapGuide.target.id === this.box.id) {
        return snapGuide.side
      } else if (snapGuide.origin.id === this.box.id) {
        return this.oppositeSide(snapGuide.side)
      } else {
        return null
      }
    },
    normalizedBox () {
      return this.normalizeBox(this.box)
    },
    styles () {
      let { x, y, resizeWidth, resizeHeight } = this.normalizedBox
      const width = resizeWidth
      const height = resizeHeight
      let styles = {
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        height: height + 'px',
        border: `${borderWidth}px solid ${this.color}`
      }
      const otherBoxes = this.otherBoxes
      styles = this.updateBoxBorderRadiusStyles(styles, otherBoxes)
      return styles
    },
    otherBoxes () {
      const boxes = this.$store.getters['currentBoxes/all']
      return boxes.filter(box => box.id !== this.box.id)
    },
    isSelected () {
      const selectedIds = this.$store.state.multipleBoxesSelectedIds
      return selectedIds.includes(this.box.id)
    },
    resizeIsVisible () {
      if (this.isLocked) { return }
      if (!this.canEditSpace) { return }
      return true
    },
    isLocked () { return this.box.isLocked },
    userColor () { return this.$store.state.currentUser.color },
    color () {
      const remoteColor = this.remoteBoxDetailsVisibleColor || this.remoteSelectedColor || this.remoteUserResizingBoxesColor || this.remoteBoxDraggingColor
      if (remoteColor) {
        return remoteColor
      } else if (this.isSelected) {
        return this.userColor
      } else {
        return this.normalizedBox.color
      }
    },
    colorIsDark () { return utils.colorIsDark(this.color) },
    fill () { return this.normalizedBox.fill },
    hasFill () { return this.fill !== 'empty' },
    labelStyles () {
      return {
        backgroundColor: this.color
      }
    },
    isPainting () { return this.$store.state.currentUserIsPainting },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    shouldJiggle () {
      const isMultipleItemsSelected = this.$store.getters.isMultipleItemsSelected
      if (isMultipleItemsSelected) { return }
      return this.isDragging
    },
    isDragging () {
      const isDragging = this.$store.state.currentUserIsDraggingBox
      const isCurrent = this.$store.state.currentDraggingBoxId === this.box.id
      return isDragging && (isCurrent || this.isSelected)
    },
    isResizing () {
      const isResizing = this.$store.state.currentUserIsResizingBox
      const isCurrent = this.$store.state.currentUserIsResizingBoxIds.includes(this.box.id)
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
    canEditBox () { return this.$store.getters['currentUser/canEditBox'](this.box) },
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
      return this.$store.getters['currentBoxes/isSelected']
    },

    // Remote

    isRemoteSelected () {
      const remoteBoxesSelected = this.$store.state.remoteBoxesSelected
      const selectedBox = remoteBoxesSelected.find(box => box.boxId === this.box.id)
      return Boolean(selectedBox)
    },
    isRemoteBoxDetailsVisible () {
      const remoteBoxDetailsVisible = this.$store.state.remoteBoxDetailsVisible
      const visibleBox = remoteBoxDetailsVisible.find(box => box.boxId === this.box.id)
      return Boolean(visibleBox)
    },
    remoteBoxDetailsVisibleColor () {
      const remoteBoxDetailsVisible = this.$store.state.remoteBoxDetailsVisible
      const visibleBox = remoteBoxDetailsVisible.find(box => box.boxId === this.box.id)
      if (visibleBox) {
        const user = this.$store.getters['currentSpace/userById'](visibleBox.userId)
        return user.color
      } else {
        return undefined
      }
    },
    isRemoteBoxDragging () {
      const remoteBoxesDragging = this.$store.state.remoteBoxesDragging
      const isDragging = remoteBoxesDragging.find(box => box.boxId === this.box.id)
      return Boolean(isDragging)
    },
    remoteSelectedColor () {
      const remoteBoxesSelected = this.$store.state.remoteBoxesSelected
      const selectedBox = remoteBoxesSelected.find(box => box.boxId === this.box.id)
      if (selectedBox) {
        const user = this.$store.getters['currentSpace/userById'](selectedBox.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteUserResizingBoxesColor () {
      const remoteUserResizingBoxes = this.$store.state.remoteUserResizingBoxes
      if (!remoteUserResizingBoxes.length) { return }
      let user = remoteUserResizingBoxes.find(user => user.boxIds.includes(this.box.id))
      if (user) {
        user = this.$store.getters['currentSpace/userById'](user.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteBoxDraggingColor () {
      const remoteBoxesDragging = this.$store.state.remoteBoxesDragging
      const draggingBox = remoteBoxesDragging.find(box => box.boxId === this.box.id)
      if (draggingBox) {
        const user = this.$store.getters['currentSpace/userById'](draggingBox.userId)
        return user.color
      } else {
        return undefined
      }
    }

  },
  methods: {
    oppositeSide (side) {
      if (side === 'left') {
        return 'right'
      }
      if (side === 'right') {
        return 'left'
      }
      if (side === 'top') {
        return 'bottom'
      }
      if (side === 'bottom') {
        return 'top'
      }
    },
    updateBoxBorderRadiusStyles (styles, otherBoxes) {
      // ┌─────────────┐
      // │  x is same  │
      // ├─────────────┤
      //
      // ├─────────────┼ ─ ─┌────┐
      // │             │    │    │
      // │             │    │    │
      // │ Current Box │    │y is│
      // │             │    │same│
      // │             │    │    │
      // │             │    │    │
      // └─────────────┴ ─ ─└────┴
      const borderWidth = 2
      const box = this.normalizedBox
      otherBoxes = utils.clone(otherBoxes)
      otherBoxes.forEach(otherBox => {
        otherBox = this.normalizeBox(otherBox)
        // x
        const xStartIsSame = otherBox.x === box.x
        const xEndIsSame = otherBox.x + otherBox.width === box.x + box.width
        const xIsSame = xStartIsSame && xEndIsSame
        // y
        const yStartIsSame = otherBox.y === box.y
        const yEndIsSame = otherBox.y + otherBox.height === box.y + box.height
        const yIsSame = yStartIsSame && yEndIsSame
        // sides
        const isTop = xIsSame && (box.y === otherBox.y + otherBox.height - borderWidth)
        const isBottom = xIsSame && (box.y + box.height - borderWidth === otherBox.y)
        const isLeft = yIsSame && (box.x === otherBox.x + otherBox.width - borderWidth)
        const isRight = yIsSame && (box.x + box.width - borderWidth === otherBox.x)
        if (isTop || this.snapGuideSide === 'top') {
          styles.borderTopRightRadius = 0
          styles.borderTopLeftRadius = 0
        }
        if (isBottom || this.snapGuideSide === 'bottom') {
          styles.borderBottomRightRadius = 0
          styles.borderBottomLeftRadius = 0
        }
        if (isRight || this.snapGuideSide === 'right') {
          styles.borderTopRightRadius = 0
          styles.borderBottomRightRadius = 0
        }
        if (isLeft || this.snapGuideSide === 'left') {
          styles.borderTopLeftRadius = 0
          styles.borderBottomLeftRadius = 0
        }
      })
      return styles
    },
    normalizeBox (box) {
      const init = 200
      box = utils.clone(box)
      box.resizeWidth = box.resizeWidth || init
      box.resizeHeight = box.resizeHeight || init
      box.width = box.resizeWidth
      box.height = box.resizeHeight
      box.color = box.color || randomColor({ luminosity: 'light' })
      box.fill = box.fill || 'filled'
      return box
    },
    startResizing (event) {
      if (!this.canEditSpace) { return }
      if (utils.isMultiTouch(event)) { return }
      this.$store.dispatch('history/pause')
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('currentUserIsResizingBox', true)
      this.$store.commit('preventMultipleSelectedActionsIsVisible', true)
      let boxIds = [this.box.id]
      const multipleBoxesSelectedIds = this.$store.state.multipleBoxesSelectedIds
      if (multipleBoxesSelectedIds.length) {
        boxIds = multipleBoxesSelectedIds
      }
      this.$store.commit('currentUserIsResizingBoxIds', boxIds)
      const updates = {
        userId: this.$store.state.currentUser.id,
        boxIds: boxIds
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteUserResizingBoxes' })
      event.preventDefault() // allows resizing box without scrolling on mobile
    },
    startBoxInfoInteraction (event) {
      if (!this.currentBoxIsSelected) {
        this.$store.dispatch('clearMultipleSelected')
      }
      this.$store.commit('currentDraggingBoxId', '')
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('currentUserIsDraggingBox', true)
      this.$store.commit('currentDraggingBoxId', this.box.id)
      const updates = {
        boxId: this.box.id,
        userId: this.$store.state.currentUser.id
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'addToRemoteBoxesDragging' })
      if (event.shiftKey) { return } // should not select contained items if shift key
      this.selectContainedCards()
      this.selectContainedBoxes()
    },
    selectContainedBoxes () {
      let boxes = this.$store.getters['currentBoxes/all']
      boxes = utils.clone(boxes)
      boxes.forEach(box => {
        box.width = box.resizeWidth
        box.height = box.resizeHeight
        if (this.isItemInSelectedBoxes(box)) {
          this.$store.dispatch('addToMultipleBoxesSelected', box.id)
        }
      })
    },
    selectableCards () {
      this.$store.dispatch('currentCards/updateCanBeSelectedSortedByY')
      return this.$store.getters['currentCards/canBeSelectedSortedByY'].cards
    },
    selectContainedCards () {
      const cards = this.selectableCards()
      cards.forEach(card => {
        if (this.isItemInSelectedBoxes(card, 'card')) {
          this.$store.dispatch('addToMultipleCardsSelected', card.id)
        }
      })
      if (!this.multipleBoxesIsSelected) {
        this.$store.commit('preventMultipleSelectedActionsIsVisible', true)
      }
    },
    isItemInSelectedBoxes (item, type) {
      if (type === 'card') {
        const canEditCard = this.$store.getters['currentUser/canEditCard'](item)
        if (!canEditCard) { return }
      }
      if (item.isLocked) { return }
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
        // │         │      Item       │         │
        // │         │                 │         │
        // │         ██───────────────██         │
        // │      y1 = y          y2 = y + h     │
        // │                                     │
        // │                                     │
        // │                                     │
        // │                                     │
        // └─────────────────────────────────────┘
        const x1 = utils.isBetween({
          value: item.x,
          min: x,
          max: x + width
        })
        const x2 = utils.isBetween({
          value: item.x + item.width,
          min: x,
          max: x + width
        })
        const y1 = utils.isBetween({
          value: item.y,
          min: y,
          max: y + height
        })
        const y2 = utils.isBetween({
          value: item.y + item.height,
          min: y,
          max: y + height
        })
        return x1 && x2 && y1 && y2
      })
      return isInside
    },
    updateIsHover (value) {
      if (this.isDragging) { return }
      if (this.isPainting) { return }
      this.isHover = value
    },
    endBoxInfoInteraction (event) {
      const isMeta = event.metaKey || event.ctrlKey
      const userId = this.$store.state.currentUser.id
      this.$store.dispatch('currentBoxes/afterMove')
      this.$store.dispatch('currentCards/afterMove')
      if (this.$store.state.currentUserIsPainting) { return }
      if (isMultiTouch) { return }
      if (this.$store.state.currentUserIsPanningReady || this.$store.state.currentUserIsPanning) { return }
      if (!this.canEditBox) { this.$store.commit('triggerReadOnlyJiggle') }
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteBoxesDragging' })
      this.$store.dispatch('closeAllDialogs')
      if (isMeta) {
        this.$store.dispatch('multipleBoxesSelectedIds', [])
      } else {
        this.$store.dispatch('clearMultipleSelected')
      }
      if (!this.$store.state.boxesWereDragged && !isMeta) {
        this.$store.commit('boxDetailsIsVisibleForBoxId', this.box.id)
        event.stopPropagation() // prevent stopInteractions() from closing boxDetails
        this.$store.commit('currentUserIsDraggingBox', false)
        this.$store.commit('boxesWereDragged', false)
      }
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
        this.startBoxInfoInteraction(initialTouchEvent)
      } else {
        window.cancelAnimationFrame(lockingAnimationTimer)
        lockingAnimationTimer = undefined
        lockingStartTime = undefined
        this.cancelLockingAnimationFrame()
      }
    },
    notifyPressAndHoldToDrag () {
      const hasNotified = this.$store.state.hasNotifiedPressAndHoldToDrag
      if (!hasNotified) {
        this.$store.commit('addNotification', { message: 'Press and hold to drag boxes', icon: 'press-and-hold' })
      }
      this.$store.commit('hasNotifiedPressAndHoldToDrag', true)
    },
    updateTouchPosition (event) {
      initialTouchEvent = event
      isMultiTouch = false
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
        return
      }
      touchPosition = utils.cursorPositionInViewport(event)
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
    endBoxInfoInteractionTouch (event) {
      this.cancelLocking()
      if (this.touchIsNearTouchPosition(event)) {
        this.endBoxInfoInteraction(event)
      }
    }
  }
}
</script>

<style lang="stylus">
.box
  --min-box-size 70px
  position absolute
  border-radius var(--entity-radius)
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
    border-bottom-right-radius var(--entity-radius)
    word-break break-word
    color var(--primary-on-light-background)
    &:hover
      box-shadow var(--hover-shadow)
    &:active
      box-shadow var(--active-shadow)
    &.is-dark
      color var(--primary-on-dark-background)

  .lock-button-wrap
    pointer-events all
    position absolute
    right 0px
    top 0px
    cursor pointer
    button
      border-color transparent
      cursor pointer
    .lock-icon
      opacity 0
      position absolute
      left 5.5px
      top 2px
      height 10px

  .bottom-button-wrap
    pointer-events all
    position absolute
    right 0px
    bottom 0px
    display flex
    .resize-button-wrap
      transform translate(10px, 13px)
      z-index 1
      cursor nwse-resize
      button
        cursor nwse-resize
    img
      -webkit-user-drag none

  .resize-icon
    position absolute
    left 5px
    top 5.5px

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

  // same as Card.vue
  .selected-user-avatar
    padding 0 3px
    border-radius var(--small-entity-radius)
    position absolute
    top -5px
    left -5px
    pointer-events none
    z-index 1
    img
      width 10px
      height 10px

  .snap-guide
    --snap-guide-width 6px
    --snap-guide-duration 1s
    position absolute
    &.left
      left calc(-1 * var(--snap-guide-width))
      width var(--snap-guide-width)
      top -2px
      height calc(100% + 4px)
      animation guideLeft var(--snap-guide-duration) infinite ease-in-out forwards
      border-top-left-radius var(--entity-radius)
      border-bottom-left-radius var(--entity-radius)
    &.right
      right calc(-1 * var(--snap-guide-width))
      width var(--snap-guide-width)
      top -2px
      height calc(100% + 4px)
      animation guideRight var(--snap-guide-duration) infinite ease-in-out forwards
      border-top-right-radius var(--entity-radius)
      border-bottom-right-radius var(--entity-radius)
    &.top
      top calc(-1 * var(--snap-guide-width))
      height var(--snap-guide-width)
      left -2px
      width calc(100% + 4px)
      animation guideTop var(--snap-guide-duration) infinite ease-in-out forwards
      border-top-left-radius var(--entity-radius)
      border-top-right-radius var(--entity-radius)
    &.bottom
      bottom calc(-1 * var(--snap-guide-width))
      height var(--snap-guide-width)
      left -2px
      width calc(100% + 4px)
      animation guideBottom var(--snap-guide-duration) infinite ease-in-out forwards
      border-bottom-left-radius var(--entity-radius)
      border-bottom-right-radius var(--entity-radius)

@keyframes guideRight
  50%
    transform translateX(2px)
@keyframes guideLeft
  50%
    transform translateX(-2px)
@keyframes guideTop
  50%
    transform translateY(-2px)
@keyframes guideBottom
  50%
    transform translateY(2px)

.box-jiggle
  animation boxJiggle 0.5s infinite ease-out forwards

@media (prefers-reduced-motion)
  .box-jiggle
    animation none

@keyframes boxJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-0.5deg)
  50%
    transform rotate(0.5deg)
  75%
    transform rotate(-0.5deg)
  100%
    transform rotate(0deg)

</style>
