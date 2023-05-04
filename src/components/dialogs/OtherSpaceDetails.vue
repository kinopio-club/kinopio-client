<script setup>
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import UserList from '@/components/UserList.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const visible = computed(() => store.state.otherSpaceDetailsIsVisible)
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
const otherSpace = computed(() => store.state.currentSelectedOtherItem)
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const spaceUsers = computed(() => otherSpace.value.users)
const url = computed(() => `${utils.kinopioDomain()}/${otherSpace.value.id}`)

// jump to space
const changeSpace = () => {
  store.dispatch('currentSpace/changeSpace', { space: otherSpace.value, isRemote: true })
  store.dispatch('closeAllDialogs')
}

// edit parent card
const parentCardId = computed(() => store.state.currentSelectedOtherItem.parentCardId)
const cardDetailsIsVisibleForCardId = computed(() => store.state.cardDetailsIsVisibleForCardId)
const showCardDetails = () => {
  store.commit('otherSpaceDetailsIsVisible', false)
  store.dispatch('currentCards/showCardDetails', parentCardId.value)
}

</script>

<template lang="pug">
dialog.narrow.other-space-details(v-if="visible" :open="visible" :style="styles" @click.left.stop ref="dialog")
  //- edit card
  section.edit-card(v-if="!cardDetailsIsVisibleForCardId && parentCardId")
    button(@click="showCardDetails") Edit Card
  section
    template(v-if="otherSpace.id")
      .row
        BackgroundPreview(:space="otherSpace")
        .row-title {{ otherSpace.name }}
      .row.badges-wrap
        UserList(:users="spaceUsers" :isClickable="false")
      .row
        a(:href="url")
          button(@click.stop.prevent="changeSpace" @keyup.enter.prevent="changeSpace")
            MoonPhase(v-if="otherSpace.moonPhase" :moonPhase="otherSpace.moonPhase")
            span Jump to Space{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
    template(v-else)
      .row(v-if="isLoadingOtherItems")
        Loader(:visible="true")
      .row(v-else)
        .badge.danger Space not found or is private

</template>

<style lang="stylus">
dialog.other-space-details
  cursor auto
  transform-origin top left
  section.edit-card
    background-color var(--secondary-background)
  .row-title
    margin-left 4px
  .badges-wrap
    flex-wrap wrap
</style>
