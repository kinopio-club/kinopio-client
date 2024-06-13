<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// import utils from '@/utils.js'

// adapted from https://codepen.io/pillowmermaid/details/xrwVPQ

onMounted(() => {
  store.subscribe(mutation => {
    // trigger sonar pos
    // if (mutation.type === 'triggerUpdateOtherCard') {
    //   mutation.payload
    // }
  })
})

// const state = reactive({
//   count: 0
// })

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)

</script>

<template lang="pug">
aside
  canvas#sonar(
    :width="viewportWidth"
    :height="viewportHeight"
  )
</template>

<style lang="stylus" scoped>
canvas
  background-color pink
  // pointer-events none
  position fixed
  top 0
</style>
