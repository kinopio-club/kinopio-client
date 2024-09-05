<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Card from '@/components/Card.vue'
import Box from '@/components/Box.vue'
const store = useStore()

const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)
const lockedCards = computed(() => store.getters['currentCards/isLocked'])
const lockedBoxes = computed(() => store.getters['currentBoxes/isLocked'])
const positionStyles = computed(() => {
  return {
    transform: store.getters.zoomTransform
  }
})
</script>

<template lang="pug">
//- boxes
#locked-boxes.locked-boxes(:style="positionStyles")
  template(v-for="box in lockedBoxes" :key="box.id")
    Box(:box="box")
//- cards
#locked-cards.locked-cards(:style="positionStyles")
  template(v-for="card in lockedCards" :key="card.id")
    Card(:card="card")
</template>

<style lang="stylus">
.locked-boxes,
.locked-cards
  transform-origin top left
</style>
