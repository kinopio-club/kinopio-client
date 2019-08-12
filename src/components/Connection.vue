<template lang="pug">
path.path(
  fill="none"
  :stroke="typeColor"
  stroke-width="5"
  :data-start-card="startCardId"
  :data-end-card="endCardId"
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
    startCardId () { return this.connection.startCardId },
    endCardId () { return this.connection.endCardId },
    path () { return this.connection.path },
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connectionTypeId) },
    typeColor () {
      if (this.connectionType) {
        return this.connectionType.color
      } else { return undefined }
    }
  },
  methods: {
    showConnectionDetails (event) {
      const detailsPosition = utils.cursorPositionInPage(event)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('connectionDetailsIsVisibleForConnection', this.id)
      this.$store.commit('connectionDetailsPosition', detailsPosition)
      this.$store.commit('multipleCardsSelected', [])
    }
  }
}
</script>

<style lang="stylus">
.path
  &:hover
    stroke-width: 7
</style>
