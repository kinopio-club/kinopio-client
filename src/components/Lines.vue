<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Line from '@/components/Line.vue'
const store = useStore()

const isPainting = computed(() => store.state.currentUserIsPainting)
const lines = computed(() => store.getters['currentLines/all'])
</script>

<template lang="pug">
.lines(:class="{unselectable: isPainting}")
  template(v-for="line in lines")
    Line(:line="line")
</template>

<style lang="stylus">
.lines
  position absolute
  top 0
</style>
