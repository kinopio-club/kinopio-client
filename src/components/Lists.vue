<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useListStore } from '@/stores/useListStore'

import List from '@/components/List.vue'

const globalStore = useGlobalStore()
const listStore = useListStore()

const lists = computed(() => listStore.getAllLists)
</script>

<template lang="pug">
.lists
  template(v-for="list in lists" :key="list.id")
    List(:list="list")
</template>

<style lang="stylus">
.lists
  position absolute
  top 0
  z-index 0
</style>
