<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useUploadStore } from '@/stores/useUploadStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const uploadStore = useUploadStore()

let unsubscribes
let animationTimer, isMultiTouch, startCursor, currentCursor
let observer

const connectionElement = ref(null)
const connectionPathElement = ref(null)

onMounted(() => {
  initViewportObserver()

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'clearMultipleSelected') {
        const selectedIds = globalStore.multipleConnectionsSelectedIds
        const selected = selectedIds.includes(props.connection.id) || globalStore.connectionDetailsIsVisibleForConnectionId === props.connection.id
        if (!selected) {
          cancelAnimation()
        }
      } else if (name === 'triggerConnectionDetailsIsVisible') {
        const { id, event } = args[0]
        if (id !== props.connection.id) { return }
        const isFromStore = true
        showConnectionDetails(event, isFromStore)
      } else if (name === 'closeAllDialogs') {
        updatePathWhileDragging(null)
      }
    }
  )
  const cardActionUnsubscribe = cardStore.$onAction(
    ({ name, args }) => {
      if (name === 'moveCards') {
        cancelAnimation()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
    cardActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  removeViewportObserver()
  unsubscribes()
})

const props = defineProps({
  connection: Object,
  isRemote: Boolean
})

const state = reactive({
  pathWhileSelected: '',
  pathWhileDragging: '',
  frameCount: 0,
  isVisibleInViewport: true
})
watch(() => props.connection.path, (value, prevValue) => {
  state.pathWhileSelected = value
})

const visible = computed(() => {
  if (props.isRemote) { return true }
  if (!state.isVisibleInViewport) { return }
  return items.value.startItem && items.value.endItem
})
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const canEditSpace = computed(() => userStore.getUserCanEditSpace)

// styles and position

const updatePathWhileDragging = (value) => {
  state.pathWhileDragging = value
}
const normalizedConnectionPathRect = computed(() => {
  const path = state.pathWhileDragging || props.connection.path
  if (!path) { return {} }
  const rect = utils.rectFromConnectionPath(path)
  return rect
})
const connectionStyles = computed(() => {
  const rect = normalizedConnectionPathRect.value
  const styles = {
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px'
  }
  if (globalStore.currentUserIsDraggingCard) {
    styles.pointerEvents = 'none'
  }
  return styles
})
const connectionPathStyles = computed(() => {
  const rect = normalizedConnectionPathRect.value
  const styles = {
    transform: `translate(${-rect.x}px,${-rect.y}px)`
  }
  return styles
})
const connectionPathClasses = computed(() => {
  if (!state.isVisibleInViewport) { return }
  const styles = {
    active: isActive.value,
    filtered: isFiltered.value,
    hover: isHovered.value,
    'hide-connection-outline': globalStore.shouldHideConnectionOutline,
    'is-hidden-by-opacity': isHiddenByCommentFilter.value,
    'is-connected-to-comment': isConnectedToCommentCard.value,
    'is-connected-to-checked-item': isConnectedToCheckedItem.value
  }
  return styles
})

// connection type

const connectionType = computed(() => connectionStore.getConnectionType(props.connection.connectionTypeId))
const typeColor = computed(() => {
  if (!connectionType.value) { return }
  return connectionType.value.color
})
const typeName = computed(() => {
  if (!connectionType.value) { return }
  return connectionType.value.name
})

// items

const items = computed(() => {
  const cards = cardStore.getAllCards
  const boxes = boxStore.getAllBoxes
  const items = cards.concat(boxes)
  const startItem = items.find(item => item.id === props.connection.startItemId)
  const endItem = items.find(item => item.id === props.connection.endItemId)
  return { startItem, endItem }
})
const isConnectedToCommentCard = computed(() => {
  const { startItem, endItem } = items.value
  if (!startItem || !endItem) { return }
  return startItem.isComment || endItem.isComment
})
const isConnectedToMultipleCardsSelected = computed(() => {
  const cardIds = globalStore.multipleCardsSelectedIds
  if (!cardIds.length) { return }
  return cardIds.find(cardId => {
    return (cardId === props.connection.startItemId || cardId === props.connection.endItemId)
  })
})
const isHoveredOverConnectedItem = computed(() => {
  const itemId = globalStore.currentUserIsHoveringOverCardId || globalStore.currentUserIsHoveringOverBoxId
  if (!itemId) { return }
  return (itemId === props.connection.startItemId || itemId === props.connection.endItemId)
})
const isCurrentItemConnection = computed(() => {
  return globalStore.currentItemConnections.includes(props.connection.id)
})
const isConnectedToCheckedItem = computed(() => {
  const { startItem, endItem } = items.value
  if (!startItem || !endItem) { return }
  const isStartItemChecked = utils.nameIsChecked(startItem.name)
  const isEndItemChecked = utils.nameIsChecked(endItem.name)
  return isStartItemChecked || isEndItemChecked
})

// upload

const addCardsAndUploadFiles = (event) => {
  let files = event.dataTransfer.files
  files = Array.from(files)
  const position = utils.cursorPositionInViewport(event)
  uploadStore.addCardsAndUploadFiles({ files, position })
}

// selected

const isSelected = computed(() => {
  const selectedIds = globalStore.multipleConnectionsSelectedIds
  return selectedIds.includes(props.connection.id)
})
const isRemoteSelected = computed(() => {
  const isSelected = globalStore.remoteConnectionsSelected.find(connection => connection.connectionId === props.connection.id)
  return isSelected
})

// connection details

const detailsIsVisible = computed(() => {
  if (!canEditSpace.value) { return }
  const detailsId = globalStore.connectionDetailsIsVisibleForConnectionId
  return detailsId === props.connection.id
})
const remoteDetailsIsVisible = computed(() => {
  const isSelected = globalStore.remoteConnectionDetailsVisible.find(connection => connection.connectionId === props.connection.id)
  return isSelected
})
const showConnectionDetails = (event, isFromStore) => {
  if (isMultiTouch) { return }
  if (!canEditSpace.value) { globalStore.triggerReadOnlyJiggle() }
  if (!isFromStore) {
    currentCursor = utils.cursorPositionInViewport(event)
    if (!utils.cursorsAreClose(startCursor, currentCursor)) { return }
  }
  if (!props.connection.path) {
    console.error('🚒 missing connection path', props.connection.id, props.connection.path)
    return
  }
  globalStore.closeAllDialogs()
  if (event.shiftKey) {
    globalStore.toggleMultipleConnectionsSelected(props.connection.id)
    globalStore.previousMultipleConnectionsSelectedIds = globalStore.multipleConnectionsSelectedIds
    return
  }
  const dialogPosition = utils.cursorPositionInSpace(event)
  globalStore.updateConnectionDetailsIsVisibleForConnectionId(props.connection.id)
  globalStore.connectionDetailsPosition = dialogPosition
  globalStore.clearMultipleSelected()
}
const showConnectionDetailsOnKeyup = (event) => {
  showConnectionDetails(event)
  focusOnDialog(event)
}

// label

const isDraggingCurrentConnectionLabel = computed(() => {
  const connectionId = globalStore.currentUserIsDraggingConnectionIdLabel
  if (!connectionId) { return }
  const connection = connectionStore.getConnection(connectionId)
  if (!connection) { return }
  return connection.id === props.connection.id
})

// space filters

const isHiddenByCommentFilter = computed(() => {
  const filterCommentsIsActive = userStore.filterComments
  if (!filterCommentsIsActive) { return }
  const startItem = items.value.startItem
  const endItem = items.value.endItem
  if (!startItem || !endItem) { return }
  const startItemIsComment = startItem.isComment || utils.isNameComment(startItem.name)
  const endItemIsComment = startItem.isComment || utils.isNameComment(endItem.name)
  return startItemIsComment || endItemIsComment || isConnectedToCommentCard.value
})
const filtersIsActive = computed(() => {
  const types = globalStore.filteredConnectionTypeIds
  const frames = globalStore.filteredFrameIds
  const tags = globalStore.filteredTagNames
  return Boolean(types.length + frames.length + tags.length)
})
const isCardsFilteredByFrame = computed(() => {
  const frameIds = globalStore.filteredFrameIds
  const startItem = items.value.startItem
  const endItem = items.value.endItem
  const startItemInFilter = frameIds.includes(startItem.frameId)
  const endItemInFilter = frameIds.includes(endItem.frameId)
  return startItemInFilter || endItemInFilter
})
const isConnectionFilteredByType = computed(() => {
  const typeIds = globalStore.filteredConnectionTypeIds
  if (!connectionType.value) { return }
  return typeIds.includes(connectionType.value.id)
})
const isFiltered = computed(() => {
  if (filtersIsActive.value) {
    const isInFilter = isCardsFilteredByFrame.value || isConnectionFilteredByType.value
    if (isInFilter) {
      return false
    } else {
      return true
    }
  } else { return false }
})

// direction

const gradientId = computed(() => `gradient-${props.connection.id}`)
const gradientIdReference = computed(() => `url('#${gradientId.value}')`)
const directionIsVisible = computed(() => {
  if (!visible.value) { return }
  return props.connection.directionIsVisible
})

// path

const remoteCardsIsDragging = computed(() => Boolean(globalStore.remoteCardsDragging.length))
const remoteBoxesIsDragging = computed(() => Boolean(globalStore.remoteBoxesDragging.length))
const remoteItemsIsDragging = computed(() => remoteCardsIsDragging.value || remoteBoxesIsDragging.value)
const remoteItemsDragging = computed(() => {
  const cards = utils.clone(globalStore.remoteCardsSelected)
  const boxes = utils.clone(globalStore.remoteBoxesSelected)
  return cards.concat(boxes)
})
const remoteItemsSelected = computed(() => {
  const cards = utils.clone(globalStore.remoteCardsSelected)
  const boxes = utils.clone(globalStore.remoteBoxesSelected)
  return cards.concat(boxes)
})
const multipleItemsSelectedIds = computed(() => {
  const cards = utils.clone(globalStore.multipleCardsSelectedIds)
  const boxes = utils.clone(globalStore.multipleBoxesSelectedIds)
  return cards.concat(boxes)
})
const updatedPath = (path, controlPoint, x, y) => {
  return path.replace(controlPoint, `q${x},${y}`)
}
const newPointPosition = (base, cycleProgress, isForwardCycle) => {
  if (isForwardCycle) {
    return Math.round(base + Math.exp(cycleProgress / 6))
  } else {
    return Math.round(base - Math.exp(cycleProgress / 6))
  }
}
// move control point to simulate jiggling effect
const controlPointPosition = ({ x, y }) => {
  const framesPerDirection = 24
  const completedCycles = Math.floor(state.frameCount / framesPerDirection)
  const cycleProgress = (state.frameCount - completedCycles * framesPerDirection) / framesPerDirection
  const isForwardCycle = utils.isEvenNumber(completedCycles)
  x = newPointPosition(x, cycleProgress, isForwardCycle)
  y = newPointPosition(y, cycleProgress, isForwardCycle)
  return { x, y }
}
const updateElementPath = (path) => {
  const element = connectionPathElement.value
  if (!element) { return }
  element.setAttribute('d', path)
}
// line jiggling animation
const animationFrame = () => {
  if (state.frameCount === 0) {
    state.pathWhileSelected = props.connection.path
  }
  state.frameCount++
  const curvePattern = new RegExp(/(q[-0-9]*),([-0-9]*)\w+/)
  // "q90,40" from "m747,148 q90,40 -85,75"
  // "q-90,-40" from "m747,148 q-90,-40 -85,75" (negative)
  // "q-200,-0" from "m217,409 q200,1 492,-78" (variable length)
  const curveMatch = state.pathWhileSelected?.match(curvePattern)
  if (!curveMatch) { return }
  const points = curveMatch[0].substring(1, curveMatch[0].length).split(',')
  // ["90", "40"] from "q90,40"
  // ["90", "-40"] from "q-90,-40" (negative)
  // ["200", "1"] from "q200,1" (variable length)
  const { x, y } = controlPointPosition({
    x: parseInt(points[0]),
    y: parseInt(points[1])
  })
  const controlPoint = curveMatch[0]
  state.pathWhileSelected = updatedPath(state.pathWhileSelected, controlPoint, x, y)
  updateElementPath(state.pathWhileSelected)
  if (shouldAnimate.value) {
    window.requestAnimationFrame(animationFrame)
  }
}
const cancelAnimation = () => {
  window.cancelAnimationFrame(animationTimer)
  animationTimer = undefined
  state.pathWhileSelected = undefined
  state.frameCount = 0
}
const shouldAnimate = computed(() => {
  if (globalStore.currentUserIsDraggingCard || globalStore.currentUserIsDraggingBox) { return }
  return Boolean(isSelected.value || detailsIsVisible.value || remoteDetailsIsVisible.value || isRemoteSelected.value)
})
watch(() => shouldAnimate.value, (value, prevValue) => {
  if (value) {
    animationTimer = window.requestAnimationFrame(animationFrame)
  }
})
const relativePath = computed(() => {
  if (!directionIsVisible.value) { return }
  const path = state.pathWhileDragging || state.pathWhileSelected || props.connection.path // jiggling
  const pathStart = utils.startCoordsFromConnectionPath(path)
  const pathEndRelative = utils.endCoordsFromConnectionPath(path)
  const controlPoint = utils.curveControlPointFromPath(path)
  const origin = { x: 0, y: 0 }
  if (pathEndRelative.x < 0) {
    origin.x = Math.abs(pathEndRelative.x)
  }
  if (pathEndRelative.y < 0) {
    origin.y = Math.abs(pathEndRelative.y)
  }
  const relativePath = `m${origin.x},${origin.y} q${controlPoint.x},${controlPoint.y} ${pathEndRelative.x},${pathEndRelative.y}`
  return relativePath
})

// utils

const removeConnection = () => {
  if (!isSpaceMember.value) { return }
  connectionStore.removeConnection(props.connection.id)
  connectionStore.removeAllUnusedConnectionTypes()
}
const focusOnDialog = async (event) => {
  await nextTick()
  document.querySelector('dialog.connection-details button').focus()
}

// dragging WIP

const startDraggingConnection = (event) => {
  checkIsMultiTouch(event)
  globalStore.shouldHideConnectionOutline = true
  startCursor = utils.cursorPositionInViewport(event)
}

// interaction handlers

const isActive = computed(() => {
  return isSelected.value ||
    detailsIsVisible.value ||
    remoteDetailsIsVisible.value ||
    isRemoteSelected.value ||
    isCurrentItemConnection.value ||
    isConnectedToMultipleCardsSelected.value ||
    isDraggingCurrentConnectionLabel.value
})
watch(() => isActive.value, (value, prevValue) => {
  if (value) { return }
  // delay until animationFrame complete
  setTimeout(() => {
    updateElementPath(props.connection.path)
  }, 10)
})
const isHovered = computed(() => {
  if (globalStore.currentUserIsDraggingCard || globalStore.currentUserIsDraggingBox || globalStore.currentUserIsDraggingList) { return }
  return props.connection.id === globalStore.currentUserIsHoveringOverConnectionId ||
    props.connection.id === globalStore.currentUserIsDraggingConnectionIdLabel ||
    isHoveredOverConnectedItem.value
})
const handleMouseEnter = () => {
  globalStore.currentUserIsHoveringOverConnectionId = props.connection.id
}
const handleMouseLeave = () => {
  globalStore.currentUserIsHoveringOverConnectionId = ''
}
const checkIsMultiTouch = (event) => {
  isMultiTouch = false
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
  }
}

// is visible in viewport

const initViewportObserver = async () => {
  if (globalStore.disableViewportOptimizations) { return }
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
    const target = connectionElement.value
    if (!target) { return }
    observer = new IntersectionObserver(callback, { rootMargin: '50%' })
    observer.observe(target)
  } catch (error) {
    console.error('🚒 connection initViewportObserver', error)
  }
}
const removeViewportObserver = () => {
  const target = connectionElement.value
  if (!observer) { return }
  observer.unobserve(target)
}
</script>

<template lang="pug">
svg.connection(
  :style="connectionStyles"
  :data-id="connection.id"
  :data-is-visible-in-viewport="state.isVisibleInViewport"
  :data-direction-is-visible="directionIsVisible"
  :data-is-hidden-by-comment-filter="isHiddenByCommentFilter"
  :data-rect-x="normalizedConnectionPathRect.x"
  :data-rect-y="normalizedConnectionPathRect.y"
  :data-rect-width="normalizedConnectionPathRect.width"
  :data-rect-height="normalizedConnectionPathRect.height"
  ref="connectionElement"
)
  path.connection-path(
    v-if="visible"
    fill="none"
    :stroke="typeColor"
    stroke-linecap="round"
    stroke-width="5"
    ref="connectionPathElement"
    tabindex="0"
    :key="connection.id"
    :d="connection.path"

    :class="connectionPathClasses"
    :style="connectionPathStyles"

    :data-start-card="connection.startItemId"
    :data-end-card="connection.endItemId"
    :data-id="connection.id"
    :data-type-name="typeName"
    :data-type-id="connection.connectionTypeId"
    :data-is-hidden-by-comment-filter="isHiddenByCommentFilter"
    :data-label-is-visible="connection.labelIsVisible"
    :data-is-visible-in-viewport="state.isVisibleInViewport"
    :data-d="connection.path"

    @mousedown.left="startDraggingConnection"
    @touchstart="startDraggingConnection"
    @mouseup.left="showConnectionDetails"
    @touchend.stop="showConnectionDetails"
    @keyup.stop.backspace="removeConnection"
    @keyup.stop.enter="showConnectionDetailsOnKeyup"
    @dragover.prevent
    @drop.prevent.stop="addCardsAndUploadFiles"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  )
    title {{typeName}}

  defs(v-if="state.isVisibleInViewport")
    linearGradient(:id="gradientId")
      stop(offset="0%" :stop-color="typeColor" stop-opacity="0" fill-opacity="0")
      stop(offset="90%" :stop-color="typeColor")

  circle(
    v-if="directionIsVisible"
    r="7"
    :fill="gradientIdReference"
    :class="{filtered: isFiltered}"
    :data-id="connection.id"
    :data-relative-path="relativePath"
  )
    animateMotion(dur="3s" repeatCount="indefinite" :path="relativePath" rotate="auto")
</template>

<style lang="stylus">
svg.connection
  position absolute
  overflow visible
  min-width 5px
  min-height 5px
  path.connection-path
    pointer-events all
    cursor pointer
    touch-action manipulation
    &:hover,
    &.hover,
    &.active,
    &:focus
      stroke-width 7
    &.hide-connection-outline
      outline none
    &.is-connected-to-comment,
    &.is-connected-to-checked-item
      opacity 0.5
</style>
