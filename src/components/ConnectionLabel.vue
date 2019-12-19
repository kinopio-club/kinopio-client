<template lang="pug">
.connection-label.badge(
  :style="{ background: typeColor}"
  @click="showConnectionDetails"
)
  span {{typeName}}
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'ConnectionLabel',
  props: {
    connection: Object
  },
  // data () {
  // return {
  //   controlCurve: undefined,
  // }
  // },
  computed: {
    id () { return this.connection.id },
    connectionTypeId () { return this.connection.connectionTypeId },
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connectionTypeId) },
    typeColor () {
      // if (this.connectionType) {
      return this.connectionType.color
      // } else { return undefined }
    },
    typeName () {
      // remove the null soak on ^ typeColor??
      return this.connectionType.name
    }
  },
  methods: {
    // same as Connection method
    showConnectionDetails (event) {
      const detailsPosition = utils.cursorPositionInPage(event)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('connectionDetailsIsVisibleForConnectionId', this.id)
      this.$store.commit('connectionDetailsPosition', detailsPosition)
      this.$store.commit('clearMultipleSelected')
    }

  }

}
</script>

<style lang="stylus">
// .connection-labels
.connection-label
  pointer-events all
  cursor pointer
  position absolute
</style>
