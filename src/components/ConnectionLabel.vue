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
  connectionRect: null,
  currentCursor: null
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
    store.dispatch('currentConnections/clearLabelPosition', props.connection)
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
const typeName = computed(() => {
  if (connectionType.value) {
    return connectionType.value.name
  } else {
    return ''
  }
})
const typeColor = computed(() => {
  if (connectionType.value) {
    return connectionType.value.color
  } else {
    return 'transparent'
  }
})
const updateTypeColorCSS = () => {
  utils.setCssVariable('type-color', typeColor.value)
}

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
const connectionLabelWrapStyles = computed(() => {
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
  store.dispatch('currentConnections/clearLabelPosition', props.connection)
  stopDragging()
  wasDragged = false
}

// label dragging

const startDragging = () => {
  store.commit('closeAllDialogs')
  store.dispatch('clearMultipleSelected')
  updateTypeColorCSS()
  state.isDragging = true
  wasDragged = false
}
const stopDragging = () => {
  state.isDragging = false
  state.outOfBounds = {}
  cursorStart = {}
}
const normalizeRelativePosition = (positionRelative) => {
  const max = 1
  const min = 0
  positionRelative = {
    x: Math.max(min, positionRelative.x),
    y: Math.max(min, positionRelative.y)
  }
  positionRelative = {
    x: Math.min(max, positionRelative.x),
    y: Math.min(max, positionRelative.y)
  }
  return positionRelative
}
const drag = (event) => {
  if (!state.isDragging) { return }
  if (isMultiTouch) { return }
  state.currentCursor = {
    x: event.pageX,
    y: event.pageY
  }
  // start positions
  if (!cursorStart.x) {
    cursorStart = {
      x: state.currentCursor.x,
      y: state.currentCursor.y
    }
    positionAbsoluteStart = {
      x: Math.round(labelRelativePosition.value.x * state.connectionRect.width),
      y: Math.round(labelRelativePosition.value.y * state.connectionRect.height)
    }
  }
  // new positions
  const cursorDelta = {
    x: state.currentCursor.x - cursorStart.x,
    y: state.currentCursor.y - cursorStart.y
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
  store.dispatch('currentConnections/updateLabelPosition', {
    connection: props.connection,
    labelRelativePositionX: positionRelative.x,
    labelRelativePositionY: positionRelative.y
  })
}

// boundaries

const boundaryIsVisible = computed(() => {
  return boundaryLeftIsVisible.value || boundaryRightIsVisible.value || boundaryTopIsVisible.value || boundaryBottomIsVisible.value
})
const boundaryLeftIsVisible = computed(() => labelRelativePosition.value.x <= 0)
const boundaryRightIsVisible = computed(() => labelRelativePosition.value.x >= 1)
const boundaryTopIsVisible = computed(() => labelRelativePosition.value.y <= 0)
const boundaryBottomIsVisible = computed(() => labelRelativePosition.value.y >= 1)
</script>

<template lang="pug">
.connection-label-wrap(v-if="visible" :style="connectionLabelWrapStyles")
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
  template(v-if="boundaryIsVisible && state.isDragging")
    .connection-label-boundary.left(v-if="boundaryLeftIsVisible")
    .connection-label-boundary.right(v-if="boundaryRightIsVisible")
    .connection-label-boundary.top(v-if="boundaryTopIsVisible")
    .connection-label-boundary.bottom(v-if="boundaryBottomIsVisible")

</template>

<style lang="stylus">
.connection-label-wrap
  position absolute
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

--type-color white
.connection-label-boundary
  position absolute
  background var(--type-color)
  box-shadow 0 0 30px 3px var(--type-color)
  &.left
    left 0
    top 0
    width 1px
    height 100%
    animation boundaryLeft 0.3s infinite ease-out alternate
  &.right
    right -5px
    top 0
    width 1px
    height 100%
    animation boundaryRight 0.3s infinite ease-out alternate
  &.top
    left 0
    top 0
    width 100%
    height 1px
    animation boundaryTop 0.3s infinite ease-out alternate
  &.bottom
    left 0
    bottom -5px
    width 100%
    height 1px
    animation boundaryBottom 0.3s infinite ease-out alternate

@keyframes boundaryLeft
  from
    transform translateX(0)
  to
    transform translateX(-4px)
@keyframes boundaryRight
  from
    transform translateX(0)
  to
    transform translateX(4px)
@keyframes boundaryTop
  from
    transform translateY(0)
  to
    transform translateY(4px)
@keyframes boundaryBottom
  from
    transform translateY(0)
  to
    transform translateY(-4px)
</style>
