<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  console.log(`🍆 the component is now mounted.`, props.linkToCardId)
  // todo api get card by id
  // todo save in state othercards
  // create global dialog like linkdetails
})

const props = defineProps({
  visible: Boolean,
  linkToCardId: String
})
const emit = defineEmits(['showCardSpaceLinkDetailsIsVisible'])

const showCardSpaceLinkDetailsIsVisible = () => {
  emit('showCardSpaceLinkDetailsIsVisible', props.linkToCardId)
}
</script>

<template lang="pug">
.card-link-preview.badge.button-badge(v-if="visible" @click="showCardSpaceLinkDetailsIsVisible")
  span props.linkToCardId: {{ props.linkToCardId }}
</template>

<style lang="stylus">
.card-link-preview
  background var(--secondary-active-background)
  margin-right 0 !important
</style>
