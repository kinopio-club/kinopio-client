<script setup>
// TODO currently unused, use for future card timer progress
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const emit = defineEmits(['animationEnd'])

const props = defineProps({
  visible: {
    type: Boolean,
    default: () => {
      return true
    }
  },
  isStatic: {
    type: Boolean,
    default: () => {
      return false
    }
  }
})
</script>

<template lang="pug">
.circle-progress(v-if="props.visible")
  .circle
</template>

<style lang="stylus">
.circle-progress
  --border-size 18px
  --circle-size calc(var(--border-size) - 2px)

  display block
  width var(--border-size)
  height var(--border-size)
  border 1px solid var(--primary)
  border-radius 100px
  overflow hidden
  position relative
  .circle
    position absolute
    left -10px

    width var(--circle-size)
    height var(--circle-size)
    background var(--primary)
    border-radius 100px

    // animate
    // -16px to 0
    // calc(var(--circle-size) * -1)

</style>
