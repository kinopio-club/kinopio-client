<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import BoxUnlockButton from '@/components/BoxUnlockButton.vue'
import CardUnlockButton from '@/components/CardUnlockButton.vue'
import utils from '@/utils.js'

const cardStore = useCardStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const props = defineProps({
  visible: Boolean
})

const lockedBoxes = computed(() => boxStore.getBoxesIsLocked)
const lockedCards = computed(() => cardStore.getCardsIsLocked)
const isThemeDark = computed(() => userStore.theme === 'dark')
</script>

<template lang="pug">
BoxUnlockButton(v-for="box in lockedBoxes" :box="box" :key="box.id")
CardUnlockButton(v-for="card in lockedCards" :card="card" :key="card.id")
</template>

<style lang="stylus">
// .component-name
</style>
