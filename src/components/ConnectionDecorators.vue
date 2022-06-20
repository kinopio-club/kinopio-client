<template lang="pug">
.button-wrap.connection-decorators
  .segmented-buttons
    button(@click="clearAll" :class="{ active: someConnectionsAreClear }")
      span -
    button
      img.icon.left-arrow(src="@/assets/down-arrow.svg")
    button
      img.icon.right-arrow(src="@/assets/down-arrow.svg")
    button(@click.left="toggleAllLabelsAreVisible" :class="{ active: someLabelsAreVisible }")
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
    someConnectionsAreClear () {
      const decoratedConnections = this.connections.filter(connection => {
        const { directionIsLeft, directionIsRight, labelIsVisible } = connection
        if (directionIsLeft || directionIsRight || labelIsVisible) {
          return true
        }
      })
      return decoratedConnections.length < this.connections.length
    },
    someLabelsAreVisible () {
      const labelled = this.connections.filter(connection => connection.labelIsVisible)
      return labelled.length
    }
  },
  methods: {
    clearAll () {
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          labelIsVisible: false
        })
      })
    },
    toggleAllLabelsAreVisible () {
      const isVisible = !this.allLabelsAreVisible
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          labelIsVisible: isVisible
        })
      })
    }
  }
}
</script>

<style lang="stylus">
// .connection-decorators
</style>
