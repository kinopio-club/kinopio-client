<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

</script>

<template lang="pug">
//- teleport targets
#locked-boxes.locked-boxes
#locked-cards.locked-cards
</template>

<style lang="stylus">
.locked-boxes,
.locked-cards
  transform-origin top left
</style>
