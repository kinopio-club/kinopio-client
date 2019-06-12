<template lang="pug">
dialog.pop-over.max-z(v-if="visible" :open="visible" :style="position")
  section
    p details for connection from block {{connection.startBlockId}} to {{connection.endBlockId}}
    // input(placeholder="name" v-model="name")
    button hiyo
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
    }
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
