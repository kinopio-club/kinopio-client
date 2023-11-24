<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

const labelElement = ref(null)
let isMultiTouch
let startPosition = {}
let wasDragged = false

onMounted(() => {
  updatePosition()
  window.addEventListener('scroll', updateConnectionIsVisible)
  window.addEventListener('mouseup', stopDragging)
  window.addEventListener('mousemove', updateLabelOffset)
  store.subscribe((mutation, state) => {
    if (mutation.type === 'spaceZoomPercent') {
      updatePosition()
    }
  })
})
onUnmounted(() => {
  window.removeEventListener('scroll', updateConnectionIsVisible)
})

const props = defineProps({
  connection: Object
})
const state = reactive({
  position: {},
  hover: false,
  connectionIsVisible: true,
  isDragging: false,

  labelOffsetX: 0,
  labelOffsetY: 0
})
watch(() => state.hover, (value, prevValue) => {
  if (value) {
    store.commit('currentUserIsHoveringOverConnectionId', id.value)
  } else {
    store.commit('currentUserIsHoveringOverConnectionId', '')
  }
})

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isDark = computed(() => utils.colorIsDark(typeColor.value))
const checkIsMultiTouch = (event) => {
  isMultiTouch = false
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
  }
}
const visible = computed(() => {
  const hasPosition = state.position.x && state.position.y
  return props.connection.labelIsVisible && hasPosition
})

// filter

const filtersIsActive = computed(() => {
  const types = store.state.filteredConnectionTypeIds
  const frames = store.state.filteredFrameIds
  return Boolean(types.length + frames.length)
})
const isConnectionFilteredByType = computed(() => {
  const typeIds = store.state.filteredConnectionTypeIds
  return typeIds.includes(connectionTypeId.value)
})
const isCardsFilteredByFrame = computed(() => {
  const frameIds = store.state.filteredFrameIds
  const cards = utils.clone(store.getters['currentCards/all'])
  const startCardId = props.connection.startCardId
  const endCardId = props.connection.endCardId
  const startCard = cards.filter(card => card.id === startCardId)[0]
  const endCard = cards.filter(card => card.id === endCardId)[0]
  const startCardInFilter = frameIds.includes(startCard.frameId)
  const endCardInFilter = frameIds.includes(endCard.frameId)
  return startCardInFilter || endCardInFilter
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

// connection

const id = computed(() => props.connection.id)
const updateConnectionIsVisible = () => {
  const connection = document.querySelector(`.connection-path[data-id="${id.value}"]`)
  if (connection) {
    state.connectionIsVisible = true
  } else {
    state.connectionIsVisible = false
  }
}
const toggleConnectionDetails = (event) => {
  if (isMultiTouch) { return }
  const isVisible = store.state.connectionDetailsIsVisibleForConnectionId === id.value
  if (isVisible || wasDragged) {
    wasDragged = false
    store.commit('closeAllDialogs')
  } else {
    store.commit('triggerConnectionDetailsIsVisible', {
      connectionId: id.value,
      event
    })
  }
}

// connection type

const connectionTypeId = computed(() => props.connection.connectionTypeId)
const connectionType = computed(() => store.getters['currentConnections/typeByTypeId'](connectionTypeId.value))
const typeColor = computed(() => {
  if (connectionType.value) {
    return connectionType.value.color
  } else {
    return 'transparent'
  }
})
const typeName = computed(() => {
  if (connectionType.value) {
    return connectionType.value.name
  } else {
    return ''
  }
})

// label

const connectionDetailsIsVisible = computed(() => store.state.connectionDetailsIsVisibleForConnectionId === id.value)
const path = computed(() => props.connection.path)
watch(() => path.value, (value, prevValue) => {
  if (value) {
    updatePosition()
  }
})
const styles = computed(() => {
  return {
    background: typeColor.value,
    left: state.position.x + 'px',
    top: state.position.y + 'px'
  }
})
const connectionRect = () => {
  let connection = document.querySelector(`.connection-path[data-id="${id.value}"]`)
  if (!connection) { return }
  const zoom = utils.spaceCounterZoomDecimal() || 1
  let rect = connection.getBoundingClientRect()
  rect.x = rect.x + window.scrollX
  rect.y = rect.y + window.scrollY
  const rectPosition = utils.updatePositionWithSpaceOffset(rect)
  return {
    x: Math.round(rectPosition.x * zoom),
    y: Math.round(rectPosition.y * zoom),
    width: Math.round(rect.width * zoom),
    height: Math.round(rect.height * zoom)
  }
}
const updatePosition = async () => {
  if (!state.connectionIsVisible) { return }
  if (!props.connection.path) { return }
  await nextTick()
  const rect = connectionRect()
  if (!rect) { return }
  // position in center of connection
  const connectionOffset = {
    x: rect.width / 2,
    y: rect.height / 2
  }
  let position = {
    x: rect.x + connectionOffset.x,
    y: rect.y + connectionOffset.y
  }
  // offset by label size
  let label = labelElement.value
  let offset
  if (label) {
    label = label.getBoundingClientRect()
    offset = {
      x: label.width / 4 + state.labelOffsetX,
      y: label.height / 4 + state.labelOffsetY
    }
  } else {
    offset = { x: 0, y: 0 }
  }
  state.position = {
    x: position.x - offset.x,
    y: position.y - offset.y
  }
}
const startDragging = () => {
  state.isDragging = true
  wasDragged = false
}
const stopDragging = () => {
  state.isDragging = false
  startPosition = {}
}
const updateLabelOffset = (event) => {
  if (!state.isDragging) { return }
  if (isMultiTouch) { return }
  store.commit('closeAllDialogs')
  const threshold = 5
  const x = event.pageX + window.scrollX
  const y = event.pageY + window.scrollY
  if (!startPosition.x) {
    startPosition.x = x
    startPosition.y = y
  }
  const labelOffsetX = startPosition.x - x
  const labelOffsetY = startPosition.y - y
  if (labelOffsetX > threshold || labelOffsetY > threshold) {
    wasDragged = true
  }
  // TODO set bounds
  const rect = connectionRect()
  if (!rect) { return }
  // TODO
  // dispatch x,y update
  state.labelOffsetX = labelOffsetX
  state.labelOffsetY = labelOffsetY
  updatePosition()
}
const removeOffsets = () => {
  console.log('🙈')
  state.labelOffsetX = 0
  state.labelOffsetY = 0
  startPosition = {}
  wasDragged = false
}
</script>

<template lang="pug">
.connection-label.badge(
  v-if="visible"
  :style="styles"
  @click.left="toggleConnectionDetails"

  @mousedown.left.prevent="startDragging"
  @dblclick="removeOffsets"

  @touchend.stop="toggleConnectionDetails"
  @touchstart="checkIsMultiTouch"
  :data-id="id"
  @mouseover.left="state.hover = true"
  @mouseleave.left="state.hover = false"
  :class="{filtered: isFiltered, active: connectionDetailsIsVisible, jiggle: state.isDragging}"
  ref="labelElement"
)
  span.name(:class="{ 'is-dark': isDark }") {{typeName}}
</template>

<style lang="stylus">
.connection-label
  pointer-events all
  cursor pointer
  position absolute
  z-index 1
  &:hover
    box-shadow var(--hover-shadow)
  &:active,
  &.active
    box-shadow var(--button-active-inset-shadow)

  &.cursor-default
    cursor default
  .name
    color var(--primary-on-light-background)
    &.is-dark
      color var(--primary-on-dark-background)
</style>
