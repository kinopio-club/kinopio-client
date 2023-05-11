<template lang="pug">
//- Label
.button-wrap
  button(@click.left="showLabelsIsVisible" :class="{ active: isSomeLabelsVisible }" :disabled="!canEditAll")
    span Label
//- Arrow
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

<script>
import utils from '@/utils.js'

export default {
  name: 'ConnectionDecorators',
  components: {
  },
  props: {
    connections: Array
  },
  computed: {
    path () { return 'M0 0 L20 0' },
    gradientIdReference () { return `url('#gradient')` },
    isSomeConnectionsClear () {
      const connections = this.connections.filter(connection => {
        const { directionIsVisible, labelIsVisible } = connection
        if (directionIsVisible || labelIsVisible) {
          return true
        }
      })
      return connections.length < this.connections.length
    },
    isSomeDirectionsIsVisible () {
      const connections = this.connections.filter(connection => connection.directionIsVisible)
      return connections.length
    },
    isSomeLabelsVisible () {
      const connections = this.connections.filter(connection => connection.labelIsVisible)
      return connections.length
    },
    canEditAll () {
      if (this.isSpaceMember) { return true }
      const connectionsCreatedByCurrentUser = this.connections.filter(connection => {
        return this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
      })
      return connectionsCreatedByCurrentUser.length === this.connections.length
    },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    allPathsIsCurved () {
      const curvedConnections = this.connections.filter(connection => {
        if (!connection) { return }
        if (!connection.path) { return }
        const controlPoint = utils.curveControlPointFromPath(connection.path)
        const isCurved = controlPoint.x && controlPoint.y
        return isCurved
      })
      return curvedConnections.length === this.connections.length
    },
    allPathsIsStraight () {
      const curvedConnections = this.connections.filter(connection => {
        if (!connection) { return }
        if (!connection.path) { return }
        const controlPoint = utils.curveControlPointFromPath(connection.path)
        const isCurved = !controlPoint.x && !controlPoint.y
        return isCurved
      })
      return curvedConnections.length === this.connections.length
    }
  },
  methods: {
    showDirectionsIsVisible () {
      const value = !this.isSomeDirectionsIsVisible
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          directionIsVisible: value
        })
      })
    },
    showLabelsIsVisible () {
      const value = !this.isSomeLabelsVisible
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          labelIsVisible: value
        })
      })
    },
    reverseConnections () {
      this.connections.forEach(connection => {
        const startCardId = connection.endCardId
        const endCardId = connection.startCardId
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          startCardId,
          endCardId
        })
      })
      this.$store.dispatch('currentConnections/updatePaths', { connections: this.connections, shouldUpdateApi: true })
    },
    togglePathIsStraight (isStraight) {
      let controlPoint = null
      if (isStraight) {
        controlPoint = `q00,00`
      }
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          controlPoint
        })
      })
      this.$store.dispatch('currentConnections/updatePaths', { connections: this.connections, shouldUpdateApi: true })
      this.$store.dispatch('currentUser/update', { defaultConnectionControlPoint: controlPoint })
    }

  }
}
</script>

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
