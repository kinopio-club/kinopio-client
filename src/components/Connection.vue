<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

let unsubscribe

let animationTimer, isMultiTouch, startCursor, currentCursor

let observer

const connectionElement = ref(null)
const connectionPathElement = ref(null)

onMounted(() => {
  unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === 'clearMultipleSelected') {
      const selectedIds = store.state.multipleConnectionsSelectedIds
      const selected = selectedIds.includes(props.connection.id) || store.state.connectionDetailsIsVisibleForConnectionId === props.connection.id
      if (!selected) {
        cancelAnimation()
      }
    } else if (mutation.type === 'currentCards/move') {
      cancelAnimation()
    } else if (mutation.type === 'triggerConnectionDetailsIsVisible') {
      if (mutation.payload.connectionId === props.connection.id) {
        const isFromStore = true
        showConnectionDetails(mutation.payload.event, isFromStore)
      }
    } else if (mutation.type === 'triggerUpdatePathWhileDragging') {
      const connections = mutation.payload
      if (!visible.value) { return }
      connections.forEach(connection => {
        if (connection.id !== props.connection.id) { return }
        updatePathWhileDragging(connection.path)
      })
    } else if (mutation.type === 'closeAllDialogs') {
      updatePathWhileDragging(null)
    }
  })
  initViewportObserver()
})
onBeforeUnmount(() => {
  removeViewportObserver()
  unsubscribe()
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
const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())

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
  if (store.state.currentUserIsDraggingCard) {
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
    'hide-connection-outline': store.state.shouldHideConnectionOutline,
    'is-hidden-by-opacity': isHiddenByCommentFilter.value,
    'is-connected-to-comment': isConnectedToCommentCard.value,
    'is-connected-to-checked-item': isConnectedToCheckedItem.value
  }
  return styles
})

// connection type

const connectionType = computed(() => store.getters['currentConnections/typeByTypeId'](props.connection.connectionTypeId))
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
  const cards = store.getters['currentCards/all']
  const boxes = store.getters['currentBoxes/all']
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
  const cardIds = store.state.multipleCardsSelectedIds
  if (!cardIds.length) { return }
  return cardIds.find(cardId => {
    return (cardId === props.connection.startItemId || cardId === props.connection.endItemId)
  })
})
const isHoveredOverConnectedItem = computed(() => {
  const itemId = store.state.currentUserIsHoveringOverCardId || store.state.currentUserIsHoveringOverBoxId
  if (!itemId) { return }
  return (itemId === props.connection.startItemId || itemId === props.connection.endItemId)
})
const isCurrentItemConnection = computed(() => {
  return store.state.currentItemConnections.includes(props.connection.id)
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
  store.dispatch('upload/addCardsAndUploadFiles', { files, position })
}

// selected

const isSelected = computed(() => {
  const selectedIds = store.state.multipleConnectionsSelectedIds
  return selectedIds.includes(props.connection.id)
})
const isRemoteSelected = computed(() => {
  const isSelected = store.state.remoteConnectionsSelected.find(connection => connection.connectionId === props.connection.id)
  return isSelected
})

// connection details

const detailsIsVisible = computed(() => {
  if (!canEditSpace.value) { return }
  const detailsId = store.state.connectionDetailsIsVisibleForConnectionId
  return detailsId === props.connection.id
})
const remoteDetailsIsVisible = computed(() => {
  const isSelected = store.state.remoteConnectionDetailsVisible.find(connection => connection.connectionId === props.connection.id)
  return isSelected
})
const showConnectionDetails = (event, isFromStore) => {
  if (isMultiTouch) { return }
  if (!canEditSpace.value) { store.commit('triggerReadOnlyJiggle') }
  if (!isFromStore) {
    currentCursor = utils.cursorPositionInViewport(event)
    if (!utils.cursorsAreClose(startCursor, currentCursor)) { return }
  }
  if (!props.connection.path) {
    console.error('🚒 missing connection path', props.connection.id, props.connection.path)
    return
  }
  store.dispatch('closeAllDialogs')
  if (event.shiftKey) {
    store.dispatch('toggleMultipleConnectionsSelected', props.connection.id)
    store.commit('previousMultipleConnectionsSelectedIds', utils.clone(store.state.multipleConnectionsSelectedIds))
    return
  }
  const dialogPosition = utils.cursorPositionInSpace(event)
  store.dispatch('connectionDetailsIsVisibleForConnectionId', props.connection.id)
  store.commit('connectionDetailsPosition', dialogPosition)
  store.dispatch('clearMultipleSelected')
}
const showConnectionDetailsOnKeyup = (event) => {
  showConnectionDetails(event)
  focusOnDialog(event)
}

// label

const isDraggingCurrentConnectionLabel = computed(() => {
  const connectionId = store.state.currentUserIsDraggingConnectionIdLabel
  if (!connectionId) { return }
  const connection = store.getters['currentConnections/byId'](connectionId)
  if (!connection) { return }
  return connection.id === props.connection.id
})

// space filters

const isHiddenByCommentFilter = computed(() => {
  const filterCommentsIsActive = store.state.currentUser.filterComments
  if (!filterCommentsIsActive) { return }
  const startItem = items.value.startItem
  const endItem = items.value.endItem
  if (!startItem || !endItem) { return }
  const startItemIsComment = startItem.isComment || utils.isNameComment(startItem.name)
  const endItemIsComment = startItem.isComment || utils.isNameComment(endItem.name)
  return startItemIsComment || endItemIsComment || isConnectedToCommentCard.value
})
const filtersIsActive = computed(() => {
  const types = store.state.filteredConnectionTypeIds
  const frames = store.state.filteredFrameIds
  const tags = store.state.filteredTagNames
  return Boolean(types.length + frames.length + tags.length)
})
const isCardsFilteredByFrame = computed(() => {
  const frameIds = store.state.filteredFrameIds
  const startItem = items.value.startItem
  const endItem = items.value.endItem
  const startItemInFilter = frameIds.includes(startItem.frameId)
  const endItemInFilter = frameIds.includes(endItem.frameId)
  return startItemInFilter || endItemInFilter
})
const isConnectionFilteredByType = computed(() => {
  const typeIds = store.state.filteredConnectionTypeIds
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
  checkIfShouldPauseConnectionDirections()
  if (!visible.value) { return }
  return props.connection.directionIsVisible
})
const checkIfShouldPauseConnectionDirections = async () => {
  store.dispatch('currentSpace/unpauseConnectionDirections')
  await nextTick()
  store.dispatch('currentSpace/checkIfShouldPauseConnectionDirections')
}

// path

const remoteCardsIsDragging = computed(() => Boolean(store.state.remoteCardsDragging.length))
const remoteBoxesIsDragging = computed(() => Boolean(store.state.remoteBoxesDragging.length))
const remoteItemsIsDragging = computed(() => remoteCardsIsDragging.value || remoteBoxesIsDragging.value)
const remoteItemsDragging = computed(() => {
  const cards = utils.clone(store.state.remoteCardsSelected)
  const boxes = utils.clone(store.state.remoteBoxesSelected)
  return cards.concat(boxes)
})
const remoteItemsSelected = computed(() => {
  const cards = utils.clone(store.state.remoteCardsSelected)
  const boxes = utils.clone(store.state.remoteBoxesSelected)
  return cards.concat(boxes)
})
const multipleItemsSelectedIds = computed(() => {
  const cards = utils.clone(store.state.multipleCardsSelectedIds)
  const boxes = utils.clone(store.state.multipleBoxesSelectedIds)
  return cards.concat(boxes)
})
const isUpdatingPath = computed(() => {
  let shouldHide
  const currentUserIsDragging = store.state.currentUserIsDraggingCard
  let items = []
  const currentItemId = store.state.currentDraggingCardId || store.state.currentDraggingBoxId
  // local multiple
  if (multipleItemsSelectedIds.value.length && currentUserIsDragging) {
    items = multipleItemsSelectedIds.value.map(id => store.getters['currentSpace/itemById'](id))
  // local single
  } else if (currentItemId && currentUserIsDragging) {
    const currentItem = store.getters['currentSpace/itemById'](currentItemId)
    items = [currentItem]
  // remote multiple
  } else if (remoteItemsIsDragging.value && remoteItemsSelected.value.length) {
    items = remoteItemsSelected.value.map(item => {
      item.id = item.cardId || item.boxId
      return item
    })
  // remote single
  } else if (remoteItemsIsDragging.value) {
    items = remoteItemsDragging.value.map(item => {
      item.id = item.cardId || item.boxId
      return item
    })
  }
  items = items.filter(item => Boolean(item))
  items.forEach(item => {
    if (item.id === props.connection.startItemId || item.id === props.connection.endItemId) {
      shouldHide = true
    }
  })
  checkIfShouldPauseConnectionDirections()
  return shouldHide
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
  const element = connectionPathElement.value
  if (!element) { return }
  element.setAttribute('d', state.pathWhileSelected)
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
  if (store.state.currentUserIsDraggingCard || store.state.currentUserIsDraggingBox) { return }
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
  store.dispatch('currentConnections/remove', props.connection)
  store.dispatch('currentConnections/removeUnusedTypes')
}
const focusOnDialog = async (event) => {
  await nextTick()
  document.querySelector('dialog.connection-details button').focus()
}

// dragging WIP

const startDraggingConnection = (event) => {
  checkIsMultiTouch(event)
  store.commit('shouldHideConnectionOutline', true)
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
const isHovered = computed(() => {
  if (store.state.currentUserIsDraggingCard || store.state.currentUserIsDraggingBox) { return }
  return props.connection.id === store.state.currentUserIsHoveringOverConnectionId ||
    props.connection.id === store.state.currentUserIsDraggingConnectionIdLabel ||
    isHoveredOverConnectedItem.value
})
const handleMouseEnter = () => {
  store.commit('currentUserIsHoveringOverConnectionId', props.connection.id)
}
const handleMouseLeave = () => {
  store.commit('currentUserIsHoveringOverConnectionId', '')
}
const checkIsMultiTouch = (event) => {
  isMultiTouch = false
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
  }
}

// is visible in viewport

const initViewportObserver = async () => {
  if (store.state.disableViewportOptimizations) { return }
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
  //- path d updated while dragging by currentConnections/updatePathsWhileDragging

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
