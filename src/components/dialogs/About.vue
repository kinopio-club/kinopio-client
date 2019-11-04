<template lang="pug">
dialog.about(v-if="visible" :open="visible" @click="closeDialogs")
  section.kaomoji-section
    p ༼ つ ◕_◕ ༽つ
    .button-wrap
      button(@click.stop="toggleSupportIsVisible" :class="{active: supportIsVisible}") Support
      Support(:visible="supportIsVisible")
    .button-wrap
      button(@click.stop="toggleBetaNotesIsVisible" :class="{active: betaNotesIsVisible}") Beta Notes
      BetaNotes(:visible="betaNotesIsVisible")
  section
    .button-wrap
      button(@click.stop="toggleRoadmapIsVisible" :class="{active: roadmapIsVisible}") Roadmap
      Roadmap(:visible="roadmapIsVisible")
    .button-wrap
      button(@click.stop="toggleNewStuffIsVisible" :class="{active: newStuffIsVisible}")
        span New Stuff
        img.updated.icon(src="@/assets/updated.gif" v-if="newStuffIsUpdated")
      NewStuff(:visible="newStuffIsVisible" :newStuff="newStuff")

</template>

<script>
import Support from '@/components/dialogs/Support.vue'
import BetaNotes from '@/components/dialogs/BetaNotes.vue'
import NewStuff from '@/components/dialogs/NewStuff.vue'
import Roadmap from '@/components/dialogs/Roadmap.vue'

export default {
  name: 'About',
  components: {
    Support,
    BetaNotes,
    NewStuff,
    Roadmap
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      supportIsVisible: false,
      betaNotesIsVisible: false,
      newStuffIsVisible: false,
      newStuffIsUpdated: false,
      roadmapIsVisible: false,
      newStuff: []
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.supportIsVisible = false
        this.betaNotesIsVisible = false
        this.newStuffIsVisible = false
        this.roadmapIsVisible = false
      }
    })
  },
  mounted () {
    this.getNewStuff().then(data => {
      const newStuff = data.contents
      this.newStuff = newStuff.slice(0, 5)
      this.checkNewStuffIsUpdated(newStuff[0].id)
    })
  },
  methods: {
    toggleSupportIsVisible () {
      const isVisible = this.supportIsVisible
      this.closeDialogs()
      this.supportIsVisible = !isVisible
    },
    toggleBetaNotesIsVisible () {
      const isVisible = this.betaNotesIsVisible
      this.closeDialogs()
      this.betaNotesIsVisible = !isVisible
    },
    toggleRoadmapIsVisible () {
      const isVisible = this.roadmapIsVisible
      this.closeDialogs()
      this.roadmapIsVisible = !isVisible
    },
    toggleNewStuffIsVisible () {
      const isVisible = this.newStuffIsVisible
      this.closeDialogs()
      this.newStuffIsVisible = !isVisible
      this.newStuffIsUpdated = false
    },
    async getNewStuff () {
      const response = await fetch('https://api.are.na/v2/channels/kinopio-updates/contents?direction=desc')
      const data = await response.json()
      return data
    },
    checkNewStuffIsUpdated (latestUpdateId) {
      const userlastReadId = this.$store.state.currentUser.lastReadNewStuffId
      this.newStuffIsUpdated = Boolean(userlastReadId !== latestUpdateId)
    },
    closeDialogs () {
      this.supportIsVisible = false
      this.betaNotesIsVisible = false
      this.newStuffIsVisible = false
      this.roadmapIsVisible = false
    }
  },
  watch: {
    visible (visible) {
      if (visible && this.newStuff.length) {
        this.checkNewStuffIsUpdated(this.newStuff[0].id)
      }
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
  .updated
    margin 0
    margin-left 3px
</style>
