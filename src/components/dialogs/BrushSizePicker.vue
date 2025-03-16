<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

// let unsubscribe

// const dialogElement = ref(null)

// onMounted(() => {
//   window.addEventListener('resize', updateDialogHeight)
//   // unsubscribe = store.subscribe(mutation => {
//   //   if (mutation.type === 'abc') {
//   //     xyz()
//   //   }
//   // })
// })
// onBeforeUnmount(() => {
//   window.removeEventListener('resize', updateDialogHeight)
// //   unsubscribe()
// })

const emit = defineEmits(['updateBrushSize'])

const props = defineProps({
  visible: Boolean,
  currentBrushSize: String
})
// const state = reactive({
//   count: 0,
// })

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     updateDialogHeight()
//   }
// })

// const updateDialogHeight = async () => {
//   if (!props.visible) { return }
//   await nextTick()
//   let element = dialogElement.value
//   state.dialogHeight = utils.elementHeight(element)
// }

// const themeName = computed(() => store.state.currentUser.theme)
// const incrementBy = () => {
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }

const isCurrentBrushSize = (value) => {
  return props.currentBrushSize === value
}

</script>

<template lang="pug">
dialog.narrow.brush-size-picker(v-if="props.visible" :open="props.visible" @click.left.stop)
  section
    .row
      .segmented-buttons
        button(:class="{active: isCurrentBrushSize('L')}")
          span L
        button(:class="{active: isCurrentBrushSize('M')}")
          span M
        button(:class="{active: isCurrentBrushSize('S')}")
          span S
    .row
      span [-]
  //- section
    //- p blank dialog, {{props.currentBrushSize}}
  //- section
    //- button(@click="incrementBy")
    //-   span Count is: {{ state.count }}
    //- p Current theme is: {{ themeName }}
</template>

<style lang="stylus">
dialog.brush-size-picker
  width 150px
</style>
