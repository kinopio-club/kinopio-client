<template lang="pug">
section.ai-images-progress(v-if="currentUserIsSignedIn" :class="{'margin-bottom-zero': currentUserIsUpgraded && !showAIImageHistoryButton}")
  p {{AIImagesThisMonth}}/{{AIImagesLimit}} AI prompts used
    span(v-if="currentUserIsUpgraded") {{' '}}this month
  progress(:value="AIImagesThisMonth" :max="AIImagesLimit")
  .row(v-if="showAIImageHistoryButton")
    .button-wrap.history-button
      button(@click.stop="triggerAIImagesIsVisible")
        img.icon.flower(src="@/assets/flower.svg")
        span AI History
  //- upgrade
  .row(v-if="!currentUserIsUpgraded")
    button.upgrade-button(@click="triggerUpgradeUserIsVisible")
      span Upgrade to get 50 AI prompts each month
</template>

<script>
// import utils from '@/utils.js'

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
    AIImagesThisMonth () { return this.$store.getters['currentUser/AIImagesThisMonth'].length },
    AIImagesLimit () { return this.$store.getters['currentUser/AIImagesLimit'] }

  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'AIImageGeneration')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    triggerUpgradeUserIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'AIImageGeneration')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },

    triggerAIImagesIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'AIImageGeneration')
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
