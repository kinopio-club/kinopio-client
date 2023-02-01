<script setup>
import CardsCreatedProgress from '@/components/CardsCreatedProgress.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

defineProps({
  visible: Boolean
})

const url = computed(() => utils.kinopioDomain() + '/refer/' + store.state.currentUser.id)

const copyUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(this.url)
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
    p Refer a Friend
  section
    section.subsection
      p Get 20 free cards when someone you refer signs up
      button(@click.left="copyUrl")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Referral URL
  section
    .row
      p
        span.badge.secondary 0
        span people referred so far
    .row
      p
        span.badge.secondary 0
        span free cards earned

    CardsCreatedProgress()
</template>

<style lang="stylus">
.refer
  top calc(100% - 8px)
  left initial
  right 8px
</style>
