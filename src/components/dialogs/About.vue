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
      button(@click.stop="toggleNewStuffIsVisible" :class="{active: newStuffIsVisible}")
        span New Stuff
        template(v-if="newStuffIsNew")
          img.new.icon(src="@/assets/new.gif")
      NewStuff(:visible="newStuffIsVisible" :newStuff="newStuff")
</template>

<script>
import Feedback from '@/components/dialogs/Feedback.vue'
import BetaNotes from '@/components/dialogs/BetaNotes.vue'
import NewStuff from '@/components/dialogs/NewStuff.vue'

export default {
  name: 'About',
  components: {
    Feedback,
    BetaNotes,
    NewStuff
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      feedbackIsVisible: false,
      betaNotesIsVisible: false,
      newStuffIsVisible: false,
      newStuffIsNew: false,
      newStuff: []
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.feedbackIsVisible = false
        this.betaNotesIsVisible = false
        this.newStuffIsVisible = false
      }
    })
  },
  mounted () {
    this.getNewStuff().then(data => {
      const newStuff = data.contents
      this.newStuff = newStuff.slice(0, 2)
      this.isNewStuffIsNew(newStuff[0].id)
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
    toggleNewStuffIsVisible () {
      const isVisible = this.newStuffIsVisible
      this.closeDialogs()
      this.newStuffIsVisible = !isVisible
    },
    async getNewStuff () {
      const response = await fetch('https://api.are.na/v2/channels/kinopio-updates/contents?direction=desc')
      const data = await response.json()
      return data
    },
    isNewStuffIsNew (latestUpdateId) {
      const userlastReadId = this.$store.state.currentUser.lastReadNewStuffId
      console.log(userlastReadId, latestUpdateId)
      if (userlastReadId !== latestUpdateId) {
        this.newStuffIsNew = true
      }
    },
    closeDialogs () {
      this.feedbackIsVisible = false
      this.betaNotesIsVisible = false
      this.newStuffIsVisible = false
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
  .new
    margin 0
    margin-left 3px
</style>
