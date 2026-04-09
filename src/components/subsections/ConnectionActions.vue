<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'

import MultipleConnectionsPicker from '@/components/dialogs/MultipleConnectionsPicker.vue'
import ConnectionDecorators from '@/components/ConnectionDecorators.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'
import uniqBy from 'lodash-es/uniqBy'

const globalStore = useGlobalStore()
const connectionStore = useConnectionStore()
const userStore = useUserStore()

let unsubscribes

const emit = defineEmits(['closeDialogs', 'scrollIntoView'])

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs' && props.visible) {
        closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const props = defineProps({
  visible: Boolean,
  connections: Array,
  canEditAll: Object,
  canEdit: Boolean,
  backgroundColor: String,
  label: String,
  hideType: Boolean,
  collapseExpandIsVisible: Boolean
})
const state = reactive({
  multipleConnectionsPickerVisible: false,
  isHover: false
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
  const ids = globalStore.multipleConnectionsSelectedIds
  let types = ids.map(id => {
    return connectionStore.getConnectionTypeByConnectionId(id)
  })
  types = uniqBy(types, 'id')
  types = uniqBy(types, 'color')
  return types
})
const editableConnectionTypes = computed(() => {
  return uniq(props.connections.map(connection => {
    return connectionStore.getConnectionType(connection.connectionTypeId)
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
const updateIsHover = (value) => {
  state.isHover = value
}
const isHoverVisible = computed(() => {
  return state.isHover && props.collapseExpandIsVisible
})

// collapse/expand

const shouldShowMultipleSelectedLineActions = computed(() => userStore.shouldShowMultipleSelectedLineActions)
const toggleShouldShowMultipleSelectedLineActions = async () => {
  closeDialogs()
  const value = !shouldShowMultipleSelectedLineActions.value
  await userStore.updateUser({
    shouldShowMultipleSelectedLineActions: value
  })
  nextTick(() => {
    emit('scrollIntoView')
  })
}

</script>

<template lang="pug">
section.subsection.connection-actions(
  v-if="props.connections.length"
  :class="colorClasses"
  @pointerover="updateIsHover(true)"
  @pointerleave="updateIsHover(false)"
)
  template(v-if="props.visible")
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
      //- Label, Direction, Reverse, Curved
      ConnectionDecorators(:connections="props.connections")
  //- collapsed horizontal label
  template(v-else)
    .subsection-horizontal-label(@click="toggleShouldShowMultipleSelectedLineActions")
      span {{ props.label }}
  //- collapse/expand button
  .collapse-expand-button-wrap.inline-button-wrap(v-if="props.collapseExpandIsVisible" @click="toggleShouldShowMultipleSelectedLineActions" title="Toggle Connection Line Options")
    button.small-button.inline-button(:class="{active: shouldShowMultipleSelectedLineActions || isHoverVisible}")
      img.icon.down-arrow(src="@/assets/down-arrow.svg")
</template>

<style lang="stylus">
dialog section.connection-actions
  position relative
  padding var(--subsection-padding)
  padding-bottom 0
  background-color transparent
  border 1px solid var(--primary-border)
  padding-bottom 0
  &.is-background-light
    border-color var(--primary-border-on-light-background) !important
  &.is-background-dark
    border-color var(--primary-border-on-dark-background) !important

  .row
    margin-top 0
  .row.edit-connection-types
    margin-bottom 0
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

  .subsection-horizontal-label
    cursor pointer
</style>
