<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import FreeLimitFAQ from '@/components/dialogs/FreeLimitFAQ.vue'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeChildDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  freeLimitFAQIsVisible: false
})

const cardsCreatedCount = computed(() => userStore.cardsCreatedCount || 0)
const freeCardsCreatedLimit = computed(() => consts.freeCardsCreatedLimit)

const triggerUpgradeUserIsVisible = () => {
  const currentUserIsSignedIn = userStore.getUserIsSignedIn
  globalStore.closeAllDialogs()
  if (currentUserIsSignedIn) {
    globalStore.triggerUpgradeUserIsVisible()
  } else {
    globalStore.triggerSignUpOrInIsVisible()
  }
}

const toggleFreeLimitFAQIsVisible = () => {
  const value = !state.freeLimitFAQIsVisible
  globalStore.triggerCloseChildDialogs()
  state.freeLimitFAQIsVisible = value
}
const closeChildDialogs = () => {
  state.freeLimitFAQIsVisible = false
}
</script>

<template lang="pug">
section.subsection.cards-created-progress(@click="closeChildDialogs")
  .row
    p
      img.icon.card(src="@/assets/card.svg")
      span {{cardsCreatedCount}}/{{freeCardsCreatedLimit}} free cards created
    .button-wrap
      button.small-button(@click.stop="toggleFreeLimitFAQIsVisible" :class="{active: state.freeLimitFAQIsVisible}")
        span(title="Free Limit FAQ") ?
      FreeLimitFAQ(:visible="state.freeLimitFAQIsVisible")
  progress(:value="cardsCreatedCount" :max="freeCardsCreatedLimit")
  .row
    .button-wrap
      button(@click="triggerUpgradeUserIsVisible")
        span Upgrade for Unlimited
</template>

<style lang="stylus">
.cards-created-progress
  width 100%
  .row
    display flex
    justify-content space-between
    align-items center
    margin-bottom 0
    .button-wrap,
    .small-button
      margin-top 0
  progress
    margin-bottom 10px
    margin-top 10px
</style>
