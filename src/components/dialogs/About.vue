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
    button(@click="clearData")
      img.icon(src="@/assets/remove.svg")
      span Clear Data
    button(@click="exportToJSON")
      span Export Data
    a#downlaod-anchor.hidden
</template>

<script>
import Feedback from '@/components/dialogs/Feedback.vue'
import BetaNotes from '@/components/dialogs/BetaNotes.vue'

export default {
  name: 'About',
  components: {
    Feedback,
    BetaNotes
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      feedbackIsVisible: false,
      betaNotesIsVisible: false
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
  methods: {
    exportToJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.$store.state.currentSpace))
      const downloadAnchor = document.getElementById('downlaod-anchor')
      const spaceId = this.$store.state.currentSpace.id
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `kinopio-space-${spaceId}.json`)
      downloadAnchor.click()
    },
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
    closeDialogs () {
      this.feedbackIsVisible = false
      this.betaNotesIsVisible = false
    },
    clearData () {
      const spaceId = this.$store.state.currentSpace.id.toString()
      const spaceName = this.$store.state.currentSpace.name.toString()
      localStorage.removeItem(`space-${spaceId}`)
      this.$store.commit('currentSpace/restoreSpace', {
        id: spaceId,
        name: spaceName
      })
      this.$store.commit('currentSpace/cacheSpace')
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
</style>
