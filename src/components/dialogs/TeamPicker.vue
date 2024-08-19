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

const emit = defineEmits(['selectTeam'])

const props = defineProps({
  visible: Boolean,
  teams: Array
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const state = reactive({
  dialogHeight: null
})

// const themeName = computed(() => store.state.currentUser.theme)
// const incrementBy = () => {
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }
</script>

<template lang="pug">
dialog.narrow.team-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p team picker,
    //- @select team, save user.prevSpaceTeamId, cache
    //- use in spacedetailsinfo toggleCurrentSpaceInTeam
</template>

<style lang="stylus">
// dialog.team-picker
</style>
