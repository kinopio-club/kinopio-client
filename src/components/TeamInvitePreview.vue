<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

onMounted(() => {
  console.log(`🐴 the component is now mounted.`, props.card, props.teamInviteUrl, props.selectedColor)
  // store.subscribe(mutation => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
})

const props = defineProps({
  card: Object,
  teamInviteUrl: String,
  selectedColor: String
})
// const state = reactive({
//   count: 0
// })

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.log('💁‍♀️', value)
//   }
// })

// const themeName = computed(() => store.state.currentUser.theme)
// const incrementBy = () => {
//   const theme = themeName.value
//   console.log('🧢', theme)
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }

const url = computed(() => {
  console.log('♥️♥️♥️♥️♥️♥️', props.card, props.teamInviteUrl, props.selectedColor)
  if (props.teamInviteUrl) {
    return props.teamInviteUrl
  }
  const urls = utils.urlsFromString(props.card.name)
  return urls.find(url => utils.urlIsTeamInvite(url))
})
</script>

<template lang="pug">
.team-invite-preview
  .badge(:title="url")
    .row
      span.badge.info Invite
      span team label
      span Team Name
    .row
      span.badge.danger Keep Private
</template>

<style lang="stylus">
// .team-invite-preview
</style>
