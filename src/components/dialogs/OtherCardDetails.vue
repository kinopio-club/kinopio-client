<script setup>
import { reactive, computed, onMounted, onUpdated, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import consts from '@/consts.js'
import OtherSpacePreview from '@/components/OtherSpacePreview.vue'

const store = useStore()
const cardStore = useCardStore()
const userStore = useUserStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    // update otherCard if dialog is visible before otherCard is loaded
    if (mutation.type === 'updateOtherItems') {
      if (!visible.value) { return }
      const parentCard = cardStore.getCard(parentCardId.value)
      let otherCard = store.getters.otherCardById(parentCard.linkToCardId)
      otherCard = utils.clone(otherCard)
      store.commit('currentSelectedOtherItem', otherCard)
    }
  })
})

const state = reactive({
  errorMaxCharacterLimit: false
})

const visible = computed(() => {
  const isVisible = store.state.otherCardDetailsIsVisible
  if (isVisible) {
    textareaStyles()
    focusTextarea()
    updateErrorMaxCharacterLimit()
    scrollIntoView()
  }
  return isVisible
})
const otherSpace = computed(() => store.getters.otherSpaceById(otherCard.value.spaceId))
const otherCard = computed(() => store.state.currentSelectedOtherItem)
const url = computed(() => utils.urlFromSpaceAndCard({ spaceId: otherSpace.value.id, cardId: otherCard.value.id }))
const canEditOtherCard = computed(() => {
  const canEditCard = userStore.getUserIsCardCreator(otherCard.value)
  if (canEditCard) { return true }
  const isMemberOfOtherSpace = userStore.getUserIsSpaceMember(otherSpace.value)
  return isMemberOfOtherSpace
})
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)

// dialog styles

const styles = computed(() => {
  const position = store.state.otherItemDetailsPosition
  let zoom = store.getters.spaceCounterZoomDecimal
  if (store.state.isTouchDevice) {
    zoom = 1 / utils.visualViewport().scale
  }
  const left = `${position.x + 8}px`
  const top = `${position.y + 8}px`
  return { transform: `scale(${zoom})`, left, top }
})
const scrollIntoView = async () => {
  await nextTick()
  const dialog = document.querySelector('dialog.other-card-details')
  store.commit('scrollElementIntoView', { element: dialog })
}

// textarea styles

const textarea = ref(null)
const textareaStyles = async () => {
  await nextTick()
  if (!textarea.value) { return }
  textarea.value.style.height = textarea.value.scrollHeight + 1 + 'px'
}
const focusTextarea = async () => {
  await nextTick()
  if (!textarea.value) { return }
  textarea.value.focus()
}

// edit parent card

const parentCardId = computed(() => store.state.currentSelectedOtherItem.parentCardId)
const cardDetailsIsVisibleForCardId = computed(() => store.state.cardDetailsIsVisibleForCardId)
const showCardDetails = () => {
  store.commit('otherCardDetailsIsVisible', false)
  cardStore.showCardDetails(parentCardId.value)
}

// edit card

const maxCardCharacterLimit = () => { return consts.cardCharacterLimit }
const updateName = async (newName) => {
  const spaceId = otherCard.value.spaceId
  const card = { id: otherCard.value.id, name: newName }
  // update local
  store.commit('updateCardNameInOtherItems', card)
  store.commit('triggerUpdateOtherCard', card.id)
  updateOtherNameInCurrentSpace({ card, spaceId })
  // update input
  textareaStyles()
  updateErrorMaxCharacterLimit(newName)
  cardStore.updateCardDimensions(card)
  // update remote
  await store.dispatch('api/addToQueue', { name: 'updateCard', body: card, spaceId })
}
const updateOtherNameInCurrentSpace = ({ card, spaceId }) => {
  const currentSpaceId = store.state.currentSpace.id
  if (currentSpaceId !== spaceId) { return }
  cardStore.updateCard(card)
}
const updateErrorMaxCharacterLimit = (newName) => {
  const name = newName || otherCard.value.name
  if (!name) { return }
  state.errorMaxCharacterLimit = name.length >= maxCardCharacterLimit()
}

// select card

const selectCard = (card) => {
  store.dispatch('closeAllDialogs')
  store.dispatch('focusOnCardId', card.id)
}
const changeSpace = (spaceId) => {
  if (store.state.currentSpace.id === spaceId) { return }
  const space = { id: spaceId }
  store.dispatch('closeAllDialogs')
  store.dispatch('currentSpace/changeSpace', space)
}
const selectSpaceCard = () => {
  const isCardInCurrentSpace = otherCard.value.spaceId === store.state.currentSpace.id
  if (isCardInCurrentSpace) {
    selectCard(otherCard.value)
  } else {
    store.commit('loadSpaceFocusOnCardId', otherCard.value.id)
    changeSpace(otherCard.value.spaceId)
  }
}
</script>

<template lang="pug">
dialog.narrow.other-card-details(v-if="visible" :open="visible" :style="styles" @click.left.stop ref="dialog")
  //- edit parent card
  section.edit-card(v-if="!cardDetailsIsVisibleForCardId && parentCardId")
    button(@click="showCardDetails") Edit Card
  section
    template(v-if="otherCard.id")
      //- space
      .row
        OtherSpacePreview(:otherSpace="otherSpace" :isStatic="true" :url="url")
      //- edit
      template(v-if="canEditOtherCard")
        section.subsection.textarea-wrap
          textarea.name(
            ref="textarea"
            rows="1"
            :value="otherCard.name"
            @input="updateName($event.target.value)"
            :maxlength="maxCardCharacterLimit()"
            placeholder="Type here, or paste a URL"
          )
        .row(v-if="state.errorMaxCharacterLimit")
          .badge.danger
            img.icon.cancel(src="@/assets/add.svg")
            span Max Length
      //- badges
      template(v-else)
        .row
          p {{otherCard.name}}
        .row
          .badge.info
            img.icon(src="@/assets/unlock.svg")
            span Read Only
          .badge.danger(v-if="otherCard.isRemoved")
            img.icon(src="@/assets/remove.svg")
            span Removed
      //- jump to
      .row
        a(:href="url")
          button(@click.stop.prevent="selectSpaceCard" @keyup.enter.prevent="selectSpaceCard")
            span Jump to Card{{' '}}
            img.icon.visit(src="@/assets/visit.svg")

    template(v-else)
      .row(v-if="isLoadingOtherItems")
        Loader(:visible="true")
      .row(v-else)
        .badge.danger Card not found or is private

</template>

<style lang="stylus">
dialog.other-card-details
  cursor auto
  transform-origin top left
  section.edit-card
    background-color var(--secondary-background)
  .row-title
    margin-left 4px
  .badges-wrap
    flex-wrap wrap
  .textarea-wrap,
  textarea
    margin 0
    width 100%
  section
    p
      word-wrap break-word
      width 100%
  .other-space-preview
    pointer-events none
</style>
