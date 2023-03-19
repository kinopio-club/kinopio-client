<template lang="pug">
dialog.about(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p About Kinopio
  section
    .row
      p Spatial thinking for building ideas and solving problems
    .row
      .button-wrap
        a(href="https://help.kinopio.club/about")
          button About →
      .button-wrap
        a(href="https://blog.kinopio.club")
          button Blog →
      .button-wrap
        a(href="https://help.kinopio.club")
          button Help →

    .row
      .button-wrap
        button(@click.left.stop="toggleWhatsNewIsVisible" :class="{active: whatsNewIsVisible}")
          span What's New
          img.updated.icon(src="@/assets/updated.gif" v-if="newStuffIsUpdated")
        WhatsNew(:visible="whatsNewIsVisible" :newStuff="newStuff")
    //- .row
    //-   a(href="https://kinopio.club/pop-up-shop-u9XxpuIzz2_LvQUAayl65")
    //-     button
    //-       img.icon(src="@/assets/sticker.svg")
    //-       span Pop Up Shop →
  section(v-if="!isAddPage")
    .row
      .button-wrap
        button(@click.left.stop="toggleKeyboardShortcutsIsVisible")
          .badge.keyboard-shortcut.badge-in-button ?
          span Keyboard Shortcuts
    .row
      .button-wrap
        button(@click.left.stop="toggleAppsIsVisible" :class="{active: appsIsVisible}")
          span Desktop and Mobile Apps
        Apps(:visible="appsIsVisible")
    .row
      a(href="https://help.kinopio.club/posts/extensions/")
        button
          span Browser Extensions →

  section
    .row
      p Kinopio is made possible by people like you
    .row
      .button-wrap
        a(href="https://discord.gg/h2sR45Nby8")
          button Discord →
      .button-wrap
        a(href="https://club.kinopio.club")
          button
            span Forum →
    .row
      .button-wrap
        a(href="https://twitter.com/kinopioclub")
          button Twitter →
      .button-wrap
        a(href="https://help.kinopio.club/api/")
          button API →

    video.about-video(autoplay loop muted playsinline)
      source(src="https://kinopio-updates.us-east-1.linodeobjects.com/anime-typing.mp4")

</template>

<script>
import WhatsNew from '@/components/dialogs/WhatsNew.vue'
import Apps from '@/components/dialogs/Apps.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'

const initTime = dayjs(new Date())
let checkKinopioUpdatesIntervalTimer

export default {
  name: 'About',
  components: {
    WhatsNew,
    Apps
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.whatsNewIsVisible = false
      }
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      whatsNewIsVisible: false,
      appsIsVisible: false,
      newStuff: [],
      isIPhone: false,
      isAndroid: false,
      isMobile: false,
      dialogHeight: null
    }
  },
  async mounted () {
    const isOffline = !this.$store.state.isOnline
    if (isOffline) { return }
    this.isMobile = utils.isMobile()
    this.isIPhone = utils.isIPhone()
    this.isAndroid = utils.isAndroid()
    const data = await this.getNewStuff()
    const newStuff = data.contents
    this.newStuff = newStuff.slice(0, 5)
    this.checkNewStuffIsUpdated(newStuff[0].id)
    checkKinopioUpdatesIntervalTimer = setInterval(() => {
      this.checkIfKinopioUpdatesAreAvailable()
    }, 1000 * 60 * 60 * 1) // 1 hour
  },
  beforeUnmount () {
    clearInterval(checkKinopioUpdatesIntervalTimer)
  },
  computed: {
    newStuffIsUpdated () { return this.$store.state.newStuffIsUpdated },
    isAddPage () { return this.$store.state.isAddPage }
  },
  methods: {
    toggleWhatsNewIsVisible () {
      const isVisible = this.whatsNewIsVisible
      this.closeDialogs()
      this.whatsNewIsVisible = !isVisible
      this.$store.commit('newStuffIsUpdated', false)
    },
    toggleKeyboardShortcutsIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerKeyboardShortcutsIsVisible')
    },
    toggleAppsIsVisible () {
      const isVisible = this.appsIsVisible
      this.closeDialogs()
      this.appsIsVisible = !isVisible
    },
    async getNewStuff () {
      const data = await this.$store.dispatch('api/getNewStuff')
      return data
    },
    checkNewStuffIsUpdated (latestUpdateId) {
      if (this.isAddPage) { return }
      const userlastReadId = parseInt(this.$store.state.currentUser.lastReadNewStuffId)
      const newStuffIsUpdated = Boolean(userlastReadId !== latestUpdateId)
      this.$store.commit('newStuffIsUpdated', newStuffIsUpdated)
    },
    async checkIfKinopioUpdatesAreAvailable () {
      const data = await this.getNewStuff()
      let newest = data.contents[0]
      newest = dayjs(newest.updated_at)
      const timeSinceNewest = initTime.diff(newest, 'minute')
      if (timeSinceNewest < 0) {
        this.$store.commit('notifyKinopioUpdatesAreAvailable', true)
      }
    },
    closeDialogs () {
      this.whatsNewIsVisible = false
      this.appsIsVisible = false
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible && this.newStuff.length) {
        this.checkNewStuffIsUpdated(this.newStuff[0].id)
      }
      if (visible) {
        this.closeDialogs()
        this.updateDialogHeight()
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
  .keyboard-shortcut
    padding 0 4px !important
  .about-video
    border-radius var(--entity-radius)
</style>
