<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    state.queue = cache.queue()
    checkIfShouldBeOnRightSide()
  }
})

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      checkIfShouldBeOnRightSide()
    }
  })
})

const state = reactive({
  queue: [],
  showOnRightSide: false
})

const currentUserIsSignedIn = computed(() => {
  return Boolean(store.getters['currentUser/isSignedIn'])
})
const pluralChanges = computed(() => {
  const condition = state.queue.length !== 1
  return utils.pluralize('change', condition)
})
const checkIfShouldBeOnRightSide = async () => {
  state.showOnRightSide = false
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.showOnRightSide = utils.elementShouldBeOnRightSide(element)
}
</script>

<template lang="pug">
dialog.narrow.offline(v-if="visible" :open="visible" ref="dialogElement" :class="{'right-side': state.showOnRightSide}")
  section
    p Offline
  section(v-if="currentUserIsSignedIn")
    p Kinopio works offline,
    p Your changes will be saved locally, and sync-ed up once you're back online.
    p
      span.badge.info
        img.icon.offline(src="@/assets/offline.svg")
        span {{state.queue.length}} {{pluralChanges}} to sync
  section(v-else)
    p Kinopio works offline,
    p Your changes are saved locally.
</template>

<style lang="stylus" scoped>
.offline
  &.right-side
    left initial
    right 8px
</style>
