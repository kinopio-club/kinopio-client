<template lang="pug">
.button-wrap.connection-decorators
  .segmented-buttons
    button(@click="clearAll" :class="{ active: isSomeConnectionsClear }")
      img.icon.clear(src="@/assets/connection-clear.svg")
    button(@click.left="showDirectionsIsVisible" :class="{ active: isSomeDirectionsIsVisible }")
      img.icon.arrow(src="@/assets/connection-arrow.svg")
    button(@click.left="reverseConnections")
      img.icon.reverse(src="@/assets/connection-reverse.svg")
    button(@click.left="showLabelsIsVisible" :class="{ active: isSomeLabelsVisible }")
      span Label
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
    }
  },
  methods: {
    clearAll () {
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          directionIsVisible: false,
          labelIsVisible: false
        })
      })
    },
    showDirectionsIsVisible () {
      this.clearAll()
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          directionIsVisible: true
        })
      })
    },
    showLabelsIsVisible () {
      this.clearAll()
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          labelIsVisible: true
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
      this.$nextTick(() => {
        this.$store.commit('triggerUpdateConnectionArrowPositions', { connections: this.connections })
      })
    }
  }
}
</script>

<style lang="stylus">
.connection-decorators
  .icon
    &.clear
      vertical-align 4px
    &.arrow
      vertical-align 0
    &.reverse
      vertical-align 0
</style>
