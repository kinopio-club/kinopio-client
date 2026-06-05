<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import OfflineBadge from '@/components/OfflineBadge.vue'
import TaskFilters from '@/components/dialogs/TaskFilters.vue'
import ItemList from '@/components/ItemList.vue'
import ProgressCircle from '@/components/ProgressCircle.vue'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const cardStore = useCardStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const userStore = useUserStore()

let unsubscribes

const resultsElement = ref(null)

onMounted(() => {
  updateItems()
  clearPreviousResultItem()
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeDialogs()
      }
    }
  )
  const cardActionUnsubscribe = cardStore.$onAction(
    async ({ name, args }) => {
      if (name === 'toggleCardChecked') {
        await nextTick()
        const cardId = args[0]
        const updatedCard = cardStore.getCard(cardId)
        state.cards = state.cards.map(card => {
          if (card.id !== cardId) { return card }
          card.name = updatedCard.name
          return card
        })
      }
    }
  )
  const boxActionUnsubscribe = boxStore.$onAction(
    async ({ name, args }) => {
      if (name === 'toggleBoxChecked') {
        await nextTick()
        const boxId = args[0]
        const updatedBox = boxStore.getBox(boxId)
        state.boxes = state.boxes.map(box => {
          if (box.id !== boxId) { return box }
          box.name = updatedBox.name
          return box
        })
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
    cardActionUnsubscribe()
    boxActionUnsubscribe()
  }
})

onBeforeUnmount(() => {
  unsubscribes()
})

const props = defineProps({
  visible: Boolean,
  subsectionHeight: Number
})
const state = reactive({
  taskFiltersIsVisible: false,
  isLoading: false,
  isError: false,
  filters: {
    shouldShowCompleted: false
  },
  cards: [],
  boxes: []
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateItems()
    clearPreviousResultItem()
  }
})

const spaceIsLoaded = computed(() => !globalStore.isLoadingSpace)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}

const clearPreviousResultItem = () => {
  globalStore.clearPreviousResultItem()
}
const styles = computed(() => {
  return {
    maxHeight: props.subsectionHeight + 'px'
  }
})
const closeDialogs = () => {
  state.taskFiltersIsVisible = false
}
const childDialogIsVisible = computed(() => state.taskFiltersIsVisible)
const updateScopeIsCurrentSpace = async (value) => {
  if (globalStore.sidebarTasksItemsScopeIsCurrentSpace === value) { return }
  globalStore.sidebarTasksItemsScopeIsCurrentSpace = value
  globalStore.sidebarTasksItemsBySpace = null
  updateItems()
}
const scopeIsCurrentSpace = computed(() => globalStore.sidebarTasksItemsScopeIsCurrentSpace)
const itemsBySpace = computed(() => globalStore.sidebarTasksItemsBySpace)

// filters

const filterResults = (results) => {
  if (!globalStore.sidebarTasksFilters.shouldShowCompleted) {
    results = results.filter(item => utils.nameIsUnchecked(item.name))
  }
  return results
}
const taskFiltersIsActive = computed(() => Boolean(globalStore.sidebarTasksFilters.shouldShowCompleted))
const toggleTaskFiltersIsVisible = () => {
  const value = !state.taskFiltersIsVisible
  closeDialogs()
  state.taskFiltersIsVisible = value
}
const updateShouldShowCompleted = (value) => {
  globalStore.sidebarTasksFilters.shouldShowCompleted = value
}
const clearAllFilters = () => {
  globalStore.triggerClearTaskFilters()
}

// items

const updateItems = () => {
  if (scopeIsCurrentSpace.value) {
    state.cards = cardStore.getCardsIsTodoSortedByY
    state.boxes = boxStore.getBoxesIsTodoSortedByY
  } else {
    updateItemsBySpace()
  }
}
const updateItemsBySpace = async () => {
  if (!currentUserIsSignedIn.value) { return }
  state.cards = []
  state.boxes = []
  try {
    state.isLoading = true
    state.isError = false
    if (!itemsBySpace.value) {
      globalStore.sidebarTasksItemsBySpace = await apiStore.getUserTodos()
    }
    // update items
    globalStore.sidebarTasksItemsBySpace.forEach(space => {
      state.cards = state.cards.concat(space.cards)
      state.boxes = state.boxes.concat(space.boxes)
    })
  } catch (error) {
    console.error('🚒 updateItemsBySpace', error)
    state.isError = true
  }
  state.isLoading = false
}
const allItems = computed(() => {
  return state.cards.concat(state.boxes)
})
const todoItems = computed(() => itemsFiltered(allItems.value))
const isTodoItems = computed(() => todoItems.value.length)
const itemsFiltered = (value) => {
  return filterResults(value)
}

// select

const selectSpace = (space) => {
  if (space.id === spaceStore.id) { return }
  spaceStore.changeSpace(space)
}
const selectItem = (item) => {
  if (item.itemType === 'box') {
    selectBox(item)
  } else if (item.itemType === 'card') {
    selectCard(item)
  }
}
const selectCard = (card) => {
  closeDialogs()
  const isCardInCurrentSpace = card.spaceId === spaceStore.id
  if (isCardInCurrentSpace) {
    globalStore.updateFocusOnItemId(card.id)
    globalStore.previousResultItem = card
  } else {
    globalStore.loadSpaceFocusOnItemId = card.id
    selectSpace({ id: card.spaceId })
  }
}
const selectBox = (box) => {
  closeDialogs()
  const isBoxInCurrentSpace = box.spaceId === spaceStore.id
  if (isBoxInCurrentSpace) {
    globalStore.updateFocusOnItemId(box.id)
  } else {
    globalStore.loadSpaceFocusOnItemId = box.id
    selectSpace({ id: box.spaceId })
  }
}

// progress

const itemsCompleted = computed(() => {
  return allItems.value.filter(item => utils.nameIsChecked(item.name))
})
const progressCircleTitle = computed(() => {
  let value = todoItems.value.length / allItems.value.length
  value = Math.round(value * 100)
  return `${todoItems.value.length}/${allItems.value.length}, ${value}% Completed`
})
const itemsRemainingCount = computed(() => {
  const value = allItems.value.filter(card => !utils.nameIsChecked(card.name))
  return value.length.toString()
})

</script>

<template lang="pug">
.tasks(v-if="props.visible" :style="styles" :class="{ overflow: !childDialogIsVisible }" @click.stop="closeDialogs")
  section
    .row.title-row
      div
        ProgressCircle(v-if="isTodoItems" :value="itemsCompleted.length" :max="allItems.length" :title="progressCircleTitle" :count="itemsRemainingCount")
        span Tasks
        Loader(:visible="state.isLoading" :isSmall="true")
        OfflineBadge

      //- Filters
      .button-wrap
        //- no filters
        template(v-if="!taskFiltersIsActive")
          .button-wrap.title-row-small-button-wrap.section-top.filter-button(@click.left.stop="toggleTaskFiltersIsVisible")
            button.small-button(:class="{ active: state.taskFiltersIsVisible }")
              img.icon(src="@/assets/filter.svg")
        //- filters active
        template(v-if="taskFiltersIsActive")
          .segmented-buttons.title-row-small-button-wrap.section-top.filter-button
            button.small-button(@click.left.stop="toggleTaskFiltersIsVisible" :class="{ active: state.taskFiltersIsVisible || taskFiltersIsActive }")
              img.icon(src="@/assets/filter.svg")
              .badge.info.filter-is-active

            button.small-button(@click.left.stop="clearAllFilters")
              img.icon.cancel(src="@/assets/add.svg")
        TaskFilters(:visible="state.taskFiltersIsVisible" @updateShouldShowCompleted="updateShouldShowCompleted")

    .row
      .segmented-buttons
        button(:class="{ active: scopeIsCurrentSpace }" @click="updateScopeIsCurrentSpace(true)")
          span Current Space
        button(:class="{ active: !scopeIsCurrentSpace }" @click="updateScopeIsCurrentSpace(false)")
          span All Spaces

    section.subsection(v-if="!currentUserIsSignedIn && !scopeIsCurrentSpace")
      .row.badge.info
        span Sign Up or In to search your spaces
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

    //- error
    .badge.error-badge.danger(v-if="state.isError")
      span (シ_ _)シ Something went wrong, Please try again or contact support
    //- empty
    section.subsection.tips(v-if="!isTodoItems && !state.isLoading")
      span Prepend cards or boxes with
        span.badge.info.brackers [ ]
        span to create todo tasks that you can track here.

  //- items
  template(v-if="isTodoItems")
    //- current space
    section.results-section(v-if="scopeIsCurrentSpace")
      ItemList(:cards="itemsFiltered(state.cards)" :boxes="itemsFiltered(state.boxes)" @selectItem="selectItem")
    //- all spaces
    section.results-section(v-else)
      template(v-for="space in itemsBySpace" :key="space.id")
        ItemList(:space="space" :cards="itemsFiltered(space.cards)" :boxes="itemsFiltered(space.boxes)" @selectItem="selectItem" @selectSpace="selectSpace" :shouldShowMarkAllComplete="true")

</template>

<style lang="stylus">
.tasks
  overflow auto
  border-top 1px solid var(--primary-border)
  .button-wrap
    margin 0
  .tips-section
    border 0
    padding-top 0
  .subsection
    padding 4px
    border-radius var(--entity-radius)
    &.tips
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
  .loader
    vertical-align -1px
    margin-left 6px
  .offline-badge
    display inline-block
    margin-left 5px
  .filter-button
    margin-top -5px
    margin-bottom -5px
</style>
