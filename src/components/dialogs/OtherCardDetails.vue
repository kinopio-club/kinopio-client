<script setup>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import UserList from '@/components/UserList.vue'
import consts from '@/consts.js'

import { reactive, computed, onMounted, onUpdated, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    // update otherCard if dialog is visible before otherCard is loaded
    if (mutation.type === 'updateOtherItems') {
      if (!visible.value) { return }
      const parentCard = store.getters['currentCards/byId'](parentCardId.value)
      let otherCard = store.getters.otherCardById(parentCard.linkToCardId)
      otherCard = utils.clone(otherCard)
      store.commit('currentSelectedOtherItem', otherCard)
    }
  })
})

// state
const state = reactive({
  errorMaxCardLength: false
})
const otherCard = computed(() => store.state.currentSelectedOtherItem)
const url = computed(() => `${utils.kinopioDomain()}/${otherCard.value.spaceId}/${otherCard.value.id}`)
const canEdit = computed(() => store.getters['currentUser/cardIsCreatedByCurrentUser'](otherCard.value))
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)

// visible

const visible = computed(() => {
  const isVisible = store.state.otherCardDetailsIsVisible
  if (isVisible) {
    textareaStyles()
    focusTextarea()
    updateErrorMaxCardLength()
    scrollIntoView()
  }
  return isVisible
})

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
  utils.scrollIntoView(dialog)
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
  store.dispatch('currentCards/showCardDetails', parentCardId.value)
}

// edit card

const maxCardLength = () => { return consts.maxCardLength }
const updateName = (newName) => {
  const spaceId = otherCard.value.spaceId
  const card = { id: otherCard.value.id, name: newName }
  // update local
  store.commit('updateCardNameInOtherItems', card)
  store.commit('triggerUpdateOtherCard', card.id)
  updateOtherNameInCurrentSpace({ card, spaceId })
  // update remote
  store.dispatch('api/addToQueue', { name: 'updateCard', body: card, spaceId })
  // update input
  textareaStyles()
  updateErrorMaxCardLength(newName)
  store.dispatch('currentCards/updateDimensions', { cards: [card] })
}
const updateOtherNameInCurrentSpace = ({ card, spaceId }) => {
  const currentSpaceId = store.state.currentSpace.id
  if (currentSpaceId !== spaceId) { return }
  store.commit('currentCards/update', card)
}
const updateErrorMaxCardLength = (newName) => {
  const name = newName || otherCard.value.name
  if (!name) { return }
  state.errorMaxCardLength = name.length >= maxCardLength()
}

// select card

const selectCard = (card) => {
  store.dispatch('closeAllDialogs')
  store.dispatch('currentCards/showCardDetails', card.id)
}
const changeSpace = (spaceId) => {
  if (store.state.currentSpace.id === spaceId) { return }
  const space = { id: spaceId }
  store.dispatch('closeAllDialogs')
  store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
}
const selectSpaceCard = () => {
  const isCardInCurrentSpace = otherCard.value.spaceId === store.state.currentSpace.id
  if (isCardInCurrentSpace) {
    selectCard(otherCard.value)
  } else {
    store.commit('loadSpaceShowDetailsForCardId', otherCard.value.id)
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
      //- edit
      template(v-if="canEdit")
        section.subsection.textarea-wrap
          textarea.name(
            ref="textarea"
            rows="1"
            :value="otherCard.name"
            @input="updateName($event.target.value)"
            :maxlength="maxCardLength()"
          )
        .row(v-if="state.errorMaxCardLength")
          .badge.danger
            img.icon.cancel(src="@/assets/add.svg")
            span Max Length
      //- read
      template(v-else)
        .row
          p {{otherCard.name}}
        .row
          .badge.info
            img.icon(src="@/assets/unlock.svg")
            span Read Only

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
</style>
