<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useLineStore } from '@/stores/useLineStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
// linestore
// prop
</script>

<template lang="pug">
.line.l1(data-id="xyz")
//- .line-badge.l1
</template>

<style lang="stylus">
.line
  pointer-events all
  width 100%
  height 1px
  position absolute
  left 0
  z-index calc(var(--max-z) - 1)
// .line-badge

.l1
  top 200px
  background-color purple
</style>
