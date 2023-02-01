<script setup>
import CardsCreatedProgress from '@/components/CardsCreatedProgress.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// onMounted(() => {
//   console.log(`the component is now mounted.`, store.state.currentSpace)
// })

defineProps({
  visible: Boolean
})
// const emit = defineEmits(['updateCount'])

// const state = reactive({
//   count: 0
// })

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
section.component-name(v-if="visible")
  .row
    div
      p Refer a Friend
      p.badge.info You get +20 extra free cards when they sign up
  .row
    CardsCreatedProgress
  .row
    .url-textarea.single-line
      span {{url}}
    .input-button-wrap(@click.left="copyUrl")
      button.small-button
        img.icon.copy(src="@/assets/copy.svg")
  .row
    button(@click.left="copyUrl")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy Refer URL

</template>

<style lang="stylus">
// .component-name
</style>
