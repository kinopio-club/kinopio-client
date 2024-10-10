<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import consts from '@/consts.js'
const store = useStore()

const props = defineProps({
  showAIImageHistoryButton: Boolean
})

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const currentUserIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const AIImagesThisMonthCount = computed(() => store.getters['currentUser/AIImagesThisMonthCount'])
const AIImagesLimit = computed(() => store.getters['currentUser/AIImagesLimit'])
const AIImageLimitUpgradedUser = computed(() => consts.AIImageLimitUpgradedUser)
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const triggerUpgradeUserIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerUpgradeUserIsVisible')
}

const triggerAIImagesIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerAIImagesIsVisible')
}
</script>

<template lang="pug">
section.ai-images-progress(v-if="currentUserIsSignedIn" :class="{'margin-bottom-zero': currentUserIsUpgraded && !showAIImageHistoryButton}")
  p {{AIImagesThisMonthCount}}/{{AIImagesLimit}} AI requests used
    span(v-if="currentUserIsUpgraded") {{' '}}this month
  progress(:value="AIImagesThisMonthCount" :max="AIImagesLimit")
  .row(v-if="showAIImageHistoryButton")
    .button-wrap.history-button
      button(@click.stop="triggerAIImagesIsVisible")
        img.icon.flower(src="@/assets/flower.svg")
        span AI History
  //- upgrade
  .row(v-if="!currentUserIsUpgraded")
    button.upgrade-button(@click="triggerUpgradeUserIsVisible")
      span Upgrade to get {{AIImageLimitUpgradedUser}} AI requests each month
</template>

<style lang="stylus">
.ai-images-progress
  .upgrade-button
    height initial
  progress
    margin-top 2px
    margin-bottom 10px
  &.margin-bottom-zero
    padding-bottom 0
</style>
