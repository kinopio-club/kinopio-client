<template lang="pug">
dialog.about(v-if="visible" :open="visible" @click="closeDialogs")
  section.kaomoji-section
    p ༼ つ ◕_◕ ༽つ
    .button-wrap
      button(@click.stop="toggleFeedbackIsVisible" :class="{active: feedbackIsVisible}") Feedback
      Feedback(:visible="feedbackIsVisible")

    .button-wrap
      button(@click.stop="toggleBetaNotesIsVisible" :class="{active: betaNotesIsVisible}") Beta Notes
      BetaNotes(:visible="betaNotesIsVisible")
  section
    .button-wrap
      button(@click.stop="toggleUpdatesIsVisible" :class="{active: updatesIsVisible}")
        span Updates
        template(v-if="updatesIsNew")
          img.new-updates(src="@/assets/new.gif")
      Updates(:visible="updatesIsVisible" :updates="updates")
</template>

<script>
import Feedback from '@/components/dialogs/Feedback.vue'
import BetaNotes from '@/components/dialogs/BetaNotes.vue'
import Updates from '@/components/dialogs/Updates.vue'

export default {
  name: 'About',
  components: {
    Feedback,
    BetaNotes,
    Updates
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      feedbackIsVisible: false,
      betaNotesIsVisible: false,
      updatesIsVisible: false,
      updatesIsNew: true,
      updates: []
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.feedbackIsVisible = false
        this.betaNotesIsVisible = false
      }
    })
  },
  mounted () {
    this.getUpdatess()
  },
  methods: {
    toggleFeedbackIsVisible () {
      const isVisible = this.feedbackIsVisible
      this.closeDialogs()
      this.feedbackIsVisible = !isVisible
    },
    toggleBetaNotesIsVisible () {
      const isVisible = this.betaNotesIsVisible
      this.closeDialogs()
      this.betaNotesIsVisible = !isVisible
    },
    toggleUpdatesIsVisible () {
      const isVisible = this.updatesIsVisible
      this.closeDialogs()
      this.updatesIsVisible = !isVisible
    },
    getUpdates () {
      console.log('🌹 fetch are.na and (normalize?) and then pass it through to updatess, and then see if its new news')
      // https://api.are.na/v2/channels/kinopio-new-stuff/contents
      // last item index is most recent (maybe i can flip the order on the board tho, then i can use per param)
      // otherwise i'll just slice the result from the end and maybe array flip it on my end before doing stuff w it
    },
    closeDialogs () {
      this.feedbackIsVisible = false
      this.betaNotesIsVisible = false
      this.updatesIsVisible = false
    }
  }
}
</script>

<style lang="stylus">
.about
  top calc(100% - 8px)
  .hidden
    display none
  .kaomoji-section
    padding-top 14px
  .new-updates
    vertical-align -1px
    margin-left 3px
</style>
