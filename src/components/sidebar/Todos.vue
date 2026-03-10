<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import CardList from '@/components/CardList.vue'
import BoxList from '@/components/BoxList.vue'
import ProgressCircle from '@/components/ProgressCircle.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const cardStore = useCardStore()
const spaceStore = useSpaceStore()

const resultsElement = ref(null)

onMounted(() => {
  clearPreviousResultItem()
  updateResultsSectionHeight()
  window.addEventListener('resize', updateResultsSectionHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResultsSectionHeight)
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  resultsSectionHeight: null,
  shouldShowCompleted: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    clearPreviousResultItem()
    updateResultsSectionHeight()
  }
})

const spaceIsLoaded = computed(() => !globalStore.isLoadingSpace)
watch(() => spaceIsLoaded.value, (value, prevValue) => {
  if (value) {
    updateResultsSectionHeight()
  }
})

const clearPreviousResultItem = () => {
  globalStore.clearPreviousResultItem()
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}

// items

const allItems = computed(() => cards.value.concat(boxes.value))
const items = computed(() => cardsFiltered.value.concat(boxesFiltered.value))
const isItems = computed(() => items.value.length)

// cards

const cards = computed(() => {
  let results = cardStore.getCardsIsTodoSortedByY
  results = utils.sortByDistanceFromOrigin(results)
  return results
})
const cardsFiltered = computed(() => filterCompleted(cards.value))
const selectCard = (card) => {
  const isCardInCurrentSpace = card.spaceId === spaceStore.id
  if (isCardInCurrentSpace) {
    globalStore.updateFocusOnCardId(card.id)
    globalStore.previousResultItem = card
  }
  // } else {
  // selectSpaceCard(card) Search.vue
  // }
}

// boxes

const selectBox = (box) => {
  globalStore.updateFocusOnBoxId(box.id)
}
const boxes = computed(() => {
  let results = boxStore.getAllBoxes
  results = utils.sortByDistanceFromOrigin(results)
  results = results.filter(item => utils.checkboxFromString(item.name))
  results = filterCompleted(results)
  return results
})
const boxesFiltered = computed(() => filterCompleted(boxes.value))

// completed

const toggleShouldShowCompleted = () => {
  state.shouldShowCompleted = !state.shouldShowCompleted
}
const filterCompleted = (results) => {
  if (!state.shouldShowCompleted) {
    results = results.filter(item => utils.nameIsUnchecked(item.name))
  }
  return results
}

// progress

const itemsCompleted = computed(() => {
  return allItems.value.filter(item => utils.nameIsChecked(item.name))
})
const itemsCompletedPercent = computed(() => {
  let value = allItems.value.length / items.value.length
  value = Math.round(value * 100)
  return `${items.value.length}/${items.value.length}, ${value}% Completed`
})
const itemsRemaningCount = computed(() => {
  const value = allItems.value.filter(card => !utils.nameIsChecked(card.name))
  return value.length.toString()
})
</script>

<template lang="pug">
.todos(v-if="props.visible")
  section
    .row.title-row
      div
        ProgressCircle(v-if="isItems" :value="itemsCompleted.length" :max="allItems.length" :title="itemsCompletedPercent" :count="itemsRemaningCount")
        span Todos
      .button-wrap(@click.left.prevent="toggleShouldShowCompleted" @keydown.stop.enter="toggleShouldShowCompleted")
        label.small-button(:class="{ active: state.shouldShowCompleted }")
          input(type="checkbox" v-model="state.shouldShowCompleted")
          span Show Completed

    section.subsection(v-if="!isItems")
      span Prepend cards or boxes with
        span.badge.info [ ]
        span to create checkbox cards that you can track here.

  section.results-section(v-if="isItems")
    BoxList(
      :boxes="boxesFiltered"
      @selectBox="selectBox"
    )
    CardList(
      :cards="cardsFiltered"
      :shouldHideDate="true"
      @selectCard="selectCard"
    )
</template>

<style lang="stylus">
.todos
  border-top 1px solid var(--primary-border)
  .button-wrap
    margin 0
  .tips-section
    border 0
    padding-top 0
  .subsection
    padding 4px
    border-radius var(--entity-radius)
    .badge
      white-space nowrap
  label
    .user
      vertical-align -3px
      transform translateY(-1px)
      margin-right 0
      .user-avatar
        width 17px
        height 16px
  .boxes-list
    padding-left 2px
    padding-right 2px
    padding-bottom 2px
  .progress-circle
    vertical-align -2px
</style>
