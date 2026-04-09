<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'

const userStore = useUserStore()

const emit = defineEmits(['selectLine'])

const props = defineProps({
  lines: Array
})

const lineColorClasses = (line) => {
  return utils.colorClasses({ backgroundColor: line.color })
}
const select = (line) => {
  emit('selectLine', line)
}
</script>

<template lang="pug">
.line-list(v-if="props.lines.length")
  .row(v-for="line in props.lines" :key="line.id")
    .badge.button-badge(:style="{background: line.color}" :class="lineColorClasses(line)" @click="select(line)")
      span {{ line.name }}
    .badge-horizontal-line(:style="{ background: line.color }")
</template>

<style lang="stylus">
.line-list
  display flex
  flex-wrap wrap
  row-gap 10px
  .row
    width 100%
    position relative
    margin 0
  .badge
    text-align left
    margin 0
    z-index 1
    max-width 90%
  .badge-horizontal-line
    position absolute
    left 0
    top 11px
    width 100%
    height 1px
</style>
