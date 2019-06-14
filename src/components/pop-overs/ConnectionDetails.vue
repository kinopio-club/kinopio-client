<template lang="pug">
dialog.pop-over(v-if="visible" :open="visible" :style="position")
  section
    p details for connection from block {{connection.startBlockId}} to {{connection.endBlockId}}
    input(placeholder="name" value="connection name")
    button disconnect
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
      console.log(cursor)
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
