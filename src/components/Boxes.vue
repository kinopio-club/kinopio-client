<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Box from '@/components/Box.vue'
import BoxSnapGuide from '@/components/BoxSnapGuide.vue'
const store = useStore()

const isPainting = computed(() => store.state.currentUserIsPainting)
const unlockedBoxes = computed(() => store.getters['currentBoxes/isNotLocked'])
const lockedBoxes = computed(() => store.getters['currentBoxes/isLocked'])
</script>

<template lang="pug">
.boxes(:class="{unselectable: isPainting}")
  template(v-for="box in unlockedBoxes" :key="box.id")
    Box(:box="box")
    BoxSnapGuide(:box="box")
  //- locked boxes rendered in ItemsLocked
  template(v-for="box in lockedBoxes" :key="box.id")
    teleport(to="#locked-boxes")
      Box(:box="box")
</template>

<style lang="stylus">
.boxes
  position absolute
  top 0
  z-index 0
</style>
