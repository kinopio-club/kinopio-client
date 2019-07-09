<template lang="pug">
path(
  fill="none"
  :stroke="typeColor"
  stroke-width="5"
  :data-start-block="startBlockId"
  :data-end-block="endBlockId"
  :d="path"
  @click="showConnectionDetails"
  @touchend.stop="showConnectionDetails"
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
    connectionTypeId () { return this.connection.connectionTypeId },
    startBlockId () { return this.connection.startBlockId },
    endBlockId () { return this.connection.endBlockId },
    path () { return this.connection.path },
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connectionTypeId) },
    typeColor () { return this.connectionType.color }
  },
  methods: {
    showConnectionDetails (event) {
      const detailsPosition = utils.cursorPositionInPage(event)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('currentSpace/connectionDetailsVisible', this.id)
      this.$store.commit('connectionDetailsIsVisible', true)
      this.$store.commit('connectionDetailsPosition', detailsPosition)
    }
  }
}
</script>

<style lang="stylus">
</style>
