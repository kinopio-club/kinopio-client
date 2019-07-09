<template lang="pug">
dialog(v-if="visible" :open="visible" :style="position")
  section
    // p details for connection from block {{connection.startBlockId}} to {{connection.endBlockId}}
    p {{typeColor}}
    input(placeholder="connection" :value="typeName")
    button Remove
    button [x] new uses last connection type
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
    typeName () { return this.connectionType.name },
    typeColor () { return this.connectionType.color }

    // name: {
    //   get () {
    //     return this.connection.name
    //   },
    //   set (newValue) {
    //     const options = {
    //       type: 'name',
    //       value: newValue,
    //       connectionId: this.id
    //     }
    //     this.$store.commit('currentSpace/updateconnectionDetails', options)
    //   }
    // },
  }
}
</script>

<style lang="stylus">
</style>
