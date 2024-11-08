<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import AddSpace from '@/components/dialogs/AddSpace.vue'
const store = useStore()

const emit = defineEmits(['closeDialogs', 'addSpace'])

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'closeAllDialogs') {
      closeAllDialogs()
    } else if (mutation.type === 'triggerCloseChildDialogs') {
      closeAllDialogs()
    } else if (mutation.type === 'triggerAddSpaceIsVisible') {
      updateAddSpaceIsVisible(true)
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
const updateAddSpaceIsVisible = (value) => {
  state.addSpaceIsVisible = value
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

// emits

const closeDialogs = () => {
  emit('closeDialogs')
}
const addSpace = () => {
  emit('addSpace')
}
</script>

<template lang="pug">
.button-wrap.add-space-button
  button.success(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: state.addSpaceIsVisible }")
    img.icon.add(src="@/assets/add.svg")
    span New
  AddSpace(:visible="state.addSpaceIsVisible" :shouldAddSpaceDirectly="!props.parentIsInDialog" @closeDialogs="closeDialogs" @addSpace="addSpace")
</template>

<style lang="stylus">
// .component-name
</style>
