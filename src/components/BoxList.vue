<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'

import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'
import utils from '@/utils.js'

const userStore = useUserStore()

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
const canEditBox = (box) => {
  return userStore.getUserCanEditBox(box)
}
const boxIsTodo = (box) => {
  return Boolean(utils.checkboxFromString(box.name))
}
const boxName = (box) => {
  const checkbox = utils.checkboxFromString(box.name)
  if (checkbox) {
    return box.name.replace(checkbox, '')
  } else {
    return box.name
  }
}
</script>

<template lang="pug">
.boxes-list(v-if="props.boxes.length")
  template(v-for="box in props.boxes" :key="box.id")
    .badge.button-badge(:style="{background: box.color}" :class="boxColorClasses(box)" @click="select(box)")
      ItemCheckboxButton(:visible="boxIsTodo(box)" :box="box" :canEditItem="canEditBox(box)" :parentIsList="true")
      span {{boxName(box)}}
</template>

<style lang="stylus">
.boxes-list
  display flex
  flex-wrap wrap
  row-gap 10px
  .badge
    text-align left
</style>
