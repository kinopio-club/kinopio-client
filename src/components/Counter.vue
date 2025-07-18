<template lang="pug">
.counter
  h2 Counter Example
  .counter-display
    span.count {{ count }}
  .counter-buttons
    button(@click="decrement") -
    button(@click="reset") Reset
    button(@click="increment") +
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}
</script>
