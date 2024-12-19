<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Box from '@/components/Box.vue'
import BoxSnapGuide from '@/components/BoxSnapGuide.vue'
const store = useStore()

const isPainting = computed(() => store.state.currentUserIsPainting)
const unlockedBoxes = computed(() => store.getters['currentBoxes/isNotLocked'])
const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)
</script>

<template lang="pug">
.boxes(:class="{unselectable: isPainting}")
  //- locked boxes rendered in ItemsLocked
  template(v-for="box in unlockedBoxes")
    Box(:box="box")
    BoxSnapGuide(:box="box")
</template>

<style lang="stylus">
.boxes
  position absolute
  top 0
  z-index 0
</style>
