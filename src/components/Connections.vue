<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useConnectionStore } from '@/stores/useConnectionStore'

import Connection from '@/components/Connection.vue'
import CurrentConnection from '@/components/CurrentConnection.vue'
import ConnectionLabel from '@/components/ConnectionLabel.vue'

const store = useStore()
const connectionStore = useConnectionStore()

const currentConnectionStartItemIds = computed(() => store.state.currentConnectionStartItemIds)
const remoteCurrentConnections = computed(() => store.state.remoteCurrentConnections)
const connections = computed(() => connectionStore.getAllConnections)
</script>

<template lang="pug">
template(v-for="startItemId in currentConnectionStartItemIds")
  CurrentConnection(:startItemId="startItemId")
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
</style>
