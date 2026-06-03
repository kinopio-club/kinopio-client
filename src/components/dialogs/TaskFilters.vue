<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

const globalStore = useGlobalStore()

let unsubscribes

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerClearTaskFilters') {
        clearAllFilters()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateShouldShowCompleted'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  shouldShowCompleted: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

watch(() => state.shouldShowCompleted, (value, prevValue) => {
  emit('updateShouldShowCompleted', value)
})

const clearAllFilters = () => {
  state.shouldShowCompleted = false
}

const toggleShouldShowCompleted = () => {
  state.shouldShowCompleted = !state.shouldShowCompleted
}
const totalFiltersIsActive = computed(() => {
  return state.shouldShowCompleted // ||
})
</script>

<template lang="pug">
dialog.narrow.task-filters(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      div
        span Task Filters
        Loader(:visible="props.isLoading" :isSmall="true")
      button.small-button(@click.left="clearAllFilters" title="Clear all task filters")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear
        span.badge.info.filter-is-active(v-if="totalFiltersIsActive")
  section
    .button-wrap(@click.left.prevent="toggleShouldShowCompleted" @keydown.stop.enter="toggleShouldShowCompleted")
      label(:class="{ active: state.shouldShowCompleted }")
        input(type="checkbox" v-model="state.shouldShowCompleted")
        span Show Completed

</template>

<style lang="stylus">
dialog.task-filters
  left initial
  right 0
</style>
