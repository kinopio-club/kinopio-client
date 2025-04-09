<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'

// import utils from '@/utils.js'

const store = useStore()

const state = reactive({
  isGeneratingPreview: true
})

const isOnline = computed(() => store.state.isOnline)
</script>

<template lang="pug">
section.generate-space(v-if="isOnline")
  input(placeholder="Type to generate a space")
  button(:class="{active: state.isGeneratingPreview}")
    span Preview
    Loader(:visible="state.isGeneratingPreview")
</template>

<style lang="stylus">
// .component-name
</style>
