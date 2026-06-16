<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

import UserLabelInline from '@/components/UserLabelInline.vue'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()

let unsubscribes

const dialogElement = ref(null)

// TODO: sortitemsby (updatedAt default) , show assigned to me only, byTags[], byGroupSpaces[]

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
  dialogHeight: null
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

watch(() => globalStore.sidebarTasksFilters.shouldShowCompleted, (value, prevValue) => {
  emit('updateShouldShowCompleted', value)
})

const clearAllFilters = () => {
  globalStore.sidebarTasksFilters.shouldShowCompleted = false
  globalStore.sidebarTasksFilters.shouldShowAtUserMentionOnly = false
}
const totalFiltersIsActive = computed(() => {
  return shouldShowCompleted.value || shouldShowAtUserMentionOnly.value
})

// show completed

const currentUser = computed(() => userStore.getUserAllState)
const shouldShowCompleted = computed(() => globalStore.sidebarTasksFilters.shouldShowCompleted)
const toggleShouldShowCompleted = () => {
  globalStore.sidebarTasksFilters.shouldShowCompleted = !globalStore.sidebarTasksFilters.shouldShowCompleted
}

// show @user only

const shouldShowAtUserMentionOnly = computed(() => globalStore.sidebarTasksFilters.shouldShowAtUserMentionOnly)
const toggleShouldShowAtUserMentionOnly = () => {
  globalStore.sidebarTasksFilters.shouldShowAtUserMentionOnly = !globalStore.sidebarTasksFilters.shouldShowAtUserMentionOnly
}
</script>

<template lang="pug">
dialog.narrow.task-filters(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      div
        span Task Filters
      button.small-button(@click.left="clearAllFilters" title="Clear all task filters")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear
        span.badge.info.filter-is-active(v-if="totalFiltersIsActive")
  section
    .row
      .button-wrap(@click.left.prevent="toggleShouldShowCompleted" @keydown.stop.enter="toggleShouldShowCompleted")
        label(:class="{ active: shouldShowCompleted }")
          input(type="checkbox" v-model="shouldShowCompleted")
          span Show Completed
    .row
      .button-wrap(@click.left.prevent="toggleShouldShowAtUserMentionOnly" @keydown.stop.enter="toggleShouldShowCompleted")
        label(:class="{ active: shouldShowAtUserMentionOnly }")
          input(type="checkbox" v-model="shouldShowAtUserMentionOnly")
          UserLabelInline(:user="currentUser" :shouldHideName="true" :isAtMention="true")
          span Only
</template>

<style lang="stylus">
dialog.task-filters
  left initial
  right 0
  width 200px
  .user-label-inline
    .anon-avatar
      vertical-align 2px
</style>
