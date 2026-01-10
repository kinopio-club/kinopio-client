<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUpdated, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import fonts from '@/data/fonts.js'
import ItemConnectorButton from '@/components/ItemConnectorButton.vue'
import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'
import smartquotes from 'smartquotes'
import postMessage from '@/postMessage.js'

import randomColor from 'randomcolor'
import { colord, extend } from 'colord'
import uniq from 'lodash-es/uniq'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

let unsubscribes

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

let prevSelectedBox

const boxElement = ref(null)

onMounted(() => {
  initViewportObserver()

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'updateRemoteCurrentConnection' || name === 'removeRemoteCurrentConnection') {
        updateRemoteConnections()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onUpdated(() => {
  initViewportObserver()
})
onBeforeUnmount(() => {
  removeViewportObserver()
  unsubscribes()
})

const props = defineProps({
  box: Object
})
const state = reactive({
  isHover: false,
  isLocking: false,
  lockingPercent: 0,
  lockingAlpha: 0,
  isVisibleInViewport: false,
  shouldRenderParent: false,
  // connections
  isRemoteConnecting: false,
  remoteConnectionColor: ''
})

const spaceCounterZoomDecimal = computed(() => globalStore.getSpaceCounterZoomDecimal)
const canEditBox = computed(() => userStore.getUserCanEditBox(props.box))
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const currentUserColor = computed(() => userStore.color)
const name = computed(() => props.box.name)
const currentBoxIsSelected = computed(() => {
  const selected = globalStore.multipleBoxesSelectedIds
  return selected.find(id => props.box.id === id)
})

// normalize

const normalizedBox = computed(() => {
  return normalizeBox(props.box)
})
const normalizeBox = (box) => {
  box.resizeWidth = box.resizeWidth || consts.minItemXY
  box.resizeHeight = box.resizeHeight || consts.minItemXY
  box.width = box.resizeWidth
  box.height = box.resizeHeight
  box.color = box.color || randomColor({ luminosity: 'light' })
  box.fill = box.fill || 'filled'
  return box
}
const normalizedName = computed(() => {
  // name without checkbox text
  let newName = name.value
  if (!newName) { return }
  const checkbox = utils.checkboxFromString(newName)
  if (checkbox) {
    newName = newName.replace(checkbox, '')
  }
  return newName.trim()
})
const nameSegments = computed(() => {
  const markdownSegments = utils.markdownSegments(normalizedName.value)
  return markdownSegments
})
const smartQuotes = (string) => {
  return smartquotes(string)
}

// should render

const updateShouldRenderParent = (value) => {
  state.shouldRenderParent = value
}
const shouldRender = computed(() => {
  if (globalStore.disableViewportOptimizations) { return true }
  // if (isConnectingFrom.value) { return true }
  return state.isVisibleInViewport || state.shouldRenderParent
})

// is visible in viewport

const initViewportObserver = async () => {
  removeViewportObserver()
  await nextTick()
  try {
    const callback = (entries, observer) => {
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

const fillColor = computed(() => {
  let value = color.value
  value = colord(value).alpha(0.5).toRgbString()
  return value
})
const boxStyles = computed(() => {
  const { x, y, z, resizeWidth, resizeHeight, background } = normalizedBox.value
  const width = resizeWidth
  const height = resizeHeight
  const styles = {
    left: x + 'px',
    top: y + 'px',
    zIndex: z ?? 1,
    width: width + 'px',
    height: height + 'px',
    border: `${borderWidth}px solid ${color.value}`
  }
  if (hasFill.value && !background) {
    styles.backgroundColor = fillColor.value
  }
  return styles
})
const infoStyles = computed(() => {
  const { x, y, resizeWidth } = normalizedBox.value
  // x, y
  const styles = {
    left: x + 'px',
    top: y + 'px',
    maxWidth: resizeWidth + 'px',
    backgroundColor: color.value
  }
  if (isLocked.value) {
    styles.pointerEvents = 'none'
  }
  return styles
})
const backgroundStyles = computed(() => {
  if (!hasFill.value) { return }
  if (!props.box.background) { return }
  const styles = utils.clone(boxStyles.value)
  delete styles.border
  delete styles.backgroundColor
  const isRetina = utils.urlIsRetina(props.box.background)
  if (isRetina) {
    styles.backgroundImage = `image-set("${props.box.background}" 2x)`
  } else {
    styles.backgroundImage = `url("${props.box.background}")`
  }
  if (props.box.backgroundIsStretch) {
    styles.backgroundSize = 'cover'
  }
  return styles
})
const userColor = computed(() => userStore.color)
const color = computed(() => {
  const remoteColor = remoteBoxDetailsVisibleColor.value || remoteSelectedColor.value || remoteUserResizingBoxesColor.value || remoteBoxDraggingColor.value
  if (remoteColor) {
    return remoteColor
  } else if (currentBoxIsSelected.value) {
    return userColor.value
  } else {
    return normalizedBox.value.color
  }
})
const colorIsDark = computed(() => utils.colorIsDark(color.value))
const fill = computed(() => normalizedBox.value.fill)
const hasFill = computed(() => fill.value !== 'empty')
const infoClasses = computed(() => {
  const classList = []
  if (isPainting.value) {
    classList.push('unselectable')
  }
  if (colorIsDark.value) {
    classList.push('is-dark')
  }
  const fontId = props.box.headerFontId || 0
  classList.push(`header-font-${fontId}`)
  const fontSize = props.box.headerFontSize || 's'
  classList.push(`header-font-size-${fontSize}`)
  const font = fonts.find(item => item.id === fontId)
  const fontSizeModifier = font?.size || ''
  if (fontSizeModifier) {
    classList.push(`header-font-size-modifier-${fontSizeModifier}`)
  }
  return classList
})
const classes = computed(() => {
  return {
    hover: state.isHover,
    active: currentBoxIsBeingDragged.value,
    'is-resizing': isResizing.value,
    'is-selected': currentBoxIsSelected.value,
    'is-checked': isChecked.value || isInCheckedBox.value,
    filtered: isFiltered.value,
    transition: !globalStore.currentBoxIsNew || !globalStore.currentUserIsResizingBox
  }
})

// space filters

const filtersIsActive = computed(() => {
  return Boolean(userStore.getUserTotalItemFadingFiltersActive)
})
const isFilteredByUnchecked = computed(() => {
  const filterUncheckedIsActive = userStore.filterUnchecked
  if (!filterUncheckedIsActive) { return }
  return !isChecked.value && hasCheckbox.value
})
const isFilteredByBox = computed(() => {
  const boxIds = globalStore.filteredBoxIds
  return boxIds.includes(props.box.id)
})
const isFiltered = computed(() => {
  if (!filtersIsActive.value) { return }
  const isInFilter = isFilteredByUnchecked.value || isFilteredByBox.value
  return !isInFilter
})

// resize

const resizeIsVisible = computed(() => {
  if (isLocked.value) { return }
  if (!canEditSpace.value) { return }
  if (userStore.getUserIsCommentOnly) { return }
  return true
})
const startResizing = (event) => {
  if (!canEditSpace.value) { return }
  if (utils.isMultiTouch(event)) { return }
  globalStore.closeAllDialogs()
  globalStore.currentUserIsResizingBox = true
  globalStore.preventMultipleSelectedActionsIsVisible = true
  let boxIds = [props.box.id]
  const multipleBoxesSelectedIds = globalStore.multipleBoxesSelectedIds
  if (multipleBoxesSelectedIds.length) {
    boxIds = multipleBoxesSelectedIds
  }
  globalStore.currentUserIsResizingBoxIds = boxIds
  const updates = {
    userId: userStore.id,
    boxIds
  }
  broadcastStore.update({ updates, action: 'updateRemoteUserResizingBoxes' })
  event.preventDefault() // allows resizing box without scrolling on mobile
}
const resizeColorClass = computed(() => {
  const colorClass = utils.colorClasses({ backgroundColorIsDark: colorIsDark.value })
  return [colorClass]
})

// shrink

const shrinkToDefaultBoxSize = () => {
  const update = { id: props.box.id }
  update.resizeWidth = consts.defaultBoxWidth
  update.resizeHeight = consts.defaultBoxHeight
  boxStore.updateBox(update)
}
const shrink = () => {
  prevSelectedBox = props.box
  const { cards, boxes } = boxStore.getItemsContainedInSelectedBoxes(prevSelectedBox)
  prevSelectedBox = null
  const items = cards.concat(boxes)
  if (!items.length) {
    shrinkToDefaultBoxSize()
    return
  }
  const rect = utils.boundaryRectFromItems(items)
  const padding = consts.spaceBetweenCards
  const paddingTop = 30 + padding
  const update = { id: props.box.id }
  update.x = rect.x - padding
  update.y = rect.y - paddingTop
  update.resizeWidth = rect.width + (padding * 2)
  update.resizeHeight = rect.height + (padding + paddingTop)
  boxStore.updateBox(update)
}

// locked to background

const isLocked = computed(() => props.box.isLocked)

// interacting

const isPainting = computed(() => globalStore.currentUserIsPainting)
const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const currentBoxIsBeingDragged = computed(() => {
  const isDragging = globalStore.currentUserIsDraggingBox
  const isCurrent = globalStore.currentDraggingBoxId === props.box.id
  return isDragging && (isCurrent || currentBoxIsSelected.value)
})
const isResizing = computed(() => {
  const isResizing = globalStore.currentUserIsResizingBox
  const isCurrent = globalStore.currentUserIsResizingBoxIds.includes(props.box.id)
  return isResizing && isCurrent
})
const startDraggingDuplicateItems = async (event) => {
  boxStore.selectItemsInSelectedBoxes(props.box)
  let boxIds = globalStore.multipleBoxesSelectedIds.concat([props.box.id])
  boxIds = uniq(boxIds)
  const boxes = boxIds.map(id => boxStore.getBox(id))
  const index = boxIds.findIndex(id => id === props.box.id) || 0

  const cards = globalStore.multipleCardsSelectedIds.map(id => cardStore.getCard(id))
  globalStore.clearMultipleSelected()
  // create new items
  const newItems = await utils.uniqueSpaceItems({
    cards: utils.clone(cards),
    boxes: utils.clone(boxes)
  })
  const newCards = newItems.cards.map(card => {
    card.z += 1
    return card
  })
  const newBoxes = newItems.boxes.map(box => {
    box.z += 1
    return box
  })
  const newCurrentBox = newBoxes[index]
  newCards.forEach(card => cardStore.createCard(card, true))
  newBoxes.forEach(box => boxStore.createBox(box, true))
  // select new items
  globalStore.multipleCardsSelectedIds = newCards.map(card => card.id)
  globalStore.multipleBoxesSelectedIds = newBoxes.map(box => box.id)
  globalStore.multipleCardsSelectedIds = newCards.map(card => card.id)
  return newCurrentBox.id
}
const startBoxInfoInteraction = async (event) => {
  if (event.target.closest('.connector')) {
    return
  }
  if (!currentBoxIsSelected.value) {
    globalStore.clearMultipleSelected()
  }
  if (!canEditBox.value) { return }
  globalStore.currentDraggingBoxId = ''
  globalStore.closeAllDialogs()
  globalStore.currentUserIsDraggingBox = true
  let boxId = props.box.id
  if (event.altKey) {
    boxId = await startDraggingDuplicateItems(event)
  }
  globalStore.currentDraggingBoxId = boxId
  boxStore.incrementBoxZ(boxId)
}
const updateIsHover = (value) => {
  if (globalStore.currentUserIsDraggingBox) { return }
  if (isPainting.value) { return }
  state.isHover = value
  if (value) {
    globalStore.currentUserIsHoveringOverBoxId = props.box.id
  } else {
    globalStore.currentUserIsHoveringOverBoxId = ''
  }
}
const endBoxInfoInteraction = (event) => {
  if (isConnectingTo.value) { return }
  const isMeta = event.metaKey || event.ctrlKey
  const userId = userStore.id
  if (globalStore.currentUserIsPainting) { return }
  if (isMultiTouch) { return }
  if (globalStore.currentUserIsPanningReady || globalStore.currentUserIsPanning) { return }
  if (!canEditBox.value) { globalStore.triggerReadOnlyJiggle() }
  broadcastStore.update({ updates: { userId }, action: 'clearRemoteBoxesDragging' })
  globalStore.closeAllDialogs()
  if (isMeta) {
    globalStore.updateMultipleBoxesSelectedIds([props.box.id])
    boxStore.selectItemsInSelectedBoxes()
    globalStore.updateMultipleBoxesSelectedIds([])
    globalStore.currentUserIsDraggingBox = false
    globalStore.shouldCancelNextMouseUpInteraction = true
  } else {
    globalStore.clearMultipleSelected()
  }
  if (globalStore.preventDraggedBoxFromShowingDetails) { return }
  if (isMeta) { return }
  globalStore.updateBoxDetailsIsVisibleForBoxId(props.box.id)
  event.stopPropagation() // prevent stopInteractions() from closing boxDetails
  globalStore.currentUserIsDraggingBox = false
  globalStore.boxesWereDragged = false
}
const currentBoxDetailsIsVisible = computed(() => {
  return props.box.id === globalStore.boxDetailsIsVisibleForBoxId
})

// Remote

const isRemoteSelected = computed(() => {
  const remoteBoxesSelected = globalStore.remoteBoxesSelected
  const selectedBox = remoteBoxesSelected.find(box => box.boxId === props.box.id)
  return Boolean(selectedBox)
})
const isRemoteBoxDetailsVisible = computed(() => {
  const remoteBoxDetailsVisible = globalStore.remoteBoxDetailsVisible
  const visibleBox = remoteBoxDetailsVisible.find(box => box.boxId === props.box.id)
  return Boolean(visibleBox)
})
const remoteBoxDetailsVisibleColor = computed(() => {
  const remoteBoxDetailsVisible = globalStore.remoteBoxDetailsVisible
  const visibleBox = remoteBoxDetailsVisible.find(box => box.boxId === props.box.id)
  if (visibleBox) {
    const user = spaceStore.getSpaceUserById(visibleBox.userId)
    return user.color
  } else {
    return undefined
  }
})
// const isRemoteBoxDragging = computed(() => {
//   const remoteBoxesDragging = globalStore.remoteBoxesDragging
//   const isDragging = remoteBoxesDragging.find(box => box.boxId === props.box.id)
//   return Boolean(isDragging)
// })
const remoteSelectedColor = computed(() => {
  const remoteBoxesSelected = globalStore.remoteBoxesSelected
  const selectedBox = remoteBoxesSelected.find(box => box.boxId === props.box.id)
  if (selectedBox) {
    const user = spaceStore.getSpaceUserById(selectedBox.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteUserResizingBoxesColor = computed(() => {
  const remoteUserResizingBoxes = globalStore.remoteUserResizingBoxes
  if (!remoteUserResizingBoxes.length) { return }
  let user = remoteUserResizingBoxes.find(user => user.boxIds.includes(props.box.id))
  if (user) {
    user = spaceStore.getSpaceUserById(user.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteBoxDraggingColor = computed(() => {
  const remoteBoxesDragging = globalStore.remoteBoxesDragging
  const draggingBox = remoteBoxesDragging.find(box => box.boxId === props.box.id)
  if (draggingBox) {
    const user = spaceStore.getSpaceUserById(draggingBox.userId)
    return user.color
  } else {
    return undefined
  }
})

// touch locking

const lockingFrameStyle = computed(() => {
  const initialPadding = 65 // matches initialLockCircleRadius in paintSelect
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
    borderRadius
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
  console.info('startLocking', event)
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
    console.info('🔒🐢 box lockingAnimationFrame locked')
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
  const hasNotified = globalStore.hasNotifiedPressAndHoldToDrag
  if (!hasNotified) {
    globalStore.addNotification({ message: 'Press and hold to drag', icon: 'press-and-hold' })
  }
  globalStore.hasNotifiedPressAndHoldToDrag = true
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
  if (currentBoxIsBeingDragged.value || isResizing.value) {
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

// connections

const isConnectingTo = computed(() => {
  const connectingToId = globalStore.currentConnectionSuccess.id
  const isConnecting = connectingToId === props.box.id
  if (isConnecting) {
    postMessage.sendHaptics({ name: 'softImpact' })
  }
  return isConnecting
})
const isConnectingFrom = computed(() => {
  return globalStore.currentConnectionStartItemIds.includes(props.box.id)
})
const connectedConnectionTypes = computed(() => connectionStore.getItemConnectionTypes(props.box.id))
const connectorIsVisible = computed(() => {
  const isMember = userStore.getUserIsSpaceMember
  let isVisible
  if (isLocked.value) { return }
  if (state.isRemoteConnecting) {
    isVisible = true
  } else if (isMember || canEditBox.value || connectedConnectionTypes.value.length) {
    isVisible = true
  }
  return isVisible
})
const connectorIsHiddenByOpacity = computed(() => {
  if (utils.isMobile()) { return }
  const isPresentationMode = globalStore.isPresentationMode
  const isNotHovering = !state.isHover
  const isNotConnected = !isConnectingFrom.value && !isConnectingTo.value && !connectionStore.getAllConnections.length
  return isPresentationMode && isNotHovering && isNotConnected
})

const updateRemoteConnections = () => {
  const connection = globalStore.remoteCurrentConnections.find(remoteConnection => {
    const isConnectedToStart = remoteConnection.startItemId === props.box.id
    const isConnectedToEnd = remoteConnection.endItemId === props.box.id
    return isConnectedToStart || isConnectedToEnd
  })
  if (connection) {
    state.isRemoteConnecting = true
    state.remoteConnectionColor = connection.color
  } else {
    state.isRemoteConnecting = false
  }
}

// checkbox

const isChecked = computed(() => utils.nameIsChecked(name.value))
const hasCheckbox = computed(() => {
  return Boolean(utils.checkboxFromString(name.value))
})
const containingBoxes = computed(() => {
  if (!state.isVisibleInViewport) { return }
  if (globalStore.currentUserIsDraggingBox) { return }
  if (currentBoxIsBeingDragged.value) { return }
  if (currentBoxIsSelected.value) { return }
  if (isResizing.value) { return }
  if (globalStore.boxDetailsIsVisibleForBoxId) { return }
  let boxes = boxStore.getAllBoxes
  boxes = utils.clone(boxes)
  boxes = boxes.filter(box => {
    const currentBox = utils.clone(props.box)
    const isInsideBox = utils.isRectACompletelyInsideRectB(currentBox, box)
    const boxArea = box.resizeWidth * box.resizeHeight
    const currentBoxArea = currentBox.resizeWidth * currentBox.resizeHeight
    const boxIsParent = boxArea > currentBoxArea
    return isInsideBox && boxIsParent
  })
  return boxes
})
const isInCheckedBox = computed(() => {
  if (!containingBoxes.value) { return }
  const checkedBox = containingBoxes.value.find(box => utils.nameIsChecked(box.name))
  return Boolean(checkedBox)
})

// box focus

const isFocusing = computed(() => props.box.id === globalStore.focusOnBoxId)
const clearFocus = () => {
  globalStore.focusOnBoxId = ''
}
</script>

<template lang="pug">
.box(
  :key="box.id"
  :data-box-id="box.id"
  :data-x="normalizedBox.x"
  :data-y="normalizedBox.y"
  :data-resize-width="normalizedBox.resizeWidth"
  :data-resize-height="normalizedBox.resizeHeight"
  :data-info-width="normalizedBox.infoWidth"
  :data-info-height="normalizedBox.infoHeight"
  :data-background="normalizedBox.background"
  :data-is-locked="isLocked"
  :data-is-visible-in-viewport="state.isVisibleInViewport"
  :data-should-render="shouldRender"

  :style="boxStyles"
  :class="classes"
  ref="boxElement"
)
  .focusing-frame(v-if="isFocusing" :style="{backgroundColor: fillColor}" @animationend="clearFocus")
  teleport(to="#box-backgrounds")
    .box-background(v-if="box.background && state.isVisibleInViewport" :data-box-id="box.id" :style="backgroundStyles")
  teleport(to="#box-infos")
    //- name
    .box-info(
      v-if="shouldRender"
      :data-box-id="box.id"
      :data-is-visible-in-viewport="state.isVisibleInViewport"
      :style="infoStyles"
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
      //- [·]
      ItemCheckboxButton(:visible="hasCheckbox" :box="box" :canEditItem="canEditBox" @toggleItemChecked="cancelLocking")
      //- name
      .name-wrap(:class="{'is-checked': isChecked}")
        //- simplified nameSegments
        template(v-for="segment in nameSegments")
          template(v-if="segment.type === 'text'")
            span {{smartQuotes(segment.content)}}
          template(v-else-if="segment.type === 'bold'")
            strong {{smartQuotes(segment.content)}}
          template(v-else-if="segment.type === 'h1'")
            h1 {{smartQuotes(segment.content)}}
          template(v-else-if="segment.type === 'h2'")
            h2 {{smartQuotes(segment.content)}}
          template(v-else-if="segment.type === 'h3'")
            h3 {{smartQuotes(segment.content)}}
          template(v-else-if="segment.type === 'h4'")
            h4 {{segment.content}}
          template(v-else-if="segment.type === 'emphasis'")
            em {{smartQuotes(segment.content)}}
          template(v-else-if="segment.type === 'strikethrough'")
            del {{smartQuotes(segment.content)}}
        .selected-user-avatar(v-if="isRemoteSelected || isRemoteBoxDetailsVisible" :style="{backgroundColor: remoteSelectedColor || remoteBoxDetailsVisibleColor}")
          img(src="@/assets/anon-avatar.svg")

      ItemConnectorButton(
        :visible="connectorIsVisible"
        :isHiddenByOpacity="connectorIsHiddenByOpacity"
        :box="box"
        :isConnectingTo="isConnectingTo"
        :isConnectingFrom="isConnectingFrom"
        :isVisibleInViewport="state.isVisibleInViewport"
        :isRemoteConnecting="state.isRemoteConnecting"
        :remoteConnectionColor="state.remoteConnectionColor"
        :currentBackgroundColor="color"
        :backgroundIsTransparent="true"
        :parentDetailsIsVisible="currentBoxDetailsIsVisible"
        @shouldRenderParent="updateShouldRenderParent"
      )

  //- resize
  .bottom-button-wrap(v-if="resizeIsVisible" :class="{unselectable: isPainting}")
    .inline-button-wrap(
        @pointerover="updateIsHover(true)"
        @pointerleave="updateIsHover(false)"
        @mousedown.left="startResizing"
        @touchstart="startResizing"
        @dblclick="shrink"
      )
      button.inline-button(
        tabindex="-1"
      )
        img.resize-icon.icon(src="@/assets/resize-corner.svg" :class="resizeColorClass")
</template>

<style lang="stylus">
.box
  --min-box-size 70px
  --ease-out-circ cubic-bezier(0, 0.55, 0.45, 1) // https://easings.net/#easeOutCirc
  position absolute
  border-radius var(--entity-radius)
  min-height var(--min-box-size)
  min-width var(--min-box-size)
  // pointer-events none
  // animate box expand and shrink
  &.transition
    transition width 0.2s var(--ease-out-circ),
      height 0.2s var(--ease-out-circ),
      left 0.2s var(--ease-out-circ),
      top 0.2s var(--ease-out-circ)
  &.hover
    box-shadow var(--hover-shadow)
  &.active
    box-shadow var(--active-shadow)
    transition none
    z-index 1
  &.is-resizing
    box-shadow var(--active-shadow)
    transition none
  &.is-selected
    transition none
  &.is-checked
    opacity var(--is-checked-opacity)

  // resize
  .bottom-button-wrap
    .inline-button-wrap
      cursor nwse-resize
      button
        cursor nwse-resize
      .resize-icon
        top 0
        left 0

.box-info
  --header-font var(--header-font-0)
  z-index 1
  border-radius 4px
  display flex
  align-items center
  width max-content
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
  border-bottom-right-radius var(--entity-radius)
  word-break break-word
  color var(--primary-on-light-background)
  &:hover
    box-shadow var(--hover-shadow)
  &:active
    box-shadow var(--active-shadow)
  &.is-dark
    color var(--primary-on-dark-background)

  .name-wrap
    padding 6px 8px
    padding-top 4px
    // padding-right 4px
    display inline-block
    &.is-checked
      text-decoration line-through
  h1
    font-family var(--header-font)
    font-size 20px
    font-weight bold
    display inline-block
  h2
    font-family var(--header-font)
    font-weight normal
    font-size 20px
    display inline-block
  h1,
  h2,
  h3,
  h4
    margin 0
    margin-top 2px
    vertical-align sub // to align with checkboxes

  .connector
    padding 8px
    padding-top 4px
    padding-bottom 3px
    padding-left 0
    align-self right
    cursor cell
    right 0
    pointer-events all
    position relative
    display inline-block
    button
      z-index 1
  .connector-glow
    left -9px
    top -5px
  .connected-colors
    left 1px
    top 5px

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

</style>
