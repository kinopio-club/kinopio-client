<template lang="pug">
.button-wrap.connection-decorators
  .segmented-buttons
    button(@click="clearAll" :class="{ active: isSomeConnectionsClear }")
      span -
    button(@click.left="enableDirectionsIsStart" :class="{ active: isSomeDirectionsIsStart }")
      img.icon.left-arrow(src="@/assets/down-arrow.svg")
    button(@click.left="enableDirectionsIsEnd" :class="{ active: isSomeDirectionsIsEnd }")
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
        const { directionIsStart, directionIsEnd, labelIsVisible } = connection
        if (directionIsStart || directionIsEnd || labelIsVisible) {
          return true
        }
      })
      return connections.length < this.connections.length
    },
    isSomeDirectionsIsStart () {
      const connections = this.connections.filter(connection => connection.directionIsStart)
      return connections.length
    },
    isSomeDirectionsIsEnd () {
      const connections = this.connections.filter(connection => connection.directionIsEnd)
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
          directionIsStart: false,
          directionIsEnd: false,
          labelIsVisible: false
        })
      })
    },
    enableDirectionsIsStart () {
      this.clearAll()
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          directionIsStart: true
        })
      })
    },
    enableDirectionsIsEnd () {
      this.clearAll()
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          directionIsEnd: true
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
