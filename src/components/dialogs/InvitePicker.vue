<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

// import { useGlobalStore } from '@/stores/useGlobalStore'
// import { useCardStore } from '@/stores/useCardStore'
// import { useUserStore } from '@/stores/useUserStore'
// import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import invite from '@/data/invite.js'

// const globalStore = useGlobalStore()
// const cardStore = useCardStore()
// const userStore = useUserStore()
// const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['closeDialogs', 'select'])

const props = defineProps({
  visible: Boolean,
  inviteType: String
})

const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const inviteState = computed(() => {
  return invite.states().find(item => item.type === props.inviteType)
})
const friendlyName = computed(() => inviteState.value.friendlyName)

</script>

<template lang="pug">
dialog.narrow.dialog-name(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p alsdkfj
</template>

<style lang="stylus">
// dialog.dialog-name
</style>
