<template lang="pug">
.button-wrap.connection-decorators
  .segmented-buttons
    button(@click="clearAll" :class="{ active: isSomeConnectionsClear }")
      span -
    button(@click.left="enableDirectionsIsLeft" :class="{ active: isSomeDirectionsIsLeft }")
      img.icon.left-arrow(src="@/assets/down-arrow.svg")
    button(@click.left="enableDirectionsIsRight" :class="{ active: isSomeDirectionsIsRight }")
      img.icon.right-arrow(src="@/assets/down-arrow.svg")
    button(@click.left="enableLabels" :class="{ active: isSomeLabelsVisible }")
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
        const { directionIsLeft, directionIsRight, labelIsVisible } = connection
        if (directionIsLeft || directionIsRight || labelIsVisible) {
          return true
        }
      })
      return connections.length < this.connections.length
    },
    isSomeDirectionsIsLeft () {
      const connections = this.connections.filter(connection => connection.directionIsLeft)
      return connections.length
    },
    isSomeDirectionsIsRight () {
      const connections = this.connections.filter(connection => connection.directionIsRight)
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
          directionIsLeft: false,
          directionIsRight: false,
          labelIsVisible: false
        })
      })
    },
    enableDirectionsIsLeft () {
      this.clearAll()
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          directionIsLeft: true
        })
      })
    },
    enableDirectionsIsRight () {
      this.clearAll()
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          directionIsRight: true
        })
      })
    },
    enableLabels () {
      this.clearAll()
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          labelIsVisible: true
        })
      })
    }
  }
}
</script>

<style lang="stylus">
// .connection-decorators
</style>
