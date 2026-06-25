<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import OfflineBadge from '@/components/OfflineBadge.vue'
import ItemList from '@/components/ItemList.vue'
import DatePicker from '@/components/dialogs/DatePicker.vue'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import sortBy from 'lodash-es/sortBy'

const globalStore = useGlobalStore()
// const boxStore = useBoxStore()
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
  // const boxActionUnsubscribe = boxStore.$onAction(
  //   async ({ name, args }) => {
  //     if (name === 'toggleBoxChecked') {
  //       await nextTick()
  //       const boxId = args[0]
  //       const updatedBox = boxStore.getBox(boxId)
  //       state.boxes = state.boxes.map(box => {
  //         if (box.id !== boxId) { return box }
  //         box.name = updatedBox.name
  //         return box
  //       })
  //     }
  //   }
  // )
  unsubscribes = () => {
    globalActionUnsubscribe()
    cardActionUnsubscribe()
    // boxActionUnsubscribe()
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
  filtersIsVisible: false,
  isLoading: false,
  isError: false,
  cards: []
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateItems()
    clearPreviousResultItem()
  }
})

const spaceIsLoaded = computed(() => !globalStore.isLoadingSpace)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const currentUser = computed(() => userStore.getUserAllState)
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
  state.filtersIsVisible = false
}
const childDialogIsVisible = computed(() => state.filtersIsVisible)
const updateScopeIsCurrentSpace = async (value) => {
  if (globalStore.sidebarScopeIsCurrentSpace === value) { return }
  globalStore.sidebarScopeIsCurrentSpace = value
  globalStore.sidebarAtDateMentionsItemsBySpace = null
  updateItems()
}
const scopeIsCurrentSpace = computed(() => globalStore.sidebarScopeIsCurrentSpace)
const itemsBySpace = computed(() => globalStore.sidebarAtDateMentionsItemsBySpace)
const triggerDateAndTimeSettingsIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerDateAndTimeSettingsIsVisible()
}

// filters

// const shouldShowCompleted = computed(() => globalStore.sidebarTasksFilters.shouldShowCompleted)
// const shouldShowAtUserMentionOnly = computed(() => globalStore.sidebarTasksFilters.shouldShowAtUserMentionOnly)
// const atUserMentionsCurrentUser = (atUserMentions) => {
//   if (!atUserMentions) { return }
//   const currentUserId = userStore.id
//   return atUserMentions.find(mention => mention.userId === currentUserId)
// }
// const filtersIsActive = computed(() => Boolean(shouldShowCompleted.value || shouldShowAtUserMentionOnly.value))
const filtersIsActive = computed(() => false)
const toggleFiltersIsVisible = () => {
  const value = !state.filtersIsVisible
  closeDialogs()
  state.filtersIsVisible = value
}
// const clearAllFilters = () => {
//   globalStore.triggerClearTaskFilters()
// }

// items

// const itemsFiltered = (items, type) => {
//   items = itemsFiltered(items, type)
//   if (!shouldShowCompleted.value) {
//     items = items.filter(item => utils.nameIsUnchecked(item.name))
//   }
//   return items
// }
// const itemsFiltered = (items, type) => {
//   const isCards = type === 'cards'
//   if (shouldShowAtUserMentionOnly.value && isCards) {
//     items = items.filter(card => atUserMentionsCurrentUser(card.atUserMentions))
//   } else if (shouldShowAtUserMentionOnly.value && !isCards) {
//     return []
//   }
//   return items
// }
const updateItems = () => {
  if (scopeIsCurrentSpace.value) {
    state.cards = cardStore.getCardsAtDateMentions
  } else {
    updateItemsBySpace()
  }
}
const updateItemsBySpace = async () => {
  if (!currentUserIsSignedIn.value) { return }
  state.cards = []
  try {
    state.isLoading = true
    state.isError = false
    if (!itemsBySpace.value) {
      globalStore.sidebarAtDateMentionsItemsBySpace = await apiStore.getUserAtDateMentions()
    }
    // update items
    globalStore.sidebarAtDateMentionsItemsBySpace.forEach(space => {
      state.cards = state.cards.concat(space.cards)
    })
  } catch (error) {
    console.error('🚒 updateItemsBySpace', error)
    state.isError = true
  }
  state.isLoading = false
}
// const filteredTodoItems = computed(() => {
//   const cards = itemsFiltered(state.cards, 'cards')
//   const boxes = itemsFiltered(state.boxes, 'boxes')
//   return cards.concat(boxes)
// })
// const filteredCompleteTodoItems = computed(() => filteredTodoItems.value.filter(item => utils.nameIsChecked(item.name)))
const isItems = computed(() => Boolean(state.cards.length))

// select

const selectSpace = (space) => {
  if (space.id === spaceStore.id) { return }
  spaceStore.changeSpace(space)
}
const selectItem = (item) => {
  selectCard(item)
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
// const selectBox = (box) => {
//   closeDialogs()
//   const isBoxInCurrentSpace = box.spaceId === spaceStore.id
//   if (isBoxInCurrentSpace) {
//     globalStore.updateFocusOnItemId(box.id)
//   } else {
//     globalStore.loadSpaceFocusOnItemId = box.id
//     selectSpace({ id: box.spaceId })
//   }
// }

// progress

// const progressCircleTitle = computed(() => {
//   let value = itemsRemainingCount.value / filteredTodoItems.value.length
//   value = Math.round(value * 100)
//   return `${itemsRemainingCount.value}/${filteredTodoItems.value.length}, ${value}% Completed`
// })
// const itemsRemainingCount = computed(() => {
//   const value = filteredTodoItems.value.filter(card => !utils.nameIsChecked(card.name))
//   return value.length.toString()
// })

</script>

<template lang="pug">
.at-date-mentions(v-if="props.visible" :style="styles" @click.stop="closeDialogs" :class="{'overflow-auto': !childDialogIsVisible}")
  section
    .row.title-row
        div
          span Date Cards
          Loader(:visible="state.isLoading" :isSmall="true")
          OfflineBadge
        div
          //- settings
          button.small-button.settings-button(@click.stop="triggerDateAndTimeSettingsIsVisible" title="Date and Time Settings")
            img.icon.settings(src="@/assets/settings.svg")

          //- //- Filters
          .button-wrap.filters-button-wrap
            //- no filters
            template(v-if="!filtersIsActive")
              .button-wrap.filter-button(@click.left.stop="toggleFiltersIsVisible")
                button.small-button(:class="{ active: state.filtersIsVisible }")
                  img.icon(src="@/assets/filter.svg")
            //- filters active
            template(v-if="filtersIsActive")
              .segmented-buttons.filter-button
                button.small-button(@click.left.stop="toggleFiltersIsVisible" :class="{ active: state.filtersIsVisible || filtersIsActive }")
                  img.icon(src="@/assets/filter.svg")
                  .badge.info.filter-is-active

                button.small-button(@click.left.stop="clearAllFilters")
                  img.icon.cancel(src="@/assets/add.svg")
            DatePicker(:visible="state.filtersIsVisible" :showClearButton="true")
              //- @activeDates

    .row
      .segmented-buttons
        button(:class="{ active: scopeIsCurrentSpace }" @click="updateScopeIsCurrentSpace(true)")
          span Current Space
        button(:class="{ active: !scopeIsCurrentSpace }" @click="updateScopeIsCurrentSpace(false)")
          span All Spaces

    section.subsection(v-if="!currentUserIsSignedIn && !scopeIsCurrentSpace")
      .row.badge.info
        span Sign Up or In to access your @mentions
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

    //- error
    .badge.error-badge.danger(v-if="state.isError")
      span (シ_ _)シ Something went wrong, Please try again or contact support
    //- empty
    section.subsection.tips(v-if="!isItems && !state.isLoading")
      span Use{{' '}}
        span.badge.info @
        span to dates to cards

  //- //- items
  template(v-if="isItems")
    //- current space
    section.results-section(v-if="scopeIsCurrentSpace")
      ItemList(:cards="state.cards" @selectItem="selectItem")
    //- all spaces
    section.results-section(v-else)
      template(v-for="space in itemsBySpace" :key="space.id")
        ItemList(:space="space" :cards="space.cards" @selectItem="selectItem" @selectSpace="selectSpace")

</template>

<style lang="stylus">
.sidebar
  .at-date-mentions
    // overflow auto
    border-top 1px solid var(--primary-border)
    min-height 160px
    &.overflow-auto
      overflow auto
    .button-wrap
      margin 0
    // .tips-section
    //   border 0
    //   padding-top 0
    // .subsection
    //   padding 4px
    //   border-radius var(--entity-radius)
    //   &.tips
    //     .badge
    //       white-space nowrap
    // label
    //   .user
    //     vertical-align -3px
    //     transform translateY(-1px)
    //     margin-right 0
    //     .user-avatar
    //       width 17px
    //       height 16px
    // .boxes-list
    //   padding-left 2px
    //   padding-right 2px
    //   padding-bottom 2px
    // .progress-circle
    //   vertical-align -2px
    // .filter-is-active
    //   margin 0
    //   min-height initial
    //   min-width initial
    //   display inline-block
    //   width 10px
    //   height 10px
    //   padding 0
    //   border-radius 100px
    //   margin-left 3px
    .loader
      vertical-align -1px
      margin-left 6px
    .offline-badge
      display inline-block
      margin-left 5px
    // .filter-button
    //   margin-top -5px
    //   margin-bottom -5px
    .user-label-inline
      .anon-avatar
        vertical-align 2px
    .settings-button
      margin-right 6px

    dialog.date-picker
      left initial
      right 2px
</style>
