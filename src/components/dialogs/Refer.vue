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
  unusedCredit: 0,
  usersReferred: 0
})

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

const creditBadgeClass = computed(() => {
  if (state.unusedCredit) {
    return 'success'
  } else {
    return 'secondary'
  }
})
const usersReferredBadgeClass = computed(() => {
  if (state.usersReferred) {
    return 'success'
  } else {
    return 'secondary'
  }
})

</script>

<template lang="pug">
dialog.narrow.refer(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section(v-if="visible")
    p Earn Credits by Sharing Kinopio With Your Friends
  section
    section.subsection
      p You'll both get ${{consts.referralCreditAmount}} in credit when they sign up. There's no limit to the number of people you can refer
      button(@click.left="copyUrl")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Referral URL
  section
    .row
      p You have
        span.badge(:class="creditBadgeClass") ${{state.unusedCredit}}
        span credit, which will be applied to your next payment
    .row
      p
        span.badge(:class="usersReferredBadgeClass") {{state.usersReferred}}
        span people referred so far

</template>

<style lang="stylus">
.refer
  top calc(100% - 8px)
  left initial
  right 8px
  .badge
    vertical-align 0
</style>
