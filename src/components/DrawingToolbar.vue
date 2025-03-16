<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'

const store = useStore()

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  count: 0
})
</script>

<template lang="pug">

//- Drawing toolbar
.segmented-buttons.tool-toolbar-buttons(v-if="props.visible")
  button
    span B
  button
    span C

</template>

<style lang="stylus" scoped>
.tool-toolbar-buttons
  position absolute
  top 0
  left 20px
</style>
