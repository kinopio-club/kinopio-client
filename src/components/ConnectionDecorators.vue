<template lang="pug">
.button-wrap.connection-decorators
  .segmented-buttons
    button(@click="clearAll" :class="{ active: isSomeConnectionsClear }")
      span -
    button
      img.icon.left-arrow(src="@/assets/down-arrow.svg")
    button
      img.icon.right-arrow(src="@/assets/down-arrow.svg")
    button(@click.left="labelsAreVisible" :class="{ active: isSomeLabelsVisible }")
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
      const decoratedConnections = this.connections.filter(connection => {
        const { directionIsLeft, directionIsRight, labelIsVisible } = connection
        if (directionIsLeft || directionIsRight || labelIsVisible) {
          return true
        }
      })
      return decoratedConnections.length < this.connections.length
    },
    isSomeLabelsVisible () {
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
    labelsAreVisible () {
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
