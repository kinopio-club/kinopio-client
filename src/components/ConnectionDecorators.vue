<template lang="pug">
.button-wrap.connection-decorators
  .segmented-buttons
    //- Clear
    button(@click="clearAll" :class="{ active: isSomeConnectionsClear }" :disabled="!canEditSome")
      img.icon.clear(src="@/assets/connection-clear.svg")
    //- Arrow
    button(@click.left="showDirectionsIsVisible" :class="{ active: isSomeDirectionsIsVisible }" :disabled="!canEditSome")
      img.icon.arrow(src="@/assets/connection-arrow.svg")
    //- Label
    button(@click.left="showLabelsIsVisible" :class="{ active: isSomeLabelsVisible }" :disabled="!canEditSome")
      //- img.icon(v-if="isSomeLabelsVisible" src="@/assets/view.svg")
      //- img.icon(v-else src="@/assets/view-hidden.svg")
      span Label
//- Reverse
.button-wrap.connection-decorators
  button(@click.left="reverseConnections" :disabled="!canEditSome")
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
    canEditSome () {
      if (this.isSpaceMember) { return true }
      const connectionsCreatedByCurrentUser = this.connections.filter(connection => {
        return this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
      })
      return connectionsCreatedByCurrentUser.length === this.connections.length
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
