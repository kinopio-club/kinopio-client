<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
const store = useStore()

let prevPosition

let unsubscribe

onMounted(() => {
  updateOperations()
  window.addEventListener('pointerdown', updatePrevPosition)
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'currentSpace/changeSpace') {
      clearOperations()
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', updatePrevPosition)
  unsubscribe()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateOperations()
  }
})

const state = reactive({
  operations: [],
  selectedOperationIds: {},
  isLoading: false,
  unknownServerError: false
})

const isOnline = computed(() => store.state.isOnline)
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const updatePrevPosition = (event) => {
  if (!props.visible) { return }
  prevPosition = utils.cursorPositionInPage(event)
}
const clearOperations = () => {
  state.operations = []
}

// operations

const updateOperations = async () => {
  state.unknownServerError = false
  if (state.isLoading) { return }
  try {
    state.isLoading = true
    state.operations = await store.dispatch('api/getSpaceHistory')
    console.log('🍇🍇🍇', state.operations)
    // api/
  } catch (error) {
    console.error('🚒 updateOperations', error)
    state.unknownServerError = true
  }
  state.isLoading = false
}

const select = (operation) => {
  console.log(operation)
  state.selectedOperationIds[operation.id] = true
  // const isSelected = state.selectedOperationIds.includes(operation.id)
  // if (isSelected) {
  // }
}

const isSelected = (operation) => {
  return Boolean(state.selectedOperationIds[operation.id])
}

</script>

<template lang="pug">
section.debug(v-if="visible")
  .row.title-row
    div
      span.badge.info Beta
      span Space History Log
      Loader(:visible="state.isLoading" :isSmall="true")
    //- .button-wrap
    //-   button.small-button(@click="loadInboxSpace")
    //-     img.icon(src="@/assets/inbox.svg")
    //-     span Inbox
  OfflineBadge

section.results-section
  ul.results-list
    template(v-for="operation in state.operations" :key="operation.id")
      li(@click="select(operation)") {{operation.name}}
        template(v-if="isSelected(operation)")
          p {{operation}}
</template>

<style lang="stylus">
section.debug
  .loader
    margin-left 6px
    vertical-align -2px
  li
    flex-direction column
</style>
