<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import merge from 'lodash-es/merge'

import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'
const store = useStore()

const resultsElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateResultsSectionHeight()
    }
  })
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
const currentSpace = computed(() => store.state.currentSpace)
const currentSpaceName = computed(() => currentSpace.value.name)
const currentUserCanEditSpace = computed(() => {
  return store.getters['currentUser/canEditSpace']()
})

const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element)
}
const init = async () => {
  state.deleteAllConfirmationIsVisible = false
  await updateRemovedCards()
  await updateRemovedSpaces()
  updateResultsSectionHeight()
}

// restore

const restore = (item) => {
  if (state.cardsVisible) {
    restoreCard(item)
  } else {
    restoreSpace(item)
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
}
const toggleDeleteAllConfirmationIsVisible = () => {
  state.deleteAllConfirmationIsVisible = !state.deleteAllConfirmationIsVisible
}

// Cards

const removedCardsWithName = computed(() => {
  return state.removedCards.filter(card => card.name)
})
const showCards = () => {
  state.cardsVisible = true
  state.deleteAllConfirmationIsVisible = false
  updateRemovedCards()
}
const updateLocalRemovedCards = () => {
  state.removedCards = store.state.currentCards.removedCards
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
  state.loading.cards = true
  const space = store.state.currentSpace
  const remoteCards = await store.dispatch('api/getSpaceRemovedCards', space)
  state.loading.cards = false
  if (!utils.arrayHasItems(remoteCards)) { return }
  state.removedCards = remoteCards
  store.commit('currentCards/removedCards', remoteCards)
}
const restoreCard = async (card) => {
  store.dispatch('currentCards/restoreRemoved', card)
  await nextTick()
  scrollIntoView(card)
  removeRemovedCard(card)
}
const deleteCard = (card) => {
  store.dispatch('currentCards/deleteCard', card)
  removeRemovedCard(card)
}
const deleteAllCards = () => {
  store.dispatch('currentCards/deleteAllRemoved')
  state.removedCards = []
}
const scrollIntoView = (card) => {
  const element = document.querySelector(`article [data-card-id="${card.id}"]`)
  store.commit('scrollElementIntoView', { element })
}

// Spaces

const showSpaces = async () => {
  state.cardsVisible = false
  state.deleteAllConfirmationIsVisible = false
  await updateRemovedSpaces()
}
const updateLocalRemovedSpaces = () => {
  state.removedSpaces = cache.getAllRemovedSpaces()
}
const updateRemovedSpaces = async () => {
  updateLocalRemovedSpaces()
  await loadRemoteRemovedSpaces()
}
const removeRemovedSpace = (space) => {
  state.removedSpaces = state.removedSpaces.filter(removedSpace => removedSpace.id !== space.id)
}
const loadRemoteRemovedSpaces = async () => {
  let removedSpaces
  state.loading.spaces = true
  removedSpaces = await store.dispatch('api/getUserRemovedSpaces')
  state.loading.spaces = false
  if (!removedSpaces) { return }
  removedSpaces = removedSpaces.map(remote => {
    const localSpace = state.removedSpaces.find(local => {
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
const restoreSpace = (space) => {
  store.dispatch('currentSpace/restoreRemovedSpace', space)
  removeRemovedSpace(space)
}
const deleteSpace = (space) => {
  store.dispatch('currentSpace/deleteSpace', space)
  removeRemovedSpace(space)
}
const deleteAllSpaces = () => {
  store.dispatch('currentSpace/deleteAllRemovedSpaces')
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
    p
      span Restore Removed Items
      Loader(:visible="isLoading" :isSmall="true")
    .segmented-buttons
      button(@click.left="showCards" :class="{active: state.cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Cards in Space
      button(@click.left="showSpaces" :class="{active: !state.cardsVisible}")
        img.icon(src="@/assets/remove.svg")
        span Spaces

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
    section.results-actions
      button(@click="toggleDeleteAllConfirmationIsVisible" v-if="!state.deleteAllConfirmationIsVisible")
        img.icon(src="@/assets/remove.svg")
        span Delete All
      template(v-if="state.deleteAllConfirmationIsVisible")
        p
          span Permanently delete all removed {{cardsOrSpacesLabel}} and uploads?
        .segmented-buttons
          button(@click.left.stop="toggleDeleteAllConfirmationIsVisible")
            img.icon.cancel(src="@/assets/add.svg")
            span Cancel
          button.danger(@click.left.stop="deleteAll")
            img.icon(src="@/assets/remove.svg")
            span Delete All

    ul.results-list
      template(v-for="item in items" :key="item.id")
        li(@click.left="restore(item)" tabindex="0" v-on:keyup.enter="restore(item)" :data-item-id="item.id")
          .badge
            img.undo.icon(src="@/assets/undo.svg")
          .name {{item.name}}
          button.small-button(v-if="!isRemoveConfirmationVisible(item)" @click.left.stop="showRemoveConfirmation(item)")
            img.icon(src="@/assets/remove.svg")

          .remove-confirmation(v-if="isRemoveConfirmationVisible(item)")
            p Permanently delete?
            .segmented-buttons
              button(@click.left.stop="hideRemoveConfirmation")
                img.icon.cancel(src="@/assets/add.svg")
              button.danger(@click.left.stop="deleteItem(item)")
                img.icon(src="@/assets/remove.svg")
                span Delete
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
  li
    justify-content space-between
    button
      margin-left auto
  .name
    white-space nowrap
    overflow hidden
    text-overflow ellipsis
    max-width calc(100% - 56px)
  .remove-confirmation
    margin-left 6px
    min-width 130px
    text-align right
    .segmented-buttons
      margin-top 5px
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
      border-radius var(--entity-radius) !important
</style>
