<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

let animationTimer, isMultiTouch, startCursor, currentCursor

let observer

const connectionElement = ref(null)
const connectionPathElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
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
    }
  })
  initViewportObserver()
})

onBeforeUnmount(() => {
  removeViewportObserver()
})

const props = defineProps({
  connection: Object,
  isRemote: Boolean
})

const state = reactive({
  curvedPath: '',
  frameCount: 0,
  isVisibleInViewport: true
})
watch(() => props.connection.path, (value, prevValue) => {
  state.curvedPath = value
})

const visible = computed(() => {
  if (props.isRemote) { return true }
  return cards.value.startCard && cards.value.endCard
})
const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())

// styles

const normalizedConnectionPathRect = () => {
  const pathStart = utils.startCoordsFromConnectionPath(props.connection.path)
  const pathEndRelative = utils.endCoordsFromConnectionPath(props.connection.path)
  let rect = {
    x: pathStart.x,
    y: pathStart.y,
    width: pathStart.x + pathEndRelative.x,
    height: pathStart.y + pathEndRelative.y
  }
  if (pathEndRelative.x < 0) {
    rect.x = pathStart.x + pathEndRelative.x
    rect.width = rect.x + Math.abs(pathEndRelative.x)
  }
  if (pathEndRelative.y < 0) {
    rect.y = pathStart.y + pathEndRelative.y
    rect.height = rect.y + Math.abs(pathEndRelative.y)
  }
  return rect
}
const connectionStyles = computed(() => {
  const rect = normalizedConnectionPathRect()
  let styles = {
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
  const rect = normalizedConnectionPathRect()
  const styles = {
    transform: `translate(${-rect.x}px,${-rect.y}px)`
  }
  return styles
})

const connectionPathClasses = computed(() => {
  let styles = {
    active: isActive.value,
    filtered: isFiltered.value,
    hover: isHovered.value,
    'hide-connection-outline': store.state.shouldHideConnectionOutline,
    'is-hidden-by-opacity': isHiddenByCommentFilter.value,
    'is-connected-to-comment': isConnectedToCommentCard.value
  }
  if (!state.isVisibleInViewport) { return }
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

// cards

const remoteCardsIsDragging = computed(() => Boolean(store.state.remoteCardsDragging.length))
const cards = computed(() => {
  const cards = store.getters['currentCards/all']
  const startCard = cards.find(card => card.id === props.connection.startCardId)
  const endCard = cards.find(card => card.id === props.connection.endCardId)
  return { startCard, endCard }
})
const isConnectedToCommentCard = computed(() => {
  const { startCard, endCard } = cards.value
  if (!startCard || !endCard) { return }
  return startCard.isComment || endCard.isComment
})
const isConnectedToMultipleCardsSelected = computed(() => {
  const cardIds = store.state.multipleCardsSelectedIds
  if (!cardIds.length) { return }
  return cardIds.find(cardId => {
    return (cardId === props.connection.startCardId || cardId === props.connection.endCardId)
  })
})
const isHoveredOverConnectedCard = computed(() => {
  const cardId = store.state.currentUserIsHoveringOverCardId
  if (!cardId) { return }
  return (cardId === props.connection.startCardId || cardId === props.connection.endCardId)
})
const isCurrentCardConnection = computed(() => {
  return store.state.currentCardConnections.includes(props.connection.id)
})
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
  const startCard = cards.value.startCard
  const endCard = cards.value.endCard
  const startCardIsComment = startCard.isComment || utils.isNameComment(startCard.name)
  const endCardIsComment = startCard.isComment || utils.isNameComment(endCard.name)
  return startCardIsComment || endCardIsComment
})
const filtersIsActive = computed(() => {
  const types = store.state.filteredConnectionTypeIds
  const frames = store.state.filteredFrameIds
  const tags = store.state.filteredTagNames
  return Boolean(types.length + frames.length + tags.length)
})
const isCardsFilteredByFrame = computed(() => {
  const frameIds = store.state.filteredFrameIds
  const startCard = cards.value.startCard
  const endCard = cards.value.endCard
  const startCardInFilter = frameIds.includes(startCard.frameId)
  const endCardInFilter = frameIds.includes(endCard.frameId)
  return startCardInFilter || endCardInFilter
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
  return props.connection.directionIsVisible
})
const checkIfShouldPauseConnectionDirections = async () => {
  store.dispatch('currentSpace/unpauseConnectionDirections')
  await nextTick()
  store.dispatch('currentSpace/checkIfShouldPauseConnectionDirections')
}

// path

const isUpdatingPath = computed(() => {
  let shouldHide
  const currentUserIsDragging = store.state.currentUserIsDraggingCard
  let cards = []
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  const currentCardId = store.state.currentDraggingCardId
  const remoteCardsDragging = utils.clone(store.state.remoteCardsDragging)
  const remoteCardsSelected = utils.clone(store.state.remoteCardsSelected)
  // local multiple
  if (multipleCardsSelectedIds.length && currentUserIsDragging) {
    cards = multipleCardsSelectedIds.map(id => store.getters['currentCards/byId'](id))
  // local single
  } else if (currentCardId && currentUserIsDragging) {
    const currentCard = store.getters['currentCards/byId'](currentCardId)
    cards = [currentCard]
  // remote multiple
  } else if (remoteCardsIsDragging.value && remoteCardsSelected.length) {
    cards = remoteCardsSelected.map(card => {
      card.id = card.cardId
      return card
    })
  // remote single
  } else if (remoteCardsIsDragging.value) {
    cards = remoteCardsDragging.map(card => {
      card.id = card.cardId
      return card
    })
  }
  cards = cards.filter(card => Boolean(card))
  cards.forEach(card => {
    if (card.id === props.connection.startCardId || card.id === props.connection.endCardId) {
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
    state.curvedPath = props.connection.path
  }
  state.frameCount++
  const curvePattern = new RegExp(/(q[-0-9]*),([-0-9]*)\w+/)
  // "q90,40" from "m747,148 q90,40 -85,75"
  // "q-90,-40" from "m747,148 q-90,-40 -85,75" (negative)
  // "q-200,-0" from "m217,409 q200,1 492,-78" (variable length)
  const curveMatch = state.curvedPath?.match(curvePattern)
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
  state.curvedPath = updatedPath(state.curvedPath, controlPoint, x, y)
  const element = connectionPathElement.value
  if (!element) { return }
  element.setAttribute('d', state.curvedPath)
  if (shouldAnimate.value) {
    window.requestAnimationFrame(animationFrame)
  }
}
const cancelAnimation = () => {
  window.cancelAnimationFrame(animationTimer)
  animationTimer = undefined
  state.curvedPath = undefined
  state.frameCount = 0
}
const shouldAnimate = computed(() => {
  if (store.state.currentUserIsDraggingCard) { return }
  return Boolean(isSelected.value || detailsIsVisible.value || remoteDetailsIsVisible.value || isRemoteSelected.value)
})
watch(() => shouldAnimate.value, (value, prevValue) => {
  if (value) {
    animationTimer = window.requestAnimationFrame(animationFrame)
  }
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
    isCurrentCardConnection.value ||
    isConnectedToMultipleCardsSelected.value ||
    isDraggingCurrentConnectionLabel.value
})
const isHovered = computed(() => {
  if (store.state.currentUserIsDraggingCard) { return }
  return props.connection.id === store.state.currentUserIsHoveringOverConnectionId ||
    props.connection.id === store.state.currentUserIsDraggingConnectionIdLabel ||
    isHoveredOverConnectedCard.value
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
svg.connection(:style="connectionStyles" :data-id="connection.id" :data-is-visible-in-viewport="state.isVisibleInViewport" ref="connectionElement")
  path.connection-path(
    v-if="visible"
    fill="none"
    :stroke="typeColor"
    stroke-width="5"
    :data-start-card="connection.startCardId"
    :data-end-card="connection.endCardId"
    :data-id="connection.id"
    :data-type-name="typeName"
    :data-type-id="connection.connectionTypeId"
    :data-is-hidden-by-comment-filter="isHiddenByCommentFilter"
    :data-label-is-visible="connection.labelIsVisible"
    :data-is-visible-in-viewport="state.isVisibleInViewport"
    :data-d="connection.path"
    :key="connection.id"
    :d="connection.path"
    @mousedown.left="startDraggingConnection"
    @touchstart="startDraggingConnection"
    @mouseup.left="showConnectionDetails"
    @touchend.stop="showConnectionDetails"
    @keyup.stop.backspace="removeConnection"
    @keyup.stop.enter="showConnectionDetailsOnKeyup"
    ref="connectionPathElement"
    tabindex="0"
    @dragover.prevent
    @drop.prevent.stop="addCardsAndUploadFiles"

    :class="connectionPathClasses"
    :style="connectionPathStyles"

    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  )

defs(v-if="state.isVisibleInViewport")
  linearGradient(:id="gradientId")
    stop(offset="0%" :stop-color="typeColor" stop-opacity="0" fill-opacity="0")
    stop(offset="90%" :stop-color="typeColor")

circle(v-if="directionIsVisible && !isUpdatingPath && state.isVisibleInViewport" r="7" :fill="gradientIdReference" :class="{filtered: isFiltered}" :data-id="connection.id")
  animateMotion(dur="3s" repeatCount="indefinite" :path="connection.path" rotate="auto")
</template>

<style lang="stylus">
svg.connection
  position absolute
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
    &.is-connected-to-comment
      opacity 0.5
</style>
