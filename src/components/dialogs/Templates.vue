<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import SpaceList from '@/components/SpaceList.vue'
import templates from '@/data/templates.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialogElement = ref(null)
const resultsSectionElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  updateUserTemplates()
  updateHeight()
})

const state = reactive({
  dialogHeight: null,
  resultsSectionHeight: null,
  isLoadingRemoteSpaces: false,
  userTemplates: []
})

const parentDialog = computed(() => 'templates')
const changeSpace = (space) => {
  spaceStore.changeSpace(space)
}

// templates

const updateUserTemplates = async () => {
  try {
    state.isLoadingRemoteSpaces = true
    state.userTemplates = await apiStore.getUserTemplateSpaces() || []
  } catch (error) {
    console.error('🚒 updateUserTemplates', error)
  }
  state.isLoadingRemoteSpaces = false
  await nextTick()
  updateHeight()
}
const allTemplates = computed(() => {
  let systemTemplates = templates.spaces()
  systemTemplates = systemTemplates.map(space => {
    if (!space.categoryId) { return }
    const category = templates.categories().find(category => category.id === space.categoryId)
    space.category = category.name
    space.fullName = `${space.category} – ${space.name}`
    return space
  })
  const value = state.userTemplates.concat(systemTemplates)
  console.log(value)
  return value
})

// dialog height

const updateHeight = () => {
  updateDialogHeight()
  updateResultsSectionHeight()
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsSectionElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
</script>

<template lang="pug">
dialog.templates.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  section.title-section
    p Templates
  section.results-section.results-section-border-top(ref="resultsSectionElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="allTemplates"
      :showCategory="true"
      @selectSpace="changeSpace"
      :isLoading="state.isLoadingRemoteSpaces"
      :parentDialog="parentDialog"
    )
</template>

<style lang="stylus">
dialog.templates
  overflow auto
  hr
    margin-top 0
    margin-bottom 4px
  .results-section
    .inline-badge
      &.learning
        background-color #f0e68c
        color var(--primary-on-light-background)
      &.life
        background-color #b9a8ff
        color var(--primary-on-light-background)
      &.work-school
        background-color #ffc0cb
        color var(--primary-on-light-background)
      &.product
        background-color #ee83ee
        color var(--primary-on-light-background)
</style>
