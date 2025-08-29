<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useSpaceStore } from '@/stores/useSpaceStore'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

import cache from '@/cache.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()
const analyticsStore = useAnalyticsStore()
const userStore = useUserStore()

const emit = defineEmits(['closeDialogs', 'addSpace'])

const props = defineProps({
  parentIsInDialog: Boolean,
  isSmall: Boolean
})

// add space

const shouldAddSpaceDirectly = computed(() => !props.parentIsInDialog)
const addNewSpace = async (event) => {
  if (userStore.checkIfShouldPreventNewSpace(event)) {
    return
  }
  if (event.metaKey || event.ctrlKey) {
    window.open('/new') // opens url in new tab
    globalStore.preventDraggedCardFromShowingDetails = true
    return
  } else {
    event.preventDefault()
    event.stopPropagation()
  }
  globalStore.isLoadingSpace = true
  const cachedSpaces = await cache.getAllSpaces()
  const noUserSpaces = !cachedSpaces.length
  window.scrollTo(0, 0)
  if (noUserSpaces) {
    window.location.href = '/'
  } else {
    emitAll()
  }
  if (shouldAddSpaceDirectly.value) {
    globalStore.closeAllDialogs()
    await spaceStore.createSpace()
    globalStore.triggerSpaceDetailsInfoIsVisible()
  }
  analyticsStore.event('AddSpaceButton')
}

// emits

const emitAll = () => {
  closeDialogs()
  addSpace()
}
const closeDialogs = () => {
  emit('closeDialogs')
}
const addSpace = () => {
  emit('addSpace')
}
</script>

<template lang="pug">
.button-wrap
  .add-space-buttons
    a(href="/new" @click.left.stop.prevent="addNewSpace" title="New Space (N)")
      button.success(:class="{ 'small-button': props.isSmall }")
        img.icon.add(src="@/assets/add.svg")
</template>

<style lang="stylus">
.add-space-buttons
  img.down-arrow
    padding 0
    vertical-align 2px
</style>
