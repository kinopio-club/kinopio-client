<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch } from 'vue'
import { useStore } from 'vuex'

import MultipleConnectionsPicker from '@/components/dialogs/MultipleConnectionsPicker.vue'
import ConnectionDecorators from '@/components/ConnectionDecorators.vue'

import uniq from 'lodash-es/uniq'
import uniqBy from 'lodash-es/uniqBy'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  connections: Array,
  canEditAll: Object,
  backgroundColor: String,
  label: String
})
const emit = defineEmits(['closeDialogs'])
const state = reactive({
  multipleConnectionsPickerVisible: false
})

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs' && props.visible) {
      closeDialogs()
    }
  })
})

const toggleMultipleConnectionsPickerVisible = () => {
  const isVisible = state.multipleConnectionsPickerVisible
  closeDialogsAndEmit()
  state.multipleConnectionsPickerVisible = !isVisible
}

// connection types

const connectionTypes = computed(() => {
  let types = uniq(store.state.multipleConnectionsSelectedIds)
  types = types.map(id => {
    const connection = store.getters['currentConnections/byId'](id)
    if (!connection) { return }
    return store.getters['currentConnections/typeByTypeId'](connection.connectionTypeId)
  })
  types = types.filter(type => Boolean(type))
  types = uniqBy(types, 'id')
  types = uniqBy(types, 'color')
  return types
})
const editableConnectionTypes = computed(() => {
  return uniq(props.connections.map(connection => {
    return store.getters['currentConnections/typeByTypeId'](connection.connectionTypeId)
  }))
})

// utils

const closeDialogsAndEmit = () => {
  closeDialogs()
  emit('closeDialogs')
}
const closeDialogs = () => {
  state.multipleConnectionsPickerVisible = false
}

</script>

<template lang="pug">
section.subsection.connection-actions(v-if="visible")
  p.subsection-vertical-label(:style="{ background: backgroundColor }")
    span {{label}}
  .row.edit-connection-types
    //- Type Color
    .button-wrap
      button.change-color(:disabled="!canEditAll.connections" @click.left.stop="toggleMultipleConnectionsPickerVisible" :class="{active: state.multipleConnectionsPickerVisible}")
        .segmented-colors.icon
          template(v-for="type in connectionTypes")
            .current-color(:style="{ background: type.color }")
        span Type
      MultipleConnectionsPicker(:visible="state.multipleConnectionsPickerVisible" :selectedConnections="connections" :selectedConnectionTypes="editableConnectionTypes")
    //- Arrows or Label
    ConnectionDecorators(:connections="connections")
</template>

<style lang="stylus">
dialog section.connection-actions
  position relative
  padding 4px
  padding-bottom 0
  background-color transparent
  border 1px solid var(--primary-border)
  padding 4px
  padding-bottom 0
  .row
    margin-top 0
  .button-wrap
    margin-left 0
    margin-right 4px
    vertical-align middle
    margin-bottom 10px
</style>
