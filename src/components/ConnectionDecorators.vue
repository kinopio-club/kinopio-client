<template lang="pug">
//- Label
button(@click.left="showLabelsIsVisible" :class="{ active: isSomeLabelsVisible }" :disabled="!canEditAll")
  span Label
//- Arrow
button(@click.left="showDirectionsIsVisible" :class="{ active: isSomeDirectionsIsVisible }" :disabled="!canEditAll")
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
button(@click.left="reverseConnections" :disabled="!canEditAll")
  img.icon.reverse(src="@/assets/connection-reverse.svg")

</template>

<script>
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
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() }
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
      vertical-align -3px
    &.reverse
      vertical-align 0
</style>
