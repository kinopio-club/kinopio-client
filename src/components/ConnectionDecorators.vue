<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

const props = defineProps({
  connections: Array
})

const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const canEditAll = computed(() => {
  if (isSpaceMember.value) { return true }
  const connectionsCreatedByCurrentUser = props.connections.filter(connection => {
    return store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
  })
  return connectionsCreatedByCurrentUser.length === props.connections.length
})

// direction

const path = computed(() => 'M0 0 L20 0')
const gradientIdReference = computed(() => `url('#gradient')`)
const isSomeDirectionsIsVisible = computed(() => {
  const connections = props.connections.filter(connection => connection.directionIsVisible)
  return connections.length
})
const showDirectionsIsVisible = () => {
  const value = !isSomeDirectionsIsVisible.value
  props.connections.forEach(connection => {
    store.dispatch('currentConnections/update', {
      id: connection.id,
      directionIsVisible: value
    })
  })
}

// label

const isSomeLabelsVisible = computed(() => {
  const connections = props.connections.filter(connection => connection.labelIsVisible)
  return connections.length
})
const showLabelsIsVisible = () => {
  const value = !isSomeLabelsVisible.value
  props.connections.forEach(connection => {
    store.dispatch('currentConnections/update', {
      id: connection.id,
      labelIsVisible: value
    })
  })
}

// reverse

const reverseConnections = () => {
  props.connections.forEach(connection => {
    const startCardId = connection.endCardId
    const endCardId = connection.startCardId
    store.dispatch('currentConnections/update', {
      id: connection.id,
      startCardId,
      endCardId
    })
  })
  store.dispatch('currentConnections/updatePaths', { connections: props.connections })
}

// curve or straight

const allPathsIsCurved = computed(() => {
  const curvedConnections = props.connections.filter(connection => {
    if (!connection) { return }
    if (!connection.path) { return }
    const controlPoint = utils.curveControlPointFromPath(connection.path)
    const isCurved = controlPoint.x && controlPoint.y
    return isCurved
  })
  return curvedConnections.length === props.connections.length
})
const allPathsIsStraight = computed(() => {
  const curvedConnections = props.connections.filter(connection => {
    if (!connection) { return }
    if (!connection.path) { return }
    const controlPoint = utils.curveControlPointFromPath(connection.path)
    const isCurved = !controlPoint.x && !controlPoint.y
    return isCurved
  })
  return curvedConnections.length === props.connections.length
})
const togglePathIsStraight = (isStraight) => {
  let controlPoint = null
  if (isStraight) {
    controlPoint = `q00,00`
  }
  props.connections.forEach(connection => {
    store.dispatch('currentConnections/update', {
      id: connection.id,
      controlPoint
    })
  })
  store.dispatch('currentConnections/updatePaths', { connections: props.connections })
  store.dispatch('currentUser/update', { defaultConnectionControlPoint: controlPoint })
}
</script>

<template lang="pug">
//- Label
.button-wrap
  button(@click.left="showLabelsIsVisible" :class="{ active: isSomeLabelsVisible }" :disabled="!canEditAll")
    span Label
//- Direction
.button-wrap
  button(@click.left="showDirectionsIsVisible" :class="{ active: isSomeDirectionsIsVisible }" :disabled="!canEditAll" title="Direction")
    svg.icon.arrow(width="20px" height="12px" viewBox="0 0 20 2")
      g(stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round")
        path(:d="path" stroke="#000000")
        defs
          linearGradient(id="gradient")
            stop(offset="0%" stop-color="#000000" stop-opacity="0" fill-opacity="0")
            stop(offset="90%" stop-color="#000000")
      circle(r="5" :fill="gradientIdReference")
        animateMotion(dur="3s" repeatCount="indefinite" :path="path" rotate="auto")

//- Reverse
.button-wrap
  button(@click.left="reverseConnections" :disabled="!canEditAll" title="Reverse")
    img.icon.reverse(src="@/assets/connection-reverse.svg")

//- Curved or Straight
.button-wrap.path-curve-options
  .segmented-buttons
    button(:class="{active: allPathsIsCurved}" @click="togglePathIsStraight(false)" title="Curve")
      img.icon.connection-path(src="@/assets/connection-path.svg")
    button(:class="{active: allPathsIsStraight}" @click="togglePathIsStraight(true)" title="Straight")
      img.icon.connection-path(src="@/assets/connection-path-straight.svg")

</template>

<style lang="stylus" scoped>
button
  .icon
    &.clear
      vertical-align 4px
    &.arrow
      vertical-align -2px
    &.reverse,
    &.connection-path
      vertical-align 0
.subsection
  .button-wrap
    margin-bottom 4px !important
</style>
