<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import utils from '@/utils.js'

const emit = defineEmits(['selectBox'])

const props = defineProps({
  boxes: Array
})

const boxColorClasses = (box) => {
  return utils.colorClasses({ backgroundColor: box.color })
}
const select = (box) => {
  emit('selectBox', box)
}
</script>

<template lang="pug">
.row.boxes-list(v-if="props.boxes.length")
  template(v-for="box in props.boxes" :key="box.id")
    .badge.button-badge(:style="{background: box.color}" :class="boxColorClasses(box)" @click="select(box)")
      span {{box.name}}
</template>

<style lang="stylus">
.row.boxes-list
  flex-wrap wrap
  .badge
    margin-bottom 10px
    text-align left
</style>
