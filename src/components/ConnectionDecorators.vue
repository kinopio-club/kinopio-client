<template lang="pug">
.button-wrap.connection-decorators
  .segmented-buttons
    button
      span -
    button
      img.icon.left-arrow(src="@/assets/down-arrow.svg")
    button
      img.icon.right-arrow(src="@/assets/down-arrow.svg")
    button(:class="{active: allLabelsAreVisible}" @click.left="toggleAllLabelsAreVisible")
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
    allLabelsAreVisible () {
      const labelled = this.connections.filter(connection => connection.labelIsVisible)
      return labelled.length === this.connections.length
    }
  },
  methods: {
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
