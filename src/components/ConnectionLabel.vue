<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

const labelElement = ref(null)
let isMultiTouch

onMounted(() => {
  updatePosition()
  window.addEventListener('scroll', updateConnectionIsVisible)
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
  connectionIsVisible: true
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
  const hasChanged = state.connectionIsVisible !== Boolean(connection)
  if (connection && hasChanged) {
    state.connectionIsVisible = true
  } else {
    state.connectionIsVisible = false
  }
}
const showConnectionDetails = (event) => {
  if (isMultiTouch) { return }
  store.commit('triggerConnectionDetailsIsVisible', {
    connectionId: id.value,
    event
  })
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
const updatePosition = async () => {
  if (!state.connectionIsVisible) { return }
  if (!props.connection.path) { return }
  await nextTick()
  // rect
  let connection = document.querySelector(`.connection-path[data-id="${id.value}"]`)
  if (!connection) { return }
  const zoom = utils.spaceCounterZoomDecimal() || 1
  let rect = connection.getBoundingClientRect()
  rect.x = rect.x + window.scrollX
  rect.y = rect.y + window.scrollY
  const rectPosition = utils.updatePositionWithSpaceOffset(rect)
  rect = {
    x: Math.round(rectPosition.x * zoom),
    y: Math.round(rectPosition.y * zoom),
    width: Math.round(rect.width * zoom),
    height: Math.round(rect.height * zoom)
  }
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
  let labelOffset
  if (label) {
    label = label.getBoundingClientRect()
    labelOffset = {
      x: label.width / 4,
      y: label.height / 4
    }
  } else {
    labelOffset = { x: 0, y: 0 }
  }
  state.position = {
    x: position.x - labelOffset.x,
    y: position.y - labelOffset.y
  }
}
</script>

<template lang="pug">
.connection-label.badge(
  v-if="visible"
  :style="styles"
  @click.left="showConnectionDetails"
  @touchend.stop="showConnectionDetails"
  @touchstart="checkIsMultiTouch"
  :data-id="id"
  @mouseover.left="state.hover = true"
  @mouseleave.left="state.hover = false"
  :class="{filtered: isFiltered}"
  ref="labelElement"
)
  span.name(:class="{ 'is-dark': isDark }") {{typeName}}
</template>

<style lang="stylus">
.connection-label
  pointer-events all
  cursor pointer
  position absolute
  transform-origin top left
  z-index 1
  &.cursor-default
    cursor default
  .name
    color var(--primary-on-light-background)
    &.is-dark
      color var(--primary-on-dark-background)
</style>
