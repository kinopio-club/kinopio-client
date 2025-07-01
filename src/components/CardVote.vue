<script setup>
// todo replace with CardEmojis

import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'

const cardStore = useCardStore()
const globalStore = useGlobalStore()

const props = defineProps({
  card: Object
})

const counterValue = computed(() => props.card.counterValue || 0)

const isDecrementDisabled = computed(() => {
  if (props.card.isLocked) { return true }
  return globalStore.getShouldPreventCardVote({
    cardId: props.card.id,
    shouldDecrement: true
  })
})
const isIncrementDisabled = computed(() => {
  if (props.card.isLocked) { return true }
  return globalStore.getShouldPreventCardVote({
    cardId: props.card.id,
    shouldIncrement: true
  })
})

const increment = () => {
  const count = counterValue.value + 1
  const card = {
    id: props.card.id,
    counterValue: count
  }
  cardStore.updateCardVote({ card, shouldIncrement: true })
}
const decrement = () => {
  let count = counterValue.value - 1
  count = Math.max(0, count)
  const card = {
    id: props.card.id,
    counterValue: count
  }
  cardStore.updateCardVote({ card, shouldDecrement: true })
}
</script>

<template lang="pug">
.card-counter(v-if="props.card.counterIsVisible")
  .segmented-buttons.counter-buttons
    //- -
    button.small-button(@click="decrement" @touchend="decrement" :disabled="isDecrementDisabled")
      img.icon.minus(src="@/assets/minus.svg")
    //- +
    button.small-button(@click="increment" @touchend="increment" :disabled="isIncrementDisabled")
      img.icon.plus(src="@/assets/add.svg")
  //- count
  .badge.info.counter {{counterValue}}
</template>

<style lang="stylus">
.card-counter
  display flex
  min-width 68px
  width max-content
  .counter-buttons
    margin-right 5px
    button
      height 22px
      min-width 22px
      .minus
        width 8px
        vertical-align 4px
        margin-left 2px
  .badge.counter
    margin-left -5px
</style>
