<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import AboutGroups from '@/components/subsections/AboutGroups.vue'
import utils from '@/utils.js'

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean
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
</script>

<template lang="pug">
dialog.narrow.about-groups(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  //- section
  //-   p About Groups
  AboutGroups
</template>

<style lang="stylus">
dialog.about-groups
  right 0
  left initial
  bottom 25px
  top initial !important
</style>
