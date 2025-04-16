<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import SpaceList from '@/components/SpaceList.vue'
import templates from '@/data/templates.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)
const resultsSectionElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  updateHeight()
})

const state = reactive({
  dialogHeight: null,
  resultsSectionHeight: null,
  localSpaces: [],
  spaces: [],
  isLoadingRemoteSpaces: false
})

const parentDialog = computed(() => 'templates')
const changeSpace = (space) => {
  store.dispatch('currentSpace/changeSpace', space)
}

// templates

const systemTemplates = computed(() => {
  const spaces = templates.spaces()
  return spaces.map(space => {
    if (!space.categoryId) { return }
    const category = templates.categories().find(category => category.id === space.categoryId)
    space.category = category.name
    space.fullName = `${space.category} – ${space.name}`
    return space
  })
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
  section
    p Templates
  section.results-section(ref="resultsSectionElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="systemTemplates"
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
