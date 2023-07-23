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

<script>
import consts from '@/consts.js'

export default {
  name: 'AIImagesProgress',
  props: {
    showAIImageHistoryButton: Boolean
  },
  data () {
    return {
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
    AIImagesThisMonthCount () { return this.$store.getters['currentUser/AIImagesThisMonthCount'] },
    AIImagesLimit () { return this.$store.getters['currentUser/AIImagesLimit'] },
    AIImageLimitUpgradedUser () { return consts.AIImageLimitUpgradedUser }

  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    triggerUpgradeUserIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },

    triggerAIImagesIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerAIImagesIsVisible')
    }
  }
}
</script>

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
