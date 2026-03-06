<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import SpaceList from '@/components/SpaceList.vue'
import templates from '@/data/templates.js'
import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'
import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import ResultsFilter from '@/components/ResultsFilter.vue'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialogElement = ref(null)
const resultsSectionsElement = ref(null)

const shouldUseProduction = true

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
  systemTemplates: [],
  error: {
    unknownServerError: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  updateUserTemplates()
  updateSystemTemplates()
  updateHeight()
  state.selectedCategory = 'All'
  state.error.unknownServerError = false
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
    state.userTemplates = utils.sortByAlphabetical(state.userTemplates, 'name')
  } catch (error) {
    console.error('🚒 updateUserTemplates', error)
  }
  state.isLoadingUserTemplates = false
  await nextTick()
  updateHeight()
}
const isUserTemplatesVisible = computed(() => {
  if (state.selectedCategory !== 'All') { return }
  if (state.isLoadingUserTemplates) { return }
  return Boolean(state.userTemplates.length)
})
const spaceTemplatesData = () => {
  if (consts.isDevelopment() && !shouldUseProduction) {
    return templates.developmentSpaces()
  } else {
    return templates.spaces()
  }
}
const updateSystemTemplates = async () => {
  try {
    state.isLoadingSystemTemplates = true
    const templatesData = spaceTemplatesData(shouldUseProduction)
    const spaceIds = templatesData.map(space => space.id)
    const results = await apiStore.getPublicSpaces(spaceIds, shouldUseProduction)
    state.systemTemplates = results.map(space => {
      const data = templatesData.find(templateData => templateData.id === space.id)
      space.categoryId = data.categoryId
      return space
    })
    state.systemTemplates = utils.sortByAlphabetical(state.systemTemplates, 'name')
  } catch (error) {
    console.error('🚒 updateSystemTemplates', error)
    state.error.unknownServerError = true
  }
  state.isLoadingSystemTemplates = false
  await nextTick()
  updateHeight()
}

// filter

const allTemplates = computed(() => state.userTemplates.concat(state.systemTemplates))
const updateFilter = (string) => {
  console.log(string)
}
const updateFilteredItems = (items) => {
  console.log(items)
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
const systemTemplatesByCategoryLife = computed(() => {
  return state.systemTemplates.filter(space => space.categoryId === 1)
})
const systemTemplatesByCategoryWork = computed(() => {
  return state.systemTemplates.filter(space => space.categoryId === 2)
})

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
        Loader(:visible="isLoading" :isSmall="true")
      button.small-button(@click="showSpaceDetailsDialog")
        span My Spaces
    //- categories
    .categories
      template(v-for="category in categories" :key="category.name")
        span.badge.secondary.button-badge(:class="{ active: categoryIsActive(category.name) }" :style="{ 'background-color': category.color }" @click="updateSelectedCategory(category.name)") {{category.name}}
    //- errors
    OfflineBadge(:isDanger="true" :isInline="true")
    p.badge.error-badge.danger(v-if="state.error.unknownServerError")
      span (シ_ _)シ Something went wrong, Please try again or contact support
    //- search filter
    ResultsFilter(:items="allTemplates" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredItems")
  .results-sections(ref="resultsSectionsElement" :style="{'max-height': state.resultsSectionsHeight + 'px'}")
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
    template(v-if="!state.error.unknownServerError")
      //- Life
      section.results-section.results-section-border-top(v-if="categoryIsVisible('Life')")
        p.category
          span.badge.secondary(:style="{ 'background-color': categories[1].color }" @click="updateSelectedCategory(categories[1].name)") {{categories[1].name}}
        SpaceList(
          :spaces="systemTemplatesByCategoryLife"
          :showCategory="true"
          @selectSpace="changeSpace"
          :isLoading="state.isLoadingUserTemplates"
          :parentDialog="parentDialog"
          :hideFilter="true"
          :showSpaceGroups="true"
          :hideTodayBadge="true"
          :hideExploreBadge="true"
        )
      //- Work & School
      section.results-section.results-section-border-top(v-if="categoryIsVisible('Work & School')")
        p.category
          span.badge.secondary(:style="{ 'background-color': categories[2].color }" @click="updateSelectedCategory(categories[2].name)") {{categories[2].name}}
        SpaceList(
          :spaces="systemTemplatesByCategoryWork"
          :showCategory="true"
          @selectSpace="changeSpace"
          :isLoading="state.isLoadingUserTemplates"
          :parentDialog="parentDialog"
          :hideFilter="true"
          :showSpaceGroups="true"
          :hideTodayBadge="true"
          :hideExploreBadge="true"
        )
</template>

<style lang="stylus">
dialog.templates
  overflow auto
  .loader
    margin-left 4px
    vertical-align -1px
  .categories
    margin-top -6px
    display flex
    flex-wrap wrap
    .button-badge
      margin-top 6px
      color var(--primary-on-light-background)
  p.category
    margin 4px
    margin-bottom 10px
    padding-top 0
  .offline-badge
    margin-top 10px
  .results-filter
    margin 0
    align-items center
    .icon.search
      margin-top 0
    input
      margin-bottom 0
</style>
