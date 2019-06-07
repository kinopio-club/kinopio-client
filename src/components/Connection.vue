<template lang="pug">
path(
  fill="none"
  stroke="#333333"
  stroke-width="3"
  :data-start-block="startBlockId"
  :data-end-block="endBlockId"
  :d="path"
  @click="showConnectionDetailsPop"
)
</template>

<script>
export default {
  props: {
    connection: Object
  },
  computed: {
    id () { return this.connection.id },
    connectionType () { return this.connection.connectionType },
    startBlockId () { return this.connection.startBlockId },
    endBlockId () { return this.connection.endBlockId },
    path () { return this.connection.path }
  },
  methods: {
    showConnectionDetailsPop () {
      console.log('path is clicked', this.id)
    }
  }
}
</script>

<style lang="stylus">
</style>
