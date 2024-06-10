<script setup>

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  card: Object
})

const counterValue = computed(() => props.card.counterValue || 0)

const increment = () => {
  const count = counterValue.value + 1
  const card = {
    id: props.card.id,
    counterValue: count
  }
  store.dispatch('currentCards/updateCounter', { card, shouldIncrement: true })
}
const decrement = () => {
  let count = counterValue.value - 1
  count = Math.max(0, count)
  const card = {
    id: props.card.id,
    counterValue: count
  }
  store.dispatch('currentCards/updateCounter', { card, shouldDecrement: true })
}
</script>

<template lang="pug">
.card-counter(v-if="props.card.counterIsVisible")
  .segmented-buttons.counter-buttons
    //- -
    button.small-button(@click="decrement" @touchend="decrement")
      img.icon.minus(src="@/assets/minus.svg")
    //- +
    button.small-button(@click="increment" @touchend="increment")
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
