<template lang="pug">
g
  path(
    fill="none"
    stroke="#333333"
    stroke-width="3"
    :data-start-block="startBlockId"
    :data-end-block="endBlockId"
    :d="path"
    @click="showConnectionDetailsPop"
  )
  ConnectionDetails(
    :connection="connection"
    :position="detailsPosition"
  )
</template>

<script>
import ConnectionDetails from '@/components/pop-overs/ConnectionDetails.vue'
import utils from '@/utils.js'

export default {
  components: {
    ConnectionDetails
  },
  props: {
    connection: Object
  },
  data () {
    return {
      detailsPosition: undefined
    }
  },
  computed: {
    id () { return this.connection.id },
    connectionType () { return this.connection.connectionType },
    startBlockId () { return this.connection.startBlockId },
    endBlockId () { return this.connection.endBlockId },
    path () { return this.connection.path },
    connectionDetailsVisible () { return this.connection.connectionDetailsVisible }
  },
  methods: {
    showConnectionDetailsPop (event) {
      this.detailsPosition = utils.cursorPosition(event)
      this.$store.commit('closeAllPopOvers')
      this.$store.commit('currentSpace/connectionDetailsVisible', this.id)
      this.$store.commit('connectionDetailsIsVisible', true)
    }
  }

}
</script>

<style lang="stylus">
</style>
