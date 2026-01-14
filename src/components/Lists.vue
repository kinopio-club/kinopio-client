<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useListsStore } from '@/stores/useListsStore'

import Lists from '@/components/Lists.vue'

const globalStore = useGlobalStore()
const listStore = useListsStore()

const lists = computed(() => listStore.getAllListss)
</script>

<template lang="pug">
.lists
  template(v-for="list in lists" :key="list.id")
    Lists(:list="list")
</template>

<style lang="stylus">
</style>
