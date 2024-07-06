<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const emit = defineEmits(['updateCount'])

// const props = defineProps({
//   visible: Boolean
// })
const state = reactive({
  count: 0,
  dialogHeight: null
})

const visible = computed(() => store.state.spaceUserListIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    console.log('🌺🌺🌺', store.state.spaceUserListUsers, store.state.spaceUserListIsSpectators)
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  let element = dialogElement.value
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
dialog.narrow.space-user-list(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p blank dialog, please duplicate
  section
    button(@click="incrementBy")
      span Count is: {{ state.count }}
    p Current theme is: {{ themeName }}
</template>

<style lang="stylus">
.space-user-list
  left initial
  right 16px
  top 20px

</style>
