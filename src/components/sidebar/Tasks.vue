<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import TaskFilters from '@/components/dialogs/TaskFilters.vue'
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
})

const props = defineProps({
  visible: Boolean,
  subsectionHeight: Number
})
const state = reactive({
  shouldShowCompleted: false,
  taskFiltersIsVisible: false
  // isLoadingRemoteSpaces: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    clearPreviousResultItem()
  }
})

const spaceIsLoaded = computed(() => !globalStore.isLoadingSpace)

const clearPreviousResultItem = () => {
  globalStore.clearPreviousResultItem()
}
const styles = computed(() => {
  return {
    maxHeight: props.subsectionHeight + 'px'
  }
})

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
  closeDialogs()
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
  closeDialogs()
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

// filters

const closeDialogs = () => {
  state.taskFiltersIsVisible = false
}
const childDialogIsVisible = computed(() => state.taskFiltersIsVisible)
const taskFiltersIsActive = computed(() => true)
const toggleTaskFiltersIsVisible = () => {
  const value = !state.taskFiltersIsVisible
  closeDialogs()
  state.taskFiltersIsVisible = value
}
</script>

<template lang="pug">
.todos(v-if="props.visible" :style="styles" :class="{ overflow: !childDialogIsVisible }" @click.stop="closeDialogs")
  section
    .row.title-row
      div
        ProgressCircle(v-if="isItems" :value="itemsCompleted.length" :max="allItems.length" :title="itemsCompletedPercent" :count="itemsRemaningCount")
        span Tasks

      //- Filters
      .button-wrap
        // no filters
        template(v-if="!taskFiltersIsActive")
          .button-wrap.title-row-small-button-wrap.section-top(@click.left.stop="toggleTaskFiltersIsVisible")
            button.small-button(:class="{ active: state.taskFiltersIsVisible }")
              img.icon(src="@/assets/filter.svg")
        // filters active
        template(v-if="taskFiltersIsActive")
          .segmented-buttons.title-row-small-button-wrap.section-top
            button.small-button(@click.left.stop="toggleTaskFiltersIsVisible" :class="{ active: state.taskFiltersIsVisible || taskFiltersIsActive }")
              img.icon(src="@/assets/filter.svg")
              .badge.info.filter-is-active
            button.small-button(@click.left.stop="clearAllFilters")
              img.icon.cancel(src="@/assets/add.svg")
        TaskFilters(:visible="state.taskFiltersIsVisible" :isLoading="state.isLoadingRemoteSpaces")

      //- .button-wrap(@click.left.prevent="toggleShouldShowCompleted" @keydown.stop.enter="toggleShouldShowCompleted")
      //-   label.small-button(:class="{ active: state.shouldShowCompleted }")
      //-     input(type="checkbox" v-model="state.shouldShowCompleted")
      //-     span Show Completed

    section.subsection(v-if="!isItems")
      span Prepend cards or boxes with
        span.badge.info [ ]
        span to create todo tasks that you can track here.

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
  .filter-is-active
    margin 0
    min-height initial
    min-width initial
    display inline-block
    width 10px
    height 10px
    padding 0
    border-radius 100px
    margin-left 3px

</style>
