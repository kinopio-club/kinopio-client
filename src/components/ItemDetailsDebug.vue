<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import consts from '@/consts.js'

const props = defineProps({
  item: Object,
  keys: {
    type: Array,
    default: () => []
  }
})

const visible = computed(() => consts.isDevelopment())

</script>

<template lang="pug">
.badge.info.item-details-debug(v-if="visible")
  table
    tbody
      tr
        td id
        td {{ props.item.id }}
      tr(v-for="key in props.keys")
        td {{ key }}
        td {{ props.item[key] }}
</template>

<style lang="stylus">
.item-details-debug
  table
    margin 0
</style>
