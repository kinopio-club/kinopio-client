<template lang="pug">
dialog.about.narrow(v-if="visible" :open="visible" @click="closeDialogs")
  section
    p Kinopio is the thinking, diagramming, and planning tool for your hardest problems.
    .button-wrap
      button(@click.stop="toggleWhatsNewIsVisible" :class="{active: whatsNewIsVisible}")
        span What's New
        img.updated.icon(src="@/assets/updated.gif" v-if="newStuffIsUpdated")
      WhatsNew(:visible="whatsNewIsVisible" :newStuff="newStuff")
  section
    .row
      .button-wrap
        button(@click.stop="toggleSupportIsVisible" :class="{active: supportIsVisible}") Support
        Support(:visible="supportIsVisible")

    .button-wrap(v-if="isMobile")
      button(@click.stop="toggleAddToHomescreenIsVisible" :class="{active: addToHomescreenIsVisible}")
        span(v-if="isIOS")
          img.icon(src="@/assets/apple.svg")
          span Kinopio for IOS
        span(v-if="isAndroid")
          img.icon(src="@/assets/homescreen.svg")
          span Kinopio for Android
      AddToHomescreen(:visible="addToHomescreenIsVisible")

</template>

<script>
import Support from '@/components/dialogs/Support.vue'
import WhatsNew from '@/components/dialogs/WhatsNew.vue'
import AddToHomescreen from '@/components/dialogs/AddToHomescreen.vue'
import utils from '@/utils.js'

export default {
  name: 'About',
  components: {
    Support,
    WhatsNew,
    AddToHomescreen
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      supportIsVisible: false,
      newStuffIsUpdated: false,
      whatsNewIsVisible: false,
      addToHomescreenIsVisible: false,
      newStuff: [],
      isIOS: false,
      isAndroid: false,
      isMobile: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.supportIsVisible = false
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
    this.isIOS = utils.isIOS()
    this.isAndroid = utils.isAndroid()
  },
  methods: {
    toggleSupportIsVisible () {
      const isVisible = this.supportIsVisible
      this.closeDialogs()
      this.supportIsVisible = !isVisible
    },
    toggleWhatsNewIsVisible () {
      const isVisible = this.whatsNewIsVisible
      this.closeDialogs()
      this.whatsNewIsVisible = !isVisible
      this.newStuffIsUpdated = false
    },
    toggleAddToHomescreenIsVisible () {
      const isVisible = this.addToHomescreenIsVisible
      this.closeDialogs()
      this.addToHomescreenIsVisible = !isVisible
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
      this.whatsNewIsVisible = false
      this.addToHomescreenIsVisible = false
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
  top calc(100% - 6px)
  .hidden
    display none
  .updated
    margin 0
    margin-left 3px

</style>
