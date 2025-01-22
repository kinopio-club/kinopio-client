<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'

const store = useStore()

let unsubscribe

onMounted(() => {
  // updateOperations()
  // unsubscribe = store.subscribe(mutation => {
  //   if (mutation.type === 'currentSpace/changeSpace') {
  //     clearOperations()
  //   }
  // })
})
onBeforeUnmount(() => {
  // unsubscribe()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    // update()
  }
})

const state = reactive({
})

const update = async () => {
}
</script>

<template lang="pug">
template(v-if="props.visible")
  section.minimap
    .row.title-row
      div
        span Minimap
  //- section.results-section.minimap
</template>

<style lang="stylus">
// section.minimap
</style>
