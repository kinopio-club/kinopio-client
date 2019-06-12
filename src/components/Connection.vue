<template lang="pug">
path(
  fill="none"
  stroke="#333333"
  stroke-width="3"
  :data-start-block="startBlockId"
  :data-end-block="endBlockId"
  :d="path"
  @click="showConnectionDetails"
)
</template>

<script>
import utils from '@/utils.js'

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
    showConnectionDetails (event) {
      const detailsPosition = utils.cursorPosition(event)
      this.$store.commit('closeAllPopOvers')
      this.$store.commit('currentSpace/connectionDetailsVisible', this.id)
      this.$store.commit('connectionDetailsIsVisible', true)
      this.$store.commit('connectionDetailsPosition', detailsPosition)
    }
  }
}
</script>

<style lang="stylus">
</style>
