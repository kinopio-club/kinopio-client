<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import merge from 'lodash-es/merge'

import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const resultsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateResultsSectionHeight)
  init()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    init()
  }
})

const state = reactive({
  removeConfirmationVisibleForId: '',
  cardsVisible: true,
  removedSpaces: [],
  removedCards: [],
  loading: {
    cards: false,
    spaces: false
  },
  isSuccess: false,
  resultsSectionHeight: null,
  deleteAllConfirmationIsVisible: false
})

const isLoading = computed(() => {
  return state.loading.cards || state.loading.spaces
})
const cardsOrSpacesLabel = computed(() => {
  if (state.cardsVisible) {
    return 'cards'
  } else {
    return 'spaces'
  }
})
const currentSpace = computed(() => spaceStore.getSpaceAllState)
const currentSpaceName = computed(() => currentSpace.value.name)
const currentUserCanEditSpace = computed(() => {
  return userStore.getUserCanEditSpace
})

const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element)
}
const init = async () => {
  state.deleteAllConfirmationIsVisible = false
  await updateRemovedCards()
  await updateRemovedSpaces()
  updateResultsSectionHeight()
}

// restore

const restore = (event, item) => {
  if (state.cardsVisible) {
    restoreCard(item)
  } else {
    restoreSpace(event, item)
  }
}

// remove

const isRemoveConfirmationVisible = (item) => {
  return Boolean(state.removeConfirmationVisibleForId === item.id)
}
const showRemoveConfirmation = (item) => {
  state.removeConfirmationVisibleForId = item.id
}
const hideRemoveConfirmation = () => {
  state.removeConfirmationVisibleForId = ''
}
const deleteItem = (item) => {
  if (state.cardsVisible) {
    deleteCard(item)
  } else {
    deleteSpace(item)
  }
}
const deleteAll = () => {
  if (state.cardsVisible) {
    deleteAllCards()
  } else {
    deleteAllSpaces()
  }
  state.deleteAllConfirmationIsVisible = false
  state.isSuccess = true
}
const toggleDeleteAllConfirmationIsVisible = () => {
  state.deleteAllConfirmationIsVisible = !state.deleteAllConfirmationIsVisible
  state.isSuccess = false
}

// Cards

const removedCardsWithName = computed(() => {
  return state.removedCards.filter(card => card.name)
})
const showCards = () => {
  state.cardsVisible = true
  state.deleteAllConfirmationIsVisible = false
  state.isSuccess = false
  updateRemovedCards()
}
const updateLocalRemovedCards = () => {
  state.removedCards = cardStore.getAllRemovedCards
}
const updateRemovedCards = async () => {
  updateLocalRemovedCards()
  await loadRemoteRemovedCards()
}
const removeRemovedCard = (card) => {
  state.removedCards = state.removedCards.filter(removedCard => removedCard.id !== card.id)
}
const loadRemoteRemovedCards = async () => {
  if (!currentUserCanEditSpace.value) { return }
  try {
    state.loading.cards = true
    const space = spaceStore.getSpaceAllState
    const remoteCards = await apiStore.getSpaceRemovedCards(space)
    state.loading.cards = false
    if (!utils.arrayHasItems(remoteCards)) { return }
    state.removedCards = remoteCards
    const ids = remoteCards.map(card => card.id)
    cardStore.removeCards(ids)
  } catch (error) {
    console.error('🚒 loadRemoteRemovedCards', error)
  }
}
const restoreCard = async (card) => {
  cardStore.restoreRemovedCard(card)
  await nextTick()
  scrollIntoView(card)
  globalStore.updateFocusOnCardId(card.id)
  removeRemovedCard(card)
}
const deleteCard = (card) => {
  cardStore.deleteCard(card)
  removeRemovedCard(card)
}
const deleteAllCards = () => {
  cardStore.deleteAllRemovedCards()
  state.removedCards = []
}
const scrollIntoView = (card) => {
  const element = document.querySelector(`.card-wrap [data-card-id="${card.id}"]`)
  globalStore.scrollElementIntoView({ element })
}

// Spaces

const showSpaces = async () => {
  state.cardsVisible = false
  state.deleteAllConfirmationIsVisible = false
  state.isSuccess = false
  await updateRemovedSpaces()
}
const updateLocalRemovedSpaces = async () => {
  state.removedSpaces = await cache.getAllRemovedSpaces()
}
const updateRemovedSpaces = async () => {
  await updateLocalRemovedSpaces()
  await loadRemoteRemovedSpaces()
}
const removeRemovedSpace = (space) => {
  state.removedSpaces = state.removedSpaces.filter(removedSpace => removedSpace.id !== space.id)
}
const loadRemoteRemovedSpaces = async () => {
  let removedSpaces
  state.loading.spaces = true
  removedSpaces = await apiStore.getUserRemovedSpaces()
  state.loading.spaces = false
  if (!removedSpaces) { return }
  removedSpaces = removedSpaces.map(remote => {
    const localSpace = state.removedSpaces?.find(local => {
      if (local) {
        return local.id === remote.id
      }
    })
    if (localSpace) {
      return merge(remote, localSpace)
    } else {
      return remote
    }
  })
  state.removedSpaces = removedSpaces
}
const restoreSpace = (event, space) => {
  if (userStore.checkIfShouldPreventNewSpace(event)) {
    return
  }
  spaceStore.restoreRemovedSpace(space)
  removeRemovedSpace(space)
}
const deleteSpace = (space) => {
  spaceStore.deleteSpace(space)
  removeRemovedSpace(space)
}
const deleteAllSpaces = () => {
  spaceStore.deleteAllRemovedSpaces()
  state.removedSpaces = []
}

// items

const items = computed(() => {
  let items = []
  if (state.cardsVisible && !currentUserCanEditSpace.value) {
    items = []
  } else if (state.cardsVisible) {
    items = removedCardsWithName.value
  } else {
    items = state.removedSpaces
  }
  items = items.filter(item => Boolean(item))
  return items
})

</script>

<template lang="pug">
.removed(v-if="visible")
  section
    .row
      span Restore Removed Items
      Loader(:visible="isLoading" :isSmall="true")

    .segmented-buttons
      button(@click.left="showCards" :class="{active: state.cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Cards in Space
      button(@click.left="showSpaces" :class="{active: !state.cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Spaces

      //- delete all
    .row.delete-all-button-row
      button.small-button(@click="toggleDeleteAllConfirmationIsVisible" :class="{ active: state.deleteAllConfirmationIsVisible }")
        img.icon(src="@/assets/remove.svg")
        span Delete All
    //- delete all confirmation
    section.subsection(v-if="state.deleteAllConfirmationIsVisible")
      p
        span Permanently delete all removed {{cardsOrSpacesLabel}} and uploads?
      .segmented-buttons
        button.danger(@click.left.stop="deleteAll")
          img.icon(src="@/assets/remove.svg")
          span Delete All
        button(@click.left.stop="toggleDeleteAllConfirmationIsVisible")
          img.icon.cancel(src="@/assets/add.svg")
          span Cancel
    .row(v-if="state.isSuccess")
      span.badge.success
        span Deleted All

  section.tips-section(v-if="!items.length")
    template(v-if="state.cardsVisible")
      section.subsection
        p Removed cards from this space can be restored here
        p(v-if="!currentUserCanEditSpace")
          span.badge.info
            PrivacyIcon(:privacy="currentSpace.privacy" :closedIsNotVisible="true")
            span You need to be a collaborator
    template(v-if="!state.cardsVisible")
      section.subsection
        p Removed spaces can be restored here

  section.results-section(v-if="items.length" ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")

    ul.results-list
      template(v-for="item in items" :key="item.id")
        li(@click.left="restore($event, item)" tabindex="0" v-on:keyup.enter="restore($event, item)" :data-item-id="item.id")
          .badge
            img.undo.icon(src="@/assets/undo.svg")
          .name {{item.name}}
          //- delete
          button.small-button.remove-button(v-if="!isRemoveConfirmationVisible(item)" @click.left.stop="showRemoveConfirmation(item)")
            img.icon(src="@/assets/remove.svg")
          //- delete confirmation
          .remove-button(v-if="isRemoveConfirmationVisible(item)")
            .segmented-buttons
              button.small-button.danger(@click.left.stop="deleteItem(item)")
                img.icon(src="@/assets/remove.svg")
                span Delete
              button.small-button(@click.left.stop="hideRemoveConfirmation")
                img.icon.cancel(src="@/assets/add.svg")

</template>

<style lang="stylus">
.removed
  overflow auto
  border-top 1px solid var(--primary-border)
  .results-section
    max-height initial
    .button-wrap
      margin-left 4px
      margin-top 4px
      margin-bottom 8px
  .name
    white-space nowrap
    overflow hidden
    text-overflow ellipsis
    max-width calc(100% - 56px)
  .remove-button
    position absolute
    right 6px
    top 7px
    button
      margin 0
      &:first-child
        margin-right -1px
  .badge
    min-width 19px
  .results-actions
    padding 4px
    padding-top 0
  .undo
    vertical-align 1px
  .loader
    margin-left 5px
  .tips-section
    padding-top 0
    border none
    section.subsection
      margin-bottom 0
  .delete-all-button-row
    margin-top 10px
    display flex
    justify-content flex-end
</style>
