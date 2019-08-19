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
      updatesIsNew: false,
      updates: []
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.feedbackIsVisible = false
        this.betaNotesIsVisible = false
        this.updatesIsVisible = false
      }
    })
  },
  mounted () {
    this.getUpdates().then(data => {
      const updates = data.contents
      this.updates = updates.slice(0, 4)
      this.isUpdatesIsNew(updates[0].id)
    })
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
    async getUpdates () {
      const response = await fetch('https://api.are.na/v2/channels/kinopio-updates/contents?direction=desc')
      const data = await response.json()
      return data
    },
    isUpdatesIsNew (latestUpdateId) {
      const userlastRead = this.$store.state.currentUser.lastReadUpdateId
      if (userlastRead !== latestUpdateId) {
        this.updatesIsNew = true
      }
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
