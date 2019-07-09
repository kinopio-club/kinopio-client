<template lang="pug">
dialog(v-if="visible" :open="visible" :style="position")
  section
    input(placeholder="connection" v-model="typeName")
    button Remove
    button [x] new uses this connection type
  section
    button + connection
    p select existing conneciton type
</template>

<script>
export default {
  name: 'ConnectionDetails',
  computed: {
    visible () { return this.$store.state.connectionDetailsIsVisible },
    position () {
      const cursor = this.$store.state.connectionDetailsPosition
      return {
        left: `${cursor.x}px`,
        top: `${cursor.y}px`
      }
    },
    connection () {
      let connections = this.$store.state.currentSpace.connections
      return connections.find(connection => {
        return connection.connectionDetailsVisible === true
      })
    },
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connection.connectionTypeId) },
    typeName: {
      get () { return this.connectionType.name },
      set (newName) {
        const connectionTypeId = this.connectionType.id
        this.$store.commit('currentSpace/updateConnectionTypeName', { connectionTypeId, newName })
      }
    }
    // typeColor () { return this.connectionType.color }

  }
}
</script>

<style lang="stylus">
</style>
