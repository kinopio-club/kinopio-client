<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import SpaceList from '@/components/SpaceList.vue'
import templates from '@/data/templates.js'
import cache from '@/cache.js'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialogElement = ref(null)
const resultsSectionsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  dialogHeight: null,
  resultsSectionsHeight: null,
  selectedCategory: 'All',
  isLoadingUserTemplates: true,
  isLoadingSystemTemplates: true,
  userTemplates: [],
  systemTemplates: []
})

watch(() => props.visible, (value, prevValue) => {
  updateUserTemplates()
  updateSystemTemplates()
  updateHeight()
  state.selectedCategory = 'All'
})

const parentDialog = computed(() => 'templates')
const changeSpace = (space) => {
  spaceStore.changeSpace(space)
}
const showSpaceDetailsDialog = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSpaceDetailsVisible()
}

// templates

const isLoading = computed(() => state.isLoadingUserTemplates || state.isLoadingSystemTemplates)
const updateUserTemplates = async () => {
  try {
    state.isLoadingUserTemplates = true
    state.userTemplates = await apiStore.getUserTemplateSpaces() || []
  } catch (error) {
    console.error('🚒 updateUserTemplates', error)
  }
  state.isLoadingUserTemplates = false
  await nextTick()
  updateHeight()
}
const isUserTemplatesVisible = computed(() => {
  if (state.selectedCategory !== 'All') { return }
  return !state.isLoadingUserTemplates || !state.userTemplates.length
})
const updateSystemTemplates = async () => {
  try {
    state.isLoadingSystemTemplates = true
    // TODO
    // state.systemTemplates = await apiStore. get multiple spaces by ids
  } catch (error) {
    console.error('🚒 updateSystemTemplates', error)
  }
  state.isLoadingSystemTemplates = false
  await nextTick()
  updateHeight()
}

// categories

const categories = computed(() => templates.categories())
const updateSelectedCategory = (name) => {
  state.selectedCategory = name
}
const categoryIsActive = (name) => {
  return state.selectedCategory === name
}
const categoryIsVisible = (name) => {
  return state.selectedCategory === 'All' || state.selectedCategory === name
}
const categoryByName = (name) => {
  return categories.value.find(category => category.name === name)
}
const categoryColor = (name) => {
  const color = categoryByName(name).color
  return color
}

// dialog height

const updateHeight = () => {
  updateDialogHeight()
  updateResultsSectionsHeight()
}
const updateResultsSectionsHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsSectionsElement.value
  state.resultsSectionsHeight = utils.elementHeight(element, true)
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
</script>

<template lang="pug">
dialog.templates(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  section.title-section
    .row.title-row
      span
        span Templates
      button.small-button(@click="showSpaceDetailsDialog")
        span My Spaces
    //- categories
    .categories
      template(v-for="category in categories" :key="category.name")
        span.badge.secondary.button-badge(:class="{ active: categoryIsActive(category.name) }" :style="{ 'background-color': category.color }" @click="updateSelectedCategory(category.name)") {{category.name}}
      Loader(:visible="isLoading" :isSmall="true")

  .results-sections(ref="resultsSectionsElement" :style="{'max-height': state.resultsSectionsHeight + 'px'}")

    //- todo search filter input

    //- user templates
    section.results-section.results-section-border-top(v-if="isUserTemplatesVisible")
      SpaceList(
        :spaces="state.userTemplates"
        :showCategory="true"
        @selectSpace="changeSpace"
        :isLoading="state.isLoadingUserTemplates"
        :parentDialog="parentDialog"
        :hideFilter="true"
        :showSpaceGroups="true"
        :hideTemplatesIcon="true"
      )
    //- system templates
    section.results-section.results-section-border-top(v-if="categoryIsVisible('Life')")
      //- Life
      p.category
        span.badge.secondary(:style="{ 'background-color': categories[1].color }" @click="updateSelectedCategory(categories[1].name)") {{categories[1].name}}
      //- SpaceList(
      //-   :spaces="userTemplates"
      //-   :showCategory="true"
      //-   @selectSpace="changeSpace"
      //-   :isLoading="state.isLoadingUserTemplates"
      //-   :parentDialog="parentDialog"
      //-   :hideFilter="true"
      //-   :showSpaceGroups="true"
      //- )

    //- Work
    section.results-section.results-section-border-top(v-if="categoryIsVisible('Work')")
      p.category
        span.badge.secondary(:style="{ 'background-color': categories[2].color }" @click="updateSelectedCategory(categories[2].name)") {{categories[2].name}}

    //- School
    section.results-section.results-section-border-top(v-if="categoryIsVisible('School')")
      p.category
        span.badge.secondary(:style="{ 'background-color': categories[3].color }" @click="updateSelectedCategory(categories[3].name)") {{categories[3].name}}

</template>

<style lang="stylus">
dialog.templates
  overflow auto
  .loader
    margin-top 10px
  .categories
    margin-top: -6px;
    display: flex;
    flex-wrap: wrap;
    .button-badge
      margin-top 6px
      color var(--primary-on-light-background)
  p.category
    margin 4px
    margin-bottom 10px
</style>
