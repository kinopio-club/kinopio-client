<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

// const themeName = computed(() => store.state.currentUser.theme)
</script>

<template lang="pug">
.space-background-gradients(v-if="visible")
  .gradients-layer.layer-1(style='background: radial-gradient(at 35.211765% 134.309804%, rgb(92, 37, 245) 0%, rgba(255, 255, 255, 0) 80%); ')
  .gradients-layer.layer-2(style='background: radial-gradient(at 64.035294% 80.505882%, rgb(155, 79, 147) 0%, rgba(255, 255, 255, 0) 80%); ')
  .gradients-layer.layer-3(style='background: radial-gradient(at 100.545098% 117.290196%, rgb(182, 185, 214) 0%, rgba(255, 255, 255, 0) 80%); ')
  .gradients-layer.layer-4(style='background: radial-gradient(at 48.662745% 31.643137%, rgb(58, 120, 58) 0%, rgba(255, 255, 255, 0) 80%); ')
  .gradients-layer.layer-5(style='background: radial-gradient(at 70.623529% 39.329412%, rgb(15, 243, 72) 0%, rgba(255, 255, 255, 0) 80%); ')
  .gradients-layer.layer-6(style='background: radial-gradient(at 116.741176% 62.388235%, rgb(224, 202, 114) 0%, rgba(255, 255, 255, 0) 80%); ')
  .gradients-layer.layer-7(style='background: rgb(116, 38, 247);')
</template>

<style lang="stylus">
.space-background-gradients
  overflow hidden
  position absolute
  width 100%
  height 100%
  pointer-events none
  z-index 0
  transform-origin top left
  background var(--primary-background)

  .gradients-layer
    // 7 layers
    position absolute
    height 100%
    width 100%
    transition opacity 8000ms
    // background: radial-gradient(at 35.211765% 134.309804%, rgb(92, 37, 245) 0%, rgba(255, 255, 255, 0) 80%);

  .layer-1
    opacity 0
    z-index 100
  .layer-2
    opacity 1
    z-index 99
  .layer-3
    opacity 0
    z-index 98
  .layer-4
    opacity 1
    z-index 97
  .layer-5
    opacity 0
    z-index 96
  .layer-6
    opacity 1
    z-index 95
  .layer-7
    // non radial gradient
    transition background 4000ms
    opacity 1
    z-index 5
</style>
