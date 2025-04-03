<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import AddSpace from '@/components/dialogs/AddSpace.vue'
import cache from '@/cache.js'

const store = useStore()

const emit = defineEmits(['closeDialogs', 'addSpace'])

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'closeAllDialogs') {
      closeAllDialogs()
    } else if (mutation.type === 'triggerCloseChildDialogs') {
      closeAllDialogs()
    }
  })
})

const props = defineProps({
  parentIsInDialog: Boolean
})

const state = reactive({
  addSpaceIsVisible: false
})

const closeAllDialogs = () => {
  state.addSpaceIsVisible = false
}
const toggleAddSpaceIsVisible = () => {
  const isVisible = state.addSpaceIsVisible
  if (props.parentIsInDialog) {
    closeDialogs()
  } else {
    store.dispatch('closeAllDialogs')
  }
  state.addSpaceIsVisible = !isVisible
}

// add space

const shouldAddSpaceDirectly = computed(() => !props.parentIsInDialog)
const addNewSpace = async (event) => {
  if (event.metaKey || event.ctrlKey) {
    window.open('/new') // opens url in new tab
    store.commit('preventDraggedCardFromShowingDetails', true)
    return
  } else {
    event.preventDefault()
    event.stopPropagation()
  }
  store.commit('isLoadingSpace', true)
  const cachedSpaces = await cache.getAllSpaces()
  const noUserSpaces = !cachedSpaces.length
  window.scrollTo(0, 0)
  if (noUserSpaces) {
    window.location.href = '/'
  } else {
    emitAll()
  }
  if (shouldAddSpaceDirectly.value) {
    store.dispatch('closeAllDialogs')
    await store.dispatch('currentSpace/addSpace')
    store.commit('triggerSpaceDetailsInfoIsVisible')
  }
  store.dispatch('analytics/event', 'AddSpaceButtons')
}

// emits

const emitAll = () => {
  closeDialogs()
  addSpace()
}
const closeDialogs = () => {
  emit('closeDialogs')
}
const addSpace = () => {
  emit('addSpace')
}
</script>

<template lang="pug">
.button-wrap
  .segmented-buttons.add-space-buttons
    a(href="/new" @click.left.stop.prevent="addNewSpace" title="New Space (N)")
      button.success
        img.icon.add(src="@/assets/add.svg")
    button.success(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: state.addSpaceIsVisible }" title="New Space Options")
      img.icon.down-arrow(src="@/assets/down-arrow.svg")
  AddSpace(:visible="state.addSpaceIsVisible" :shouldAddSpaceDirectly="shouldAddSpaceDirectly" @closeDialogs="closeDialogs" @addSpace="addSpace")
</template>

<style lang="stylus">
.add-space-buttons
  img.down-arrow
    padding 0
    vertical-align 2px
</style>
