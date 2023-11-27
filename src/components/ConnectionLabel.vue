<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

const labelElement = ref(null)
let isMultiTouch
let startPosition = {}
let wasDragged = false
const dragThreshold = 5
let startOffset = { x: 0.5, y: 0.5 }

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

// connection

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

// label

const labelOffsetX = computed(() => props.connection.labelOffsetX)
const labelOffsetY = computed(() => props.connection.labelOffsetY)
const position = computed(() => {
  const rect = state.connectionRect
  if (!rect) { return }
  const rectCenter = {
    x: rect.x + (rect.width / 2),
    y: rect.y + (rect.height / 2)
  }
  const offsetAbsolute = {
    x: labelOffsetX.value * state.connectionRect.width,
    y: labelOffsetY.value * state.connectionRect.height
  }
  console.log('🚒🚒🚒🚒', labelOffsetX.value, state.connectionRect.width)
  let position = {
    x: rectCenter.x - offsetAbsolute.x,
    y: rectCenter.y - offsetAbsolute.y
  }
  return offsetAbsolute
})
const styles = computed(() => {
  let label = labelElement.value
  if (!label) { return }
  // offset position by label center point
  const labelRect = label.getBoundingClientRect()
  const labelCenter = {
    x: Math.round(labelRect.width / 2),
    y: Math.round(labelRect.height / 2)
  }
  const newPosition = {
    x: position.value.x - labelCenter.x,
    y: position.value.y - labelCenter.y
  }
  return {
    background: typeColor.value,
    left: newPosition.x + 'px',
    top: newPosition.y + 'px'
  }
})
const startDragging = () => {
  state.isDragging = true
  wasDragged = false
}
const stopDragging = () => {
  state.isDragging = false
  state.outOfBounds = {}
  startPosition = {}
  startOffset = { x: 0.5, y: 0.5 }
}
const removeOffsets = () => {
  console.log('🙈') // TEMP
  store.dispatch('currentConnections/clearLabelOffset', props.connection)
  stopDragging()
  wasDragged = false
}
// const updateOffsetOnPathChange = async () => {
//   const rect = connectionRect()
//   if (!rect) { return }
//   await nextTick()
//   // position in center of connection
//   const rectCenter = {
//     x: rect.x + (rect.width / 2),
//     y: rect.y + (rect.height / 2)
//   }
//   let position = {
//     x: rect.x + connectionOffset.x,
//     y: rect.y + connectionOffset.y
//   }

//   // state.position = {
//   //   x: position.x - offset.x,
//   //   y: position.y - offset.y
//   // }
//   store.dispatch('currentConnections/updateLabelOffset', {
//     connection: props.connection,
//     labelOffsetX: currentOffset.x,
//     labelOffsetY: currentOffset.y
//   })

// }

// dragging

// const connectionRect = () => {
//   let element = document.querySelector(`.connection-path[data-id="${id.value}"]`)
//   if (!element) { return }
//   const zoom = utils.spaceCounterZoomDecimal() || 1
//   let rect = element.getBoundingClientRect()
//   rect.x = rect.x + window.scrollX
//   rect.y = rect.y + window.scrollY
//   const rectPosition = utils.updatePositionWithSpaceOffset(rect)
//   return {
//     x: Math.round(rectPosition.x * zoom),
//     y: Math.round(rectPosition.y * zoom),
//     width: Math.round(rect.width * zoom),
//     height: Math.round(rect.height * zoom)
//   }
// }
// const labelRect = () => {
//   let element = labelElement.value
//   if (!element) { return }
//   const zoom = utils.spaceCounterZoomDecimal() || 1
//   let rect = element.getBoundingClientRect()
//   rect.x = rect.x + window.scrollX
//   rect.y = rect.y + window.scrollY
//   const rectPosition = utils.updatePositionWithSpaceOffset(rect)
//   return {
//     x: Math.round(rectPosition.x * zoom),
//     y: Math.round(rectPosition.y * zoom),
//     width: Math.round(rect.width * zoom),
//     height: Math.round(rect.height * zoom)
//   }
// }

const drag = (event) => {
  if (!state.isDragging) { return }
  if (isMultiTouch) { return }
  store.commit('closeAllDialogs')
  const cursor = {
    x: event.pageX, //  + window.scrollX,
    y: event.pageY // + window.scrollY
  }
  // record start positions
  if (!startPosition.x) {
    startPosition = {
      x: cursor.x,
      y: cursor.y
    }
    startOffset = {
      x: labelOffsetX.value,
      y: labelOffsetY.value
    }
  }
  const offset = {
    x: startPosition.x - cursor.x + startOffset.x,
    y: startPosition.y - cursor.y + startOffset.y
  }
  if (offset.x > dragThreshold || offset.y > dragThreshold) {
    wasDragged = true
  }
  const offsetRelative = {
    x: offset.x / state.connectionRect.x,
    y: offset.y / state.connectionRect.y
  }
  // updateOutOfBounds(event)
  // let newOffsetX, newOffsetY
  // if (!state.outOfBounds.isX) {
  //   newOffsetX = currentOffset.x
  // }
  // if (!state.outOfBounds.isY) {
  //   newOffsetY = currentOffset.y
  // }

  // TODO MAKE relative to state.connectionRect

  store.dispatch('currentConnections/updateLabelOffset', {
    connection: props.connection,
    labelOffsetX: offsetRelative.x,
    labelOffsetY: offsetRelative.y
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
.connection-label-wrap(:style="connectionLabelWrapPosition")
  .connection-label.badge(
    v-if="visible"
    :style="styles"
    @click.left="toggleConnectionDetails"

    @mousedown.left.prevent="startDragging"
    @dblclick="removeOffsets"
    :data-label-offset-x="labelOffsetX"
    :data-label-offset-y="labelOffsetY"

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
