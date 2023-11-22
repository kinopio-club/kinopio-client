<template lang="pug">
svg.connections
  template(v-for="startCardId in currentConnectionStartCardIds")
    CurrentConnection(:startCardId="startCardId")
  template(v-for="connection in remoteCurrentConnections")
    Connection(:connection="connection" :isRemote="true")
  template(v-for="connection in connections")
    Connection(:connection="connection")
template(v-for="connection in connections")
  ConnectionLabel(:connection="connection")
</template>

<script>
import Connection from '@/components/Connection.vue'
import CurrentConnection from '@/components/CurrentConnection.vue'
import ConnectionLabel from '@/components/ConnectionLabel.vue'

export default {
  name: 'Connections',
  components: {
    Connection,
    ConnectionLabel,
    CurrentConnection
  },
  computed: {
    currentConnectionStartCardIds () { return this.$store.state.currentConnectionStartCardIds },
    remoteCurrentConnections () { return this.$store.state.remoteCurrentConnections },
    connections () { return this.$store.getters['currentConnections/all'] }
  }
}
</script>

<style lang="stylus">
svg.connections,
.connection-labels
  position absolute
  top 0
  left 0
  width 100%
  height 100%
  path
    pointer-events all
    cursor pointer
</style>
