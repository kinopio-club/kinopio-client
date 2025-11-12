<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useLineStore } from '@/stores/useLineStore'

import Line from '@/components/Line.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const lineStore = useLineStore()

const lines = computed(() => lineStore.getAllLines)
</script>

<template lang="pug">
.lines
  template(v-for="line in lines" :key="line.id")
    Line(:line="line")
</template>

<style lang="stylus">
.lines
  position absolute
  pointer-events none
  width 100%
  height 100%
  top 0
  left 0
</style>
