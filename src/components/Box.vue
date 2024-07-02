<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import fonts from '@/data/fonts.js'

import randomColor from 'randomcolor'
const store = useStore()

const borderWidth = 2

// locking
// long press to touch drag
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking
let isMultiTouch
let initialTouchEvent = {}
let touchPosition = {}
let currentTouchPosition = {}

let observer

const boxElement = ref(null)

onMounted(() => {
  initViewportObserver()
})
onBeforeUnmount(() => {
  removeViewportObserver()
})

const props = defineProps({
  box: Object
})
const state = reactive({
  isHover: false,
  isLocking: false,
  lockingPercent: 0,
  lockingAlpha: 0,
  isVisibleInViewport: false
})

const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const canEditBox = computed(() => store.getters['currentUser/canEditBox'](props.box))

// normalize

const normalizedBox = computed(() => {
  return normalizeBox(props.box)
})
const normalizeBox = (box) => {
  const init = 200
  box = utils.clone(box)
  box.resizeWidth = box.resizeWidth || init
  box.resizeHeight = box.resizeHeight || init
  box.width = box.resizeWidth
  box.height = box.resizeHeight
  box.color = box.color || randomColor({ luminosity: 'light' })
  box.fill = box.fill || 'filled'
  return box
}

// is visible in viewport

const initViewportObserver = async () => {
  await nextTick()
  try {
    let callback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          state.isVisibleInViewport = true
        } else {
          state.isVisibleInViewport = false
        }
      })
    }
    const target = boxElement.value
    if (!target) { return }
    observer = new IntersectionObserver(callback, { rootMargin: '50%' })
    observer.observe(target)
  } catch (error) {
    console.error('🚒 boxElement initViewportObserver', error)
  }
}
const removeViewportObserver = () => {
  const target = boxElement.value
  if (!observer) { return }
  observer.unobserve(target)
}

// styles

const styles = computed(() => {
  let { x, y, resizeWidth, resizeHeight } = normalizedBox.value
  const width = resizeWidth
  const height = resizeHeight
  let styles = {
    left: x + 'px',
    top: y + 'px',
    width: width + 'px',
    height: height + 'px',
    border: `${borderWidth}px solid ${color.value}`
  }
  styles = updateBoxBorderRadiusStyles(styles, otherBoxes.value)
  return styles
})
const userColor = computed(() => store.state.currentUser.color)
const color = computed(() => {
  const remoteColor = remoteBoxDetailsVisibleColor.value || remoteSelectedColor.value || remoteUserResizingBoxesColor.value || remoteBoxDraggingColor.value
  if (remoteColor) {
    return remoteColor
  } else if (isSelected.value) {
    return userColor.value
  } else {
    return normalizedBox.value.color
  }
})
const colorIsDark = computed(() => utils.colorIsDark(color.value))
const fill = computed(() => normalizedBox.value.fill)
const hasFill = computed(() => fill.value !== 'empty')
const infoClasses = computed(() => {
  const classes = []
  if (isPainting.value) {
    classes.push('unselectable')
  }
  if (colorIsDark.value) {
    classes.push('is-dark')
  }
  const fontId = props.box.headerFontId || 0
  classes.push(`header-font-${fontId}`)
  const fontSize = props.box.headerFontSize || 's'
  classes.push(`header-font-size-${fontSize}`)
  const font = fonts.find(item => item.id === fontId)
  const fontSizeModifier = font?.size || ''
  if (fontSizeModifier) {
    classes.push(`header-font-size-modifier-${fontSizeModifier}`)
  }
  return classes
})

// edge snapping

const otherBoxes = computed(() => {
  const boxes = store.getters['currentBoxes/all']
  return boxes.filter(box => box.id !== props.box.id)
})
const snapGuideStyles = computed(() => {
  if (isDragging.value) {
    return { background: userColor.value }
  } else {
    return { background: props.box.color }
  }
})
const snapGuideSide = computed(() => {
  const isDragging = store.state.currentUserIsDraggingBox
  if (!isDragging) { return null }
  let guides = store.state.currentBoxes.snapGuides
  const snapGuide = guides.find(guide => {
    const isTarget = guide.target.id === props.box.id
    const isOrigin = guide.origin.id === props.box.id
    return isTarget || isOrigin
  })
  if (!snapGuide) { return null }
  if (snapGuide.target.id === props.box.id) {
    return snapGuide.side
  } else if (snapGuide.origin.id === props.box.id) {
    return oppositeSide(snapGuide.side)
  } else {
    return null
  }
})
const oppositeSide = (side) => {
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
}
const updateBoxBorderRadiusStyles = (styles, otherBoxes) => {
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
  const box = normalizedBox.value
  otherBoxes = utils.clone(otherBoxes)
  otherBoxes.forEach(otherBox => {
    otherBox = normalizeBox(otherBox)
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
    if (isTop || snapGuideSide.value === 'top') {
      styles.borderTopRightRadius = 0
      styles.borderTopLeftRadius = 0
    }
    if (isBottom || snapGuideSide.value === 'bottom') {
      styles.borderBottomRightRadius = 0
      styles.borderBottomLeftRadius = 0
    }
    if (isRight || snapGuideSide.value === 'right') {
      styles.borderTopRightRadius = 0
      styles.borderBottomRightRadius = 0
    }
    if (isLeft || snapGuideSide.value === 'left') {
      styles.borderTopLeftRadius = 0
      styles.borderBottomLeftRadius = 0
    }
  })
  return styles
}

// tilt resize

const resizeIsVisible = computed(() => {
  if (isLocked.value) { return }
  if (!canEditSpace.value) { return }
  return true
})
const startResizing = (event) => {
  if (!canEditSpace.value) { return }
  if (utils.isMultiTouch(event)) { return }
  store.dispatch('history/pause')
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsResizingBox', true)
  store.commit('preventMultipleSelectedActionsIsVisible', true)
  let boxIds = [props.box.id]
  const multipleBoxesSelectedIds = store.state.multipleBoxesSelectedIds
  if (multipleBoxesSelectedIds.length) {
    boxIds = multipleBoxesSelectedIds
  }
  store.commit('currentUserIsResizingBoxIds', boxIds)
  const updates = {
    userId: store.state.currentUser.id,
    boxIds: boxIds
  }
  store.commit('broadcast/updateStore', { updates, type: 'updateRemoteUserResizingBoxes' })
  event.preventDefault() // allows resizing box without scrolling on mobile
}

// locked to background

const isLocked = computed(() => props.box.isLocked)

// label

const labelStyles = computed(() => {
  return {
    backgroundColor: color.value
  }
})

// interacting

const isPainting = computed(() => store.state.currentUserIsPainting)
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const shouldJiggle = computed(() => {
  const isMultipleItemsSelected = store.getters.isMultipleItemsSelected
  if (isMultipleItemsSelected) { return }
  return isDragging.value
})
const isDragging = computed(() => {
  const isDragging = store.state.currentUserIsDraggingBox
  const isCurrent = store.state.currentDraggingBoxId === props.box.id
  return isDragging && (isCurrent || isSelected.value)
})
const isResizing = computed(() => {
  const isResizing = store.state.currentUserIsResizingBox
  const isCurrent = store.state.currentUserIsResizingBoxIds.includes(props.box.id)
  return isResizing && isCurrent
})
const startBoxInfoInteraction = (event) => {
  if (!currentBoxIsSelected.value) {
    store.dispatch('clearMultipleSelected')
  }
  store.commit('currentDraggingBoxId', '')
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingBox', true)
  store.commit('currentDraggingBoxId', props.box.id)
  const updates = {
    boxId: props.box.id,
    userId: store.state.currentUser.id
  }
  store.commit('broadcast/updateStore', { updates, type: 'addToRemoteBoxesDragging' })
  if (event.shiftKey) { return } // should not select contained items if shift key
  selectContainedCards()
  selectContainedBoxes()
}
const updateIsHover = (value) => {
  if (isDragging.value) { return }
  if (isPainting.value) { return }
  state.isHover = value
}
const endBoxInfoInteraction = (event) => {
  const isMeta = event.metaKey || event.ctrlKey
  const userId = store.state.currentUser.id
  store.dispatch('currentBoxes/afterMove')
  store.dispatch('currentCards/afterMove')
  if (store.state.currentUserIsPainting) { return }
  if (isMultiTouch) { return }
  if (store.state.currentUserIsPanningReady || store.state.currentUserIsPanning) { return }
  if (!canEditBox.value) { store.commit('triggerReadOnlyJiggle') }
  store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteBoxesDragging' })
  store.dispatch('closeAllDialogs')
  if (isMeta) {
    store.dispatch('multipleBoxesSelectedIds', [])
  } else {
    store.dispatch('clearMultipleSelected')
  }
  if (!store.state.boxesWereDragged && !isMeta) {
    store.commit('boxDetailsIsVisibleForBoxId', props.box.id)
    event.stopPropagation() // prevent stopInteractions() from closing boxDetails
    store.commit('currentUserIsDraggingBox', false)
    store.commit('boxesWereDragged', false)
  }
}

// select

const isSelected = computed(() => {
  const selectedIds = store.state.multipleBoxesSelectedIds
  return selectedIds.includes(props.box.id)
})
const multipleBoxesIsSelected = computed(() => Boolean(store.state.multipleBoxesSelectedIds.length))
const currentBoxIsSelected = computed(() => {
  const selected = store.state.multipleBoxesSelectedIds
  return selected.find(id => props.box.id === id)
})
const selectedBoxes = computed(() => store.getters['currentBoxes/isSelected'])
const selectContainedBoxes = () => {
  let boxes = store.getters['currentBoxes/all']
  boxes = utils.clone(boxes)
  boxes.forEach(box => {
    box.width = box.resizeWidth
    box.height = box.resizeHeight
    if (isItemInSelectedBoxes(box)) {
      store.dispatch('addToMultipleBoxesSelected', box.id)
    }
  })
}
const selectableCards = () => {
  store.dispatch('currentCards/updateCanBeSelectedSortedByY')
  return store.getters['currentCards/canBeSelectedSortedByY'].cards
}
const selectContainedCards = () => {
  const cards = selectableCards()
  cards.forEach(card => {
    if (isItemInSelectedBoxes(card, 'card')) {
      store.dispatch('addToMultipleCardsSelected', card.id)
    }
  })
  if (!multipleBoxesIsSelected.value) {
    store.commit('preventMultipleSelectedActionsIsVisible', true)
  }
}
const isItemInSelectedBoxes = (item, type) => {
  if (type === 'card') {
    const canEditCard = store.getters['currentUser/canEditCard'](item)
    if (!canEditCard) { return }
  }
  if (item.isLocked) { return }
  const boxes = selectedBoxes.value
  const isInside = boxes.find(box => {
    box = normalizeBox(box)
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
}

// Remote

const isRemoteSelected = computed(() => {
  const remoteBoxesSelected = store.state.remoteBoxesSelected
  const selectedBox = remoteBoxesSelected.find(box => box.boxId === props.box.id)
  return Boolean(selectedBox)
})
const isRemoteBoxDetailsVisible = computed(() => {
  const remoteBoxDetailsVisible = store.state.remoteBoxDetailsVisible
  const visibleBox = remoteBoxDetailsVisible.find(box => box.boxId === props.box.id)
  return Boolean(visibleBox)
})
const remoteBoxDetailsVisibleColor = computed(() => {
  const remoteBoxDetailsVisible = store.state.remoteBoxDetailsVisible
  const visibleBox = remoteBoxDetailsVisible.find(box => box.boxId === props.box.id)
  if (visibleBox) {
    const user = store.getters['currentSpace/userById'](visibleBox.userId)
    return user.color
  } else {
    return undefined
  }
})
const isRemoteBoxDragging = computed(() => {
  const remoteBoxesDragging = store.state.remoteBoxesDragging
  const isDragging = remoteBoxesDragging.find(box => box.boxId === props.box.id)
  return Boolean(isDragging)
})
const remoteSelectedColor = computed(() => {
  const remoteBoxesSelected = store.state.remoteBoxesSelected
  const selectedBox = remoteBoxesSelected.find(box => box.boxId === props.box.id)
  if (selectedBox) {
    const user = store.getters['currentSpace/userById'](selectedBox.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteUserResizingBoxesColor = computed(() => {
  const remoteUserResizingBoxes = store.state.remoteUserResizingBoxes
  if (!remoteUserResizingBoxes.length) { return }
  let user = remoteUserResizingBoxes.find(user => user.boxIds.includes(props.box.id))
  if (user) {
    user = store.getters['currentSpace/userById'](user.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteBoxDraggingColor = computed(() => {
  const remoteBoxesDragging = store.state.remoteBoxesDragging
  const draggingBox = remoteBoxesDragging.find(box => box.boxId === props.box.id)
  if (draggingBox) {
    const user = store.getters['currentSpace/userById'](draggingBox.userId)
    return user.color
  } else {
    return undefined
  }
})

// header fonts

const isH1 = computed(() => {
  const pattern = 'h1Pattern'
  return nameHasPattern(pattern)
})
const isH2 = computed(() => {
  const pattern = 'h2Pattern'
  return nameHasPattern(pattern)
})
const h1Name = computed(() => props.box.name.replace('# ', ''))
const h2Name = computed(() => props.box.name.replace('## ', ''))
const nameHasPattern = (pattern) => {
  const result = utils.markdown()[pattern].exec(props.box.name)
  return Boolean(result)
}

// touch locking

const lockingFrameStyle = computed(() => {
  const initialPadding = 65 // matches initialLockCircleRadius in magicPaint
  const initialBorderRadius = 50
  const padding = initialPadding * state.lockingPercent
  const borderRadius = Math.max((state.lockingPercent * initialBorderRadius), 5) + 'px'
  const size = `calc(100% + ${padding}px)`
  const position = -(padding / 2) + 'px'
  return {
    width: size,
    height: size,
    left: position,
    top: position,
    background: userColor.value,
    opacity: state.lockingAlpha,
    borderRadius: borderRadius
  }
})
const cancelLocking = () => {
  shouldCancelLocking = true
}
const cancelLockingAnimationFrame = () => {
  state.isLocking = false
  state.lockingPercent = 0
  state.lockingAlpha = 0
  shouldCancelLocking = false
}
const startLocking = (event) => {
  console.log('startLocking', event)
  updateTouchPosition(event)
  updateCurrentTouchPosition(event)
  state.isLocking = true
  shouldCancelLocking = false
  setTimeout(() => {
    if (!lockingAnimationTimer) {
      lockingAnimationTimer = window.requestAnimationFrame(lockingAnimationFrame)
    }
  }, lockingPreDuration)
}
const lockingAnimationFrame = (timestamp) => {
  if (!lockingStartTime) {
    lockingStartTime = timestamp
  }
  const elaspedTime = timestamp - lockingStartTime
  const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
  if (!utils.cursorsAreClose(touchPosition, currentTouchPosition)) {
    notifyPressAndHoldToDrag()
    cancelLockingAnimationFrame()
  }
  if (shouldCancelLocking) {
    cancelLockingAnimationFrame()
  }
  if (state.isLocking && percentComplete <= 1) {
    const percentRemaining = Math.abs(percentComplete - 1)
    state.lockingPercent = percentRemaining
    const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
    state.lockingAlpha = alpha
    window.requestAnimationFrame(lockingAnimationFrame)
  } else if (state.isLocking && percentComplete > 1) {
    console.log('🔒🐢 box lockingAnimationFrame locked')
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    state.isLocking = false
    startBoxInfoInteraction(initialTouchEvent)
  } else {
    window.cancelAnimationFrame(lockingAnimationTimer)
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    cancelLockingAnimationFrame()
  }
}
const notifyPressAndHoldToDrag = () => {
  const hasNotified = store.state.hasNotifiedPressAndHoldToDrag
  if (!hasNotified) {
    store.commit('addNotification', { message: 'Press and hold to drag', icon: 'press-and-hold' })
  }
  store.commit('hasNotifiedPressAndHoldToDrag', true)
}
const updateTouchPosition = (event) => {
  initialTouchEvent = event
  isMultiTouch = false
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
    return
  }
  touchPosition = utils.cursorPositionInViewport(event)
}
const updateCurrentTouchPosition = (event) => {
  currentTouchPosition = utils.cursorPositionInViewport(event)
  if (isDragging.value || isResizing.value) {
    event.preventDefault() // allows dragging boxes without scrolling
  }
}
const touchIsNearTouchPosition = (event) => {
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
}
const endBoxInfoInteractionTouch = (event) => {
  cancelLocking()
  if (touchIsNearTouchPosition(event)) {
    endBoxInfoInteraction(event)
  }
}
</script>

<template lang="pug">
.box(
  :key="box.id"
  :data-box-id="box.id"
  :data-is-locked="isLocked"
  :data-is-visible-in-viewport="state.isVisibleInViewport"
  :style="styles"
  :class="{hover: state.isHover, active: isDragging, 'box-jiggle': shouldJiggle, 'is-resizing': isResizing}"
  ref="boxElement"
)

  //- name
  .box-info(
    v-if="state.isVisibleInViewport"
    :data-box-id="box.id"
    :style="labelStyles"
    :class="infoClasses"
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
    .locking-frame(v-if="state.isLocking" :style="lockingFrameStyle")
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
    .inline-button-wrap(
        @pointerover="updateIsHover(true)"
        @pointerleave="updateIsHover(false)"
        @mousedown.left="startResizing"
        @touchstart="startResizing"
      )
      button.inline-button(
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

  .box-info
    --header-font var(--header-font-0)
    &.header-font-1
      --header-font var(--header-font-1)
    &.header-font-2
      --header-font var(--header-font-2)
    &.header-font-3
      --header-font var(--header-font-3)
    &.header-font-4
      --header-font var(--header-font-4)
    &.header-font-5
      --header-font var(--header-font-5)
    &.header-font-6
      --header-font var(--header-font-6)
    &.header-font-7
      --header-font var(--header-font-7)
    &.header-font-8
      --header-font var(--header-font-8)
    &.header-font-9
      --header-font var(--header-font-9)
    &.header-font-size-modifier-s
      h1
        font-size 18px
      h2
        font-size 16px
    &.header-font-size-m
      h1
        font-size 44px
      h2
        font-size 36px
      h3
        font-size 24px
    &.header-font-size-l
      h1
        font-size 66px
      h2
        font-size 52px
      h3
        font-size 36px
    pointer-events all
    position absolute
    cursor pointer
    padding 6px 8px
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

  h1
    font-family var(--header-font)
    font-size 20px
    font-weight bold
    margin 0
    display inline-block
  h2
    font-family var(--header-font)
    font-weight normal
    font-size 20px
    margin 0
    display inline-block

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

  // resize
  .bottom-button-wrap
    .inline-button-wrap
      cursor nwse-resize
      button
        cursor nwse-resize
      .resize-icon
        top 0
        left 0

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
