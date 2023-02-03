<script setup>
import CardsCreatedProgress from '@/components/CardsCreatedProgress.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

defineProps({
  visible: Boolean
})
const state = reactive({
  creditsUsed: 0,
  creditsEarned: 0,
  usersReferred: 0
})

const creditsUnused = computed(() => state.creditsEarned - state.creditsUsed)

const url = computed(() => utils.kinopioDomain() + '/refer/' + store.state.currentUser.id)
const copyUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(url.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

</script>

<template lang="pug">
dialog.narrow.refer(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section(v-if="visible")
    p Earn Credits
  section
    .row
      p
        span You'll both get a
        span.badge.success ${{consts.referralCreditAmount}} credit
        span when someone you refer signs up.
    .row
      p There's no limit on the amount of credits you can earn.

    section.subsection

      p Share Kinopio with your friends
      button(@click.left="copyUrl")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Referral URL

  section
    .row
      p Your Credits
    section.subsection.table-subsection
      section
        p {{state.usersReferred}} people referred so far
      section
        p ${{state.creditsEarned}} total credit earned
      section
        .badge.success ${{creditsUnused}} credit remaining for future payments

</template>

<style lang="stylus">
.refer
  top calc(100% - 8px)
  left initial
  right 8px
  .badge
    vertical-align 0
    color var(--primary)
  span + .badge
    margin-left 6px
    word-break break-all
  .subsection.table-subsection
    padding 0 8px
    section
      padding-left 0
      padding-right 0
    .badge
      margin 0
</style>
