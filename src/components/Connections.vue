<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Connection from '@/components/Connection.vue'
import CurrentConnection from '@/components/CurrentConnection.vue'
import ConnectionLabel from '@/components/ConnectionLabel.vue'
const store = useStore()

const currentConnectionStartCardIds = computed(() => store.state.currentConnectionStartCardIds)
const remoteCurrentConnections = computed(() => store.state.remoteCurrentConnections)
const connections = computed(() => store.getters['currentConnections/all'])
</script>

<template lang="pug">
svg.current-connection
  //- TODO refactor to not be page size svg (dynamic svg rect)
  template(v-for="startCardId in currentConnectionStartCardIds")
    CurrentConnection(:startCardId="startCardId")
.connections
  template(v-for="connection in remoteCurrentConnections")
    Connection(:connection="connection" :isRemote="true")
  template(v-for="connection in connections" :key="connection.id")
    Connection(:connection="connection")
.labels
  template(v-for="connection in connections" :key="connection.id")
    ConnectionLabel(:connection="connection")
</template>

<style lang="stylus">
svg.current-connection,
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
