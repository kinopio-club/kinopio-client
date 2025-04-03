<script setup>
import { reactive, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'

import MultipleConnectionsPicker from '@/components/dialogs/MultipleConnectionsPicker.vue'
import ConnectionDecorators from '@/components/ConnectionDecorators.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'
import uniqBy from 'lodash-es/uniqBy'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  connections: Array,
  canEditAll: Object,
  canEdit: Boolean,
  backgroundColor: String,
  label: String,
  hideType: Boolean
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

const colorClasses = computed(() => {
  return utils.colorClasses({ backgroundColor: props.backgroundColor })
})
const toggleMultipleConnectionsPickerVisible = () => {
  const isVisible = state.multipleConnectionsPickerVisible
  closeDialogsAndEmit()
  state.multipleConnectionsPickerVisible = !isVisible
}

// connection types

const canEditAllConnections = computed(() => {
  return props.canEdit || props.canEditAll.connections
})
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
section.subsection.connection-actions(v-if="props.visible" :class="colorClasses")
  p.subsection-vertical-label(v-if="props.label" :style="{ background: props.backgroundColor }")
    span.label(:class="colorClasses") {{ props.label }}
  .row.edit-connection-types
    //- Type Color
    .button-wrap(v-if="!props.hideType")
      button.change-color(:disabled="!canEditAllConnections" @click.left.stop="toggleMultipleConnectionsPickerVisible" :class="{active: state.multipleConnectionsPickerVisible}")
        .segmented-colors.icon
          template(v-for="type in connectionTypes")
            .current-color(:style="{ background: type.color }")
        span Type
      MultipleConnectionsPicker(:visible="state.multipleConnectionsPickerVisible" :selectedConnections="props.connections" :selectedConnectionTypes="editableConnectionTypes")
    //- Arrows or Label
    ConnectionDecorators(:connections="props.connections")
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
  &.is-background-light
    border-color var(--primary-border-on-light-background) !important
  &.is-background-dark
    border-color var(--primary-border-on-dark-background) !important

  .row
    margin-top 0
  .button-wrap
    margin-left 0
    margin-right 4px
    vertical-align middle
    margin-bottom 4px
  .label
    &.is-background-light
      color var(--primary-on-light-background)
    &.is-background-dark
      color var(--primary-on-dark-background)

</style>
