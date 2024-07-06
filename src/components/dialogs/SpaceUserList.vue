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

const state = reactive({
  dialogHeight: null
})

const visible = computed(() => store.state.spaceUserListIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    console.log('🌺🌺🌺', store.state.spaceUserListUsers, isSpectators.value)
    updateDialogHeight()
  }
})

const isSpectators = computed(() => store.state.spaceUserListIsSpectators)

const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

</script>

<template lang="pug">
dialog.narrow.space-user-list(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p(v-if="isSpectators") Spectators
    p(v-if="!isSpectators") Collaborators
  section
    p asdf
  section
    p Other Cards Added By
</template>

<style lang="stylus">
.space-user-list
  left initial
  right 16px
  top 20px
</style>
