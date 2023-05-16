<script setup>
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import UserList from '@/components/UserList.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    // update otherSpace if dialog is visible before otherSpace is loaded
    if (mutation.type === 'updateOtherItems') {
      if (!visible.value) { return }
      const parentCard = store.getters['currentCards/byId'](parentCardId.value)
      let otherSpace = store.getters.otherSpaceById(parentCard.linkToSpaceId)
      otherSpace = utils.clone(otherSpace)
      store.commit('currentSelectedOtherItem', otherSpace)
    }
  })
})

// state

const visible = computed(() => {
  const isVisible = store.state.otherSpaceDetailsIsVisible
  if (isVisible) {
    scrollIntoView()
  }
  return isVisible
})

const otherSpace = computed(() => store.state.currentSelectedOtherItem)
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const spaceUsers = computed(() => otherSpace.value.users)

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
  const dialog = document.querySelector('dialog.other-space-details')
  utils.scrollIntoView(dialog)
}

// select space

const changeSpace = () => {
  if (otherSpace.value.isInvite) {
    window.location = otherSpace.value.url
  } else {
    store.dispatch('currentSpace/changeSpace', { space: otherSpace.value, isRemote: true })
    store.dispatch('closeAllDialogs')
  }
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
      .row.badges-wrap
        template(v-if="otherSpace.isInvite")
          .badge.info Invite
        template(v-if="otherSpace.isRemoved")
          .badge.danger
            img.icon(src="@/assets/remove.svg")
            span Removed
        UserList(:users="spaceUsers" :isClickable="false")
      .row
        BackgroundPreview(:space="otherSpace")
        .row-title {{ otherSpace.name }}
      .row
        a(:href="otherSpace.url")
          button(@click.stop.prevent="changeSpace" @keyup.enter.prevent="changeSpace")
            MoonPhase(v-if="otherSpace.moonPhase" :moonPhase="otherSpace.moonPhase")
            template(v-if="otherSpace.isInvite")
              img.icon.add(src="@/assets/add.svg")
              span Join Space{{' '}}
            template(v-else)
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
  li
    padding 0
</style>
