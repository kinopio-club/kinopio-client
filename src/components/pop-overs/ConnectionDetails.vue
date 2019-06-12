<template lang="pug">
foreignObject(:x="position.x" :y="position.y" width="100%" height="100%" v-if="connectionDetailsVisible")
  dialog.pop-over(:open="connectionDetailsVisible")
    section
      p connection details
      // input(placeholder="name" v-model="name")
      button hiyo
</template>

<script>
export default {
  name: 'ConnectionDetails',
  props: {
    connection: Object,
    position: Object
  },
  computed: {
    id () { return this.connection.id },
    connectionType () { return this.connection.connectionType },
    startBlockId () { return this.connection.startBlockId },
    endBlockId () { return this.connection.endBlockId },
    path () { return this.connection.path },
    connectionDetailsVisible () { return this.connection.connectionDetailsVisible }
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
foreignObject
  dialog
    top 0
    left 0
</style>
