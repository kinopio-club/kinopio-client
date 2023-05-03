<script setup>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import UserList from '@/components/UserList.vue'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  console.log(`🍆 the dialog is now mounted.`, store.state.currentSpace)
})

const visible = computed(() => store.state.otherCardDetailsIsVisible)
const styles = computed(() => {
  const position = store.state.otherItemDetailsPosition
  const isChildDialog = cardDetailsIsVisibleForCardId
  let zoom = store.getters.spaceZoomDecimal
  if (isChildDialog.value) {
    zoom = 1
  }
  const x = zoom * position.x
  const y = zoom * position.y
  let scale
  if (utils.isSignificantlyPinchZoomed()) {
    scale = store.state.pinchCounterZoomDecimal
  }
  console.log('☔️☔️', otherCard.value, canEdit.value) // othercard
  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: `scale(${scale})`
  }
})
const otherCard = computed(() => store.state.currentSelectedOtherItem)
// const otherSpace = computed(() => store.getters.otherSpaceById(otherCard.value.spaceId))
const canEdit = computed(() => store.getters['currentUser/cardIsCreatedByCurrentUser'](otherCard.value))
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)

// edit parent card
const parentCardId = computed(() => store.state.currentSelectedOtherItem.parentCardId)
const cardDetailsIsVisibleForCardId = computed(() => store.state.cardDetailsIsVisibleForCardId)
const showCardDetails = () => {
  store.commit('otherCardDetailsIsVisible', false)
  store.dispatch('currentCards/showCardDetails', parentCardId.value)
}

</script>

<template lang="pug">
dialog.narrow.other-card-details(v-if="visible" :open="visible" :style="styles" @click.left.stop ref="dialog")
  //- edit card
  section.edit-card(v-if="!cardDetailsIsVisibleForCardId && parentCardId")
    button(@click="showCardDetails") Edit Card
  section
    template(v-if="isLoadingOtherItems")
      Loader(v-if="true")
    //- TODO v-else-if handle if no data , card not found or private
    template(v-else)
      .row
        p hihi name
        //- -> url btn on top of name if name contains url

        //- jump to card
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
</style>
