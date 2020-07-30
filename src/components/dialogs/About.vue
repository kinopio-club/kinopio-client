<template lang="pug">
dialog.about.narrow(v-if="visible" :open="visible" @click="closeDialogs")
  section
    .row
      p Kinopio is the visual thinking tool for new ideas and hard problems.
    .row
      .button-wrap
        button(@click.stop="toggleWhatsNewIsVisible" :class="{active: whatsNewIsVisible}")
          span What's New
          img.updated.icon(src="@/assets/updated.gif" v-if="newStuffIsUpdated")
        WhatsNew(:visible="whatsNewIsVisible" :newStuff="newStuff")
    .row(v-if="!userIsUpgraded")
      .button-wrap
        button(@click.stop="triggerUpgradeUserIsVisible")
          span Upgrade for Unlimited
    .row
      .button-wrap
        button(@click.stop="toggleHelpAndAboutIsVisible" :class="{active: helpAndAboutIsVisible}")
          span Help and About
        HelpAndAbout(:visible="helpAndAboutIsVisible")
      .button-wrap
        a(href="https://help.kinopio.club/api")
          button API →

  section
    .row
      .button-wrap
        button(@click.stop="toggleKeyboardShortcutsIsVisible" :class="{active: keyboardShortcutsIsVisible}")
          span Keyboard Shortcuts
        KeyboardShortcuts(:visible="keyboardShortcutsIsVisible")
    .button-wrap(v-if="isMobile")
      button(@click.stop="toggleAddToHomescreenIsVisible" :class="{active: addToHomescreenIsVisible}")
        span(v-if="isIPhone")
          img.icon(src="@/assets/apple.svg")
          span Kinopio for IOS
        span(v-if="isAndroid")
          img.icon(src="@/assets/homescreen.svg")
          span Kinopio for Android
      AddToHomescreen(:visible="addToHomescreenIsVisible")

</template>

<script>
import WhatsNew from '@/components/dialogs/WhatsNew.vue'
import AddToHomescreen from '@/components/dialogs/AddToHomescreen.vue'
import KeyboardShortcuts from '@/components/dialogs/KeyboardShortcuts.vue'
import HelpAndAbout from '@/components/dialogs/HelpAndAbout.vue'
import utils from '@/utils.js'

export default {
  name: 'About',
  components: {
    WhatsNew,
    AddToHomescreen,
    KeyboardShortcuts,
    HelpAndAbout
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      helpAndAboutIsVisible: false,
      whatsNewIsVisible: false,
      addToHomescreenIsVisible: false,
      keyboardShortcutsIsVisible: false,
      newStuff: [],
      isIPhone: false,
      isAndroid: false,
      isMobile: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.whatsNewIsVisible = false
        this.addToHomescreenIsVisible = false
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
    this.isMobile = utils.isMobile()
    this.isIPhone = utils.isIPhone()
    this.isAndroid = utils.isAndroid()
  },
  computed: {
    newStuffIsUpdated () { return this.$store.state.newStuffIsUpdated },
    userIsUpgraded () { return this.$store.state.currentUser.isUpgraded }
  },
  methods: {
    toggleHelpAndAboutIsVisible () {
      const isVisible = this.helpAndAboutIsVisible
      this.closeDialogs()
      this.helpAndAboutIsVisible = !isVisible
    },
    toggleWhatsNewIsVisible () {
      const isVisible = this.whatsNewIsVisible
      this.closeDialogs()
      this.whatsNewIsVisible = !isVisible
      this.$store.commit('newStuffIsUpdated', false)
    },
    toggleAddToHomescreenIsVisible () {
      const isVisible = this.addToHomescreenIsVisible
      this.closeDialogs()
      this.addToHomescreenIsVisible = !isVisible
    },
    toggleKeyboardShortcutsIsVisible () {
      const isVisible = this.keyboardShortcutsIsVisible
      this.closeDialogs()
      this.keyboardShortcutsIsVisible = !isVisible
    },
    async getNewStuff () {
      const response = await fetch('https://api.are.na/v2/channels/kinopio-what-s-new/contents?direction=desc')
      const data = await response.json()
      return data
    },
    checkNewStuffIsUpdated (latestUpdateId) {
      const userlastReadId = parseInt(this.$store.state.currentUser.lastReadNewStuffId)
      const newStuffIsUpdated = Boolean(userlastReadId !== latestUpdateId)
      this.$store.commit('newStuffIsUpdated', newStuffIsUpdated)
    },
    closeDialogs () {
      this.helpAndAboutIsVisible = false
      this.whatsNewIsVisible = false
      this.addToHomescreenIsVisible = false
      this.keyboardShortcutsIsVisible = false
    },
    triggerUpgradeUserIsVisible () {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('triggerUpgradeUserIsVisible')
    }
  },
  watch: {
    visible (visible) {
      if (visible && this.newStuff.length) {
        this.checkNewStuffIsUpdated(this.newStuff[0].id)
      }
      if (visible) {
        this.closeDialogs()
      }
    }
  }
}
</script>

<style lang="stylus">
.about
  top calc(100% - 6px) !important
  .updated
    margin 0
    margin-left 3px
</style>
