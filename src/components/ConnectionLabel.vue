<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

const labelElement = ref(null)
let isMultiTouch
let cursorStart = {}
let wasDragged = false
const dragThreshold = 5
let positionAbsoluteStart

onMounted(() => {
  window.addEventListener('scroll', updateConnectionIsVisible)
  window.addEventListener('mouseup', stopDragging)
  window.addEventListener('mousemove', drag)
  updateConnectionRect()
})
onUnmounted(() => {
  window.removeEventListener('scroll', updateConnectionIsVisible)
})

const props = defineProps({
  connection: Object
})
const state = reactive({
  hover: false,
  connectionIsVisible: true,
  outOfBounds: {},
  isDragging: false,
  connectionRect: null
})
watch(() => state.hover, (value, prevValue) => {
  if (value) {
    store.commit('currentUserIsHoveringOverConnectionId', id.value)
  } else {
    store.commit('currentUserIsHoveringOverConnectionId', '')
  }
})
watch(() => state.isDragging, (value, prevValue) => {
  if (value) {
    store.commit('currentUserIsDraggingConnectionIdLabel', id.value)
  } else {
    store.commit('currentUserIsDraggingConnectionIdLabel', '')
  }
})

const visible = computed(() => props.connection.labelIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    store.dispatch('currentConnections/clearLabelOffset', props.connection)
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

// parent connection

const id = computed(() => props.connection.id)
const connectionDetailsIsVisible = computed(() => store.state.connectionDetailsIsVisibleForConnectionId === id.value)
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

// parent connection type

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

// label wrap

const path = computed(() => props.connection.path)
watch(() => path.value, (value, prevValue) => {
  updateConnectionRect()
})
const updateConnectionRect = () => {
  let element = document.querySelector(`.connection-path[data-id="${id.value}"]`)
  if (!element) { return }
  const zoom = utils.spaceCounterZoomDecimal() || 1
  let rect = element.getBoundingClientRect()
  rect.x = rect.x + window.scrollX
  rect.y = rect.y + window.scrollY
  const rectPosition = utils.updatePositionWithSpaceOffset(rect)
  state.connectionRect = {
    x: Math.round(rectPosition.x * zoom),
    y: Math.round(rectPosition.y * zoom),
    width: Math.round(rect.width * zoom),
    height: Math.round(rect.height * zoom)
  }
}
const connectionLabelWrapPosition = computed(() => {
  if (!state.connectionRect) { return }
  return {
    left: state.connectionRect.x + 'px',
    top: state.connectionRect.y + 'px',
    width: state.connectionRect.width + 'px',
    height: state.connectionRect.height + 'px'
  }
})

// label position

const labelRelativePosition = computed(() => {
  return {
    x: props.connection.labelRelativePositionX,
    y: props.connection.labelRelativePositionY
  }
})
const styles = computed(() => {
  const label = labelElement.value
  if (!label) { return }
  const labelRect = label.getBoundingClientRect()
  const labelCenter = {
    x: Math.round(labelRect.width / 4),
    y: Math.round(labelRect.height / 4)
  }
  return {
    background: typeColor.value,
    left: `calc(${labelRelativePosition.value.x * 100}% - ${labelCenter.x}px)`,
    top: `calc(${labelRelativePosition.value.y * 100}% - ${labelCenter.y}px)`
  }
})
const removeOffsets = () => {
  store.dispatch('currentConnections/clearLabelOffset', props.connection)
  stopDragging()
  wasDragged = false
}

// label dragging

const startDragging = () => {
  state.isDragging = true
  wasDragged = false
}
const stopDragging = () => {
  state.isDragging = false
  state.outOfBounds = {}
  cursorStart = {}
}
const normalizeRelativePosition = (positionRelative) => {
  const maxX = 1 //
  const maxY = 1
  const min = 0
  positionRelative = {
    x: Math.max(min, positionRelative.x),
    y: Math.max(min, positionRelative.y)
  }
  positionRelative = {
    x: Math.min(maxX, positionRelative.x),
    y: Math.min(maxY, positionRelative.y)
  }
  return positionRelative
}
const drag = (event) => {
  if (!state.isDragging) { return }
  if (isMultiTouch) { return }
  store.commit('closeAllDialogs')
  const cursor = {
    x: event.pageX,
    y: event.pageY
  }
  // start positions
  if (!cursorStart.x) {
    cursorStart = {
      x: cursor.x,
      y: cursor.y
    }
    positionAbsoluteStart = {
      x: Math.round(labelRelativePosition.value.x * state.connectionRect.width),
      y: Math.round(labelRelativePosition.value.y * state.connectionRect.height)
    }
  }
  // new positions
  const cursorDelta = {
    x: cursor.x - cursorStart.x,
    y: cursor.y - cursorStart.y
  }
  if (Math.abs(cursorDelta.x) > dragThreshold || Math.abs(cursorDelta.y) > dragThreshold) {
    wasDragged = true
  }
  const positionAbsolute = {
    x: cursorDelta.x + positionAbsoluteStart.x,
    y: cursorDelta.y + positionAbsoluteStart.y
  }
  let positionRelative = {
    x: positionAbsolute.x / state.connectionRect.width,
    y: positionAbsolute.y / state.connectionRect.height
  }
  positionRelative = normalizeRelativePosition(positionRelative)
  store.dispatch('currentConnections/updateLabelOffset', {
    connection: props.connection,
    labelRelativePositionX: positionRelative.x,
    labelRelativePositionY: positionRelative.y
  })
}

// boundaries

// const updateOutOfBounds = (event) => {
//   const cursor = {
//     x: event.pageX + window.scrollX,
//     y: event.pageY + window.scrollY
//   }
//   let rect = connectionRect()
//   rect.x = rect.x + window.scrollX
//   rect.y = rect.y + window.scrollY
//   if (!rect) { return }
//   state.outOfBounds.isLeft = cursor.x < rect.x
//   state.outOfBounds.isRight = cursor.x > rect.x + rect.width
//   state.outOfBounds.isTop = cursor.y < rect.y
//   state.outOfBounds.isBottom = cursor.y > rect.y + rect.height
//   state.outOfBounds.isX = state.outOfBounds.isLeft || state.outOfBounds.isRight
//   state.outOfBounds.isY = state.outOfBounds.isTop || state.outOfBounds.isBottom
// }
// const isOutOfBounds = computed(() => state.outOfBounds.isX || state.outOfBounds.isY)
// const boundaryStylesLeft = computed(() => {
//   console.log('🇨🇦🇨🇦left', state.outOfBounds.isLeft, state.outOfBounds.isX)
//   return null
// })
// const boundaryStylesRight = computed(() => {
//   console.log('🇨🇦🇨🇦right', state.outOfBounds.isRight)
//   return null
// })
// const boundaryStylesTop = computed(() => {
//   console.log('🇨🇦🇨🇦top', state.outOfBounds.isTop)
//   return null
// })
// const boundaryStylesBottom = computed(() => {
//   console.log('🇨🇦🇨🇦bottom', state.outOfBounds.isBottom)
//   return null
// })

</script>

<template lang="pug">
.connection-label-wrap(v-if="visible" :style="connectionLabelWrapPosition")
  .connection-label.badge(
    :style="styles"
    @click.left="toggleConnectionDetails"

    @mousedown.left.prevent="startDragging"
    @dblclick="removeOffsets"
    :data-label-offset-x="labelRelativePosition.x"
    :data-label-offset-y="labelRelativePosition.y"

    @touchend.stop="toggleConnectionDetails"
    @touchstart="checkIsMultiTouch"
    :data-id="id"
    @mouseover.left="state.hover = true"
    @mouseleave.left="state.hover = false"
    :class="{filtered: isFiltered, active: connectionDetailsIsVisible, jiggle: state.isDragging}"
    ref="labelElement"
  )
    span.name(:class="{ 'is-dark': isDark }") {{typeName}}
  //- template(v-if="isOutOfBounds")
  //-   .connection-label-boundary.left(v-if="state.outOfBounds.isLeft" :style="boundaryStylesLeft")
  //-   .connection-label-boundary.right(v-if="state.outOfBounds.isRight" :style="boundaryStylesRight")
  //-   .connection-label-boundary.top(v-if="state.outOfBounds.isTop" :style="boundaryStylesTop")
  //-   .connection-label-boundary.bottom(v-if="state.outOfBounds.isBottom" :style="boundaryStylesBottom")

</template>

<style lang="stylus">
.connection-label-wrap
  position absolute
  background rgba(239, 207, 227, .6)
.connection-label
  pointer-events all
  cursor pointer
  position absolute
  z-index 1
  width max-content
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

.connection-label-boundary
  position absolute

</style>
