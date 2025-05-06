<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useCardStore } from '@/stores/useCardStore'

import BoxUnlockButton from '@/components/BoxUnlockButton.vue'
import CardUnlockButton from '@/components/CardUnlockButton.vue'
import utils from '@/utils.js'

const store = useStore()
const cardStore = useCardStore()

const props = defineProps({
  visible: Boolean
})

const lockedBoxes = computed(() => store.getters['currentBoxes/isLocked'])
const lockedCards = computed(() => {
  const cards = cardStore.getAllCards
  return cardStore.getCardsIsLocked(cards)
})
const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
</script>

<template lang="pug">
BoxUnlockButton(v-for="box in lockedBoxes" :box="box" :key="box.id")
CardUnlockButton(v-for="card in lockedCards" :card="card" :key="card.id")
</template>

<style lang="stylus">
// .component-name
</style>
