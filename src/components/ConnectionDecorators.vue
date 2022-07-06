<template lang="pug">
//- Label
button(@click.left="showLabelsIsVisible" :class="{ active: isSomeLabelsVisible }" :disabled="!canEditAll")
  img.icon(v-if="isSomeLabelsVisible" src="@/assets/view.svg")
  img.icon(v-else src="@/assets/view-hidden.svg")
  span Label
//- Arrow
button(@click.left="showDirectionsIsVisible" :class="{ active: isSomeDirectionsIsVisible }" :disabled="!canEditAll")
  img.icon.arrow(src="@/assets/connection-arrow.svg")
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
      const value = !this.isSomeDirectionsIsVisible
      this.clearAll()
      this.connections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          directionIsVisible: value
        })
      })
    },
    showLabelsIsVisible () {
      const value = !this.isSomeLabelsVisible
      this.clearAll()
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
      vertical-align 0
    &.reverse
      vertical-align 0
</style>
