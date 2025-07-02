<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useSpaceStore } from '@/stores/useSpaceStore'

const spaceStore = useSpaceStore()

const props = defineProps({
  command: String
})

const isMoonPhase = computed(() => {
  return props.command === 'moonPhase'
})
const moonPhase = computed(() => {
  if (!isMoonPhase.value) { return }
  return spaceStore.moonPhase
})
</script>

<template lang="pug">
span.system-command-icon
  //- 🌑
  img.icon.moon-phase(v-if="moonPhase === 'new-moon'" src="@/assets/moon-phases/new-moon.svg")
  //- 🌒
  img.icon.moon-phase(v-else-if="moonPhase === 'waxing-crescent'" src="@/assets/moon-phases/waxing-crescent.svg")
  //- 🌓
  img.icon.moon-phase(v-else-if="moonPhase === 'waxing-quarter'" src="@/assets/moon-phases/waxing-quarter.svg")
  //- 🌔
  img.icon.moon-phase(v-else-if="moonPhase === 'waxing-gibbous'" src="@/assets/moon-phases/waxing-gibbous.svg")
  //- 🌕
  img.icon.moon-phase(v-else-if="moonPhase === 'full-moon'" src="@/assets/moon-phases/full-moon.svg")
  //- 🌖
  img.icon.moon-phase(v-else-if="moonPhase === 'waning-gibbous'" src="@/assets/moon-phases/waning-gibbous.svg")
  //- 🌗
  img.icon.moon-phase(v-else-if="moonPhase === 'waning-quarter'" src="@/assets/moon-phases/waning-quarter.svg")
  //- 🌘
  img.icon.moon-phase(v-else-if="moonPhase === 'waning-crescent'" src="@/assets/moon-phases/waning-crescent.svg")
</template>

<style lang="stylus">
</style>
