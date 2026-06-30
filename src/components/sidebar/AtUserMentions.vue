<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import OfflineBadge from '@/components/OfflineBadge.vue'
import ItemList from '@/components/ItemList.vue'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'

const globalStore = useGlobalStore()
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
  unsubscribes = () => {
    globalActionUnsubscribe()
    cardActionUnsubscribe()
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
  // state.taskFiltersIsVisible = false
}
const updateScopeIsCurrentSpace = async (value) => {
  if (globalStore.sidebarScopeIsCurrentSpace === value) { return }
  globalStore.sidebarScopeIsCurrentSpace = value
  globalStore.sidebarAtUserMentionsItemsBySpace = null
  updateItems()
}
const scopeIsCurrentSpace = computed(() => globalStore.sidebarScopeIsCurrentSpace)

// items

const itemsBySpace = computed(() => globalStore.sidebarAtUserMentionsItemsBySpace)
const isItems = computed(() => Boolean(state.cards.length))

// update

const updateItems = () => {
  if (scopeIsCurrentSpace.value) {
    state.cards = cardStore.getCardsAtUserMentionsCurrentUser
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
      globalStore.sidebarAtUserMentionsItemsBySpace = await apiStore.getUserAtUserMentions()
    }
    // update items
    globalStore.sidebarAtUserMentionsItemsBySpace.forEach(space => {
      state.cards = state.cards.concat(space.cards)
    })
  } catch (error) {
    console.error('🚒 updateItemsBySpace', error)
    state.isError = true
  }
  state.isLoading = false
}

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
</script>

<template lang="pug">
.at-user-mentions(v-if="props.visible" :style="styles" @click.stop="closeDialogs")
  section
    .row.title-row
      div
        .title-label-wrap
          UserLabelInline(:user="currentUser" :shouldHideName="true" :isAtMention="true")
          span.title-label Mentions
        Loader(:visible="state.isLoading" :isSmall="true")
        OfflineBadge

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
        span to assign users to cards

  //- items
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
  .at-user-mentions
    overflow auto
    border-top 1px solid var(--primary-border)
    min-height 160px
    .title-label-wrap
      > .title-label
        vertical-align -1px
    .button-wrap
      margin 0
    .loader
      vertical-align -1px
      margin-left 6px
    .offline-badge
      display inline-block
      margin-left 5px
    .user-label-inline
      .anon-avatar
        vertical-align 2px
</style>
