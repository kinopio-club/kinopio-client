<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

import utils from '@/utils.js'

const dialog = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['updateCount'])

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const state = reactive({
  count: 0,
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialog.value
  state.dialogHeight = utils.elementHeight(element)
}

const themeName = computed(() => store.state.currentUser.theme)
const incrementBy = () => {
  state.count = state.count + 1
  emit('updateCount', state.count)
  // store.dispatch('themes/isSystem', false)
}
</script>

<template lang="pug">
dialog.narrow.dialog-name(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p blank dialog, please duplicate
  section
    button(@click="incrementBy")
      span Count is: {{ state.count }}
    p Current theme is: {{ themeName }}
</template>

<style lang="stylus">
// .dialog-name
</style>
