<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'

import cache from '@/cache.js'

const store = useStore()
const spaceStore = useSpaceStore()
const analyticsStore = useAnalyticsStore()

const emit = defineEmits(['closeDialogs', 'addSpace'])

const props = defineProps({
  parentIsInDialog: Boolean,
  isSmall: Boolean
})

// add space

const shouldAddSpaceDirectly = computed(() => !props.parentIsInDialog)
const addNewSpace = async (event) => {
  if (event.metaKey || event.ctrlKey) {
    window.open('/new') // opens url in new tab
    store.commit('preventDraggedCardFromShowingDetails', true)
    return
  } else {
    event.preventDefault()
    event.stopPropagation()
  }
  store.commit('isLoadingSpace', true)
  const cachedSpaces = await cache.getAllSpaces()
  const noUserSpaces = !cachedSpaces.length
  window.scrollTo(0, 0)
  if (noUserSpaces) {
    window.location.href = '/'
  } else {
    emitAll()
  }
  if (shouldAddSpaceDirectly.value) {
    store.dispatch('closeAllDialogs')
    await spaceStore.createSpace()
    store.commit('triggerSpaceDetailsInfoIsVisible')
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
