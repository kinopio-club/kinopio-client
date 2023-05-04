<script setup>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import UserList from '@/components/UserList.vue'
import consts from '@/consts.js'

import { reactive, computed, onMounted, onUpdated, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// state
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
  }
  return isVisible
})

// dialog styles
const styles = computed(() => {
  const position = store.state.otherItemDetailsPosition
  const isChildDialog = cardDetailsIsVisibleForCardId
  let zoom = store.getters.spaceCounterZoomDecimal
  if (isChildDialog.value) {
    zoom = 1
  }
  if (store.state.isTouchDevice) {
    zoom = 1 / utils.visualViewport().scale
  }
  const left = `${position.x + 8}px`
  const top = `${position.y + 8}px`
  return { transform: `scale(${zoom})`, left, top }
})

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
  // update local
  store.commit('updateCardNameInOtherItems', { id: otherCard.value.id, name: newName })
  store.commit('triggerUpdateOtherCard', otherCard.value.id)
  console.log(newName)
  // update remote
  // TODO
  // console.log(newName, store.state.otherItems.cards)
  textareaStyles()
}

// jump to card
const changeSpace = () => {
  console.log('🌻')
  // store.dispatch('currentSpace/changeSpace', { space: otherSpace.value, isRemote: true })
  // store.dispatch('closeAllDialogs')
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
      .row(v-if="canEdit")
        .textarea-wrap
          textarea.name(
            ref="textarea"
            rows="1"
            :value="otherCard.name"
            @input="updateName($event.target.value)"
            :maxlength="maxCardLength()"
          )
      //- read
      .row(v-else)
        p {{otherCard.name}}
      .row
        a(:href="url")
          button(@click.stop.prevent="changeSpace" @keyup.enter.prevent="changeSpace")
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
