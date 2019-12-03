<template lang="pug">
dialog.about(v-if="visible" :open="visible" @click="closeDialogs")
  section.kaomoji-section
    p ༼ つ ◕_◕ ༽つ
    p Kinopio is a thinking and planning tool for your hardest problems.
    p It works how our brains work.
    .button-wrap
      button(@click.stop="toggleSupportIsVisible" :class="{active: supportIsVisible}") Support
      Support(:visible="supportIsVisible")
    .button-wrap
      button(@click.stop="toggleBetaNotesIsVisible" :class="{active: betaNotesIsVisible}") Beta Notes
      BetaNotes(:visible="betaNotesIsVisible")
  section
    .button-wrap
      button(@click.stop="toggleWhatsNewIsVisible" :class="{active: whatsNewIsVisible}")
        span What's New?
        img.updated.icon(src="@/assets/updated.gif" v-if="newStuffIsUpdated")
      WhatsNew(:visible="whatsNewIsVisible" :newStuff="newStuff")

</template>

<script>
import Support from '@/components/dialogs/Support.vue'
import BetaNotes from '@/components/dialogs/BetaNotes.vue'
import WhatsNew from '@/components/dialogs/WhatsNew.vue'

export default {
  name: 'About',
  components: {
    Support,
    BetaNotes,
    WhatsNew
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      supportIsVisible: false,
      betaNotesIsVisible: false,
      newStuffIsUpdated: false,
      whatsNewIsVisible: false,
      newStuff: []
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.supportIsVisible = false
        this.betaNotesIsVisible = false
        this.whatsNewIsVisible = false
      }
    })
  },
  async mounted () {
    const isOffline = !this.$store.state.isOnline
    if (isOffline) { return }
    const data = await this.getNewStuff()
    const newStuff = data.contents
    this.newStuff = newStuff.slice(0, 5)
    this.checkNewStuffIsUpdated(newStuff[0].id)
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
    toggleWhatsNewIsVisible () {
      const isVisible = this.whatsNewIsVisible
      this.closeDialogs()
      this.whatsNewIsVisible = !isVisible
      this.newStuffIsUpdated = false
    },
    async getNewStuff () {
      const response = await fetch('https://api.are.na/v2/channels/kinopio-updates/contents?direction=desc')
      const data = await response.json()
      return data
    },
    checkNewStuffIsUpdated (latestUpdateId) {
      const userlastReadId = parseInt(this.$store.state.currentUser.lastReadNewStuffId)
      this.newStuffIsUpdated = Boolean(userlastReadId !== latestUpdateId)
    },
    closeDialogs () {
      this.supportIsVisible = false
      this.betaNotesIsVisible = false
      this.whatsNewIsVisible = false
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
