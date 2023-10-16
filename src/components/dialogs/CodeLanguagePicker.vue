<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import codeLanguages from '@/data/codeLanguages.json'
import utils from '@/utils.js'

const store = useStore()

const dialog = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean,
  parentCardId: String,
  currentLanguage: String
})
const emit = defineEmits(['updateLanguage'])

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    console.log('🌍🌍🌍🌍')
  }
})

const state = reactive({
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialog.value
  state.dialogHeight = utils.elementHeight(element)
}

// const themeName = computed(() => store.state.currentUser.theme)
// const incrementBy = () => {
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }
</script>

<template lang="pug">
dialog.narrow.code-language-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}")

  section
    p blank dialog, please duplicate
  //- section
  //-   button(@click="incrementBy")
  //-     span Count is: {{ state.count }}
  //-   p Current theme is: {{ themeName }}
</template>

<style lang="stylus">
.code-language-picker
  position absolute
  top 0
  left 8px
</style>
