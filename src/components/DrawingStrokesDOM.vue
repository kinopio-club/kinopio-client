<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()

// const props = defineProps({
//   paths: Array
// })

const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
</script>

<template lang="pug">
p hi
</template>

<style lang="stylus">
</style>
