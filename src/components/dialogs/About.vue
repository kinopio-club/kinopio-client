<template lang="pug">
dialog.about.narrow(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :class="{ overflow: !childDialogIsVisible }")
  section
    .row.title-row
      p About Kinopio
      span
        button.small-button(@click.left="refreshBrowser" title="Refresh")
          img.refresh.icon(src="@/assets/refresh.svg")

  section
    .row
      p Thinking canvas for new ideas and hard problems
    .row
      .button-wrap
        button(@click.stop="toggleHelpIsVisible" :class="{active: helpIsVisible}")
          span Help
        Help(:visible="helpIsVisible")
      .button-wrap
        button(@click.left.stop="toggleWhatsNewIsVisible" :class="{active: whatsNewIsVisible}")
          span What's New
          img.updated.icon(src="@/assets/updated.gif" v-if="newStuffIsUpdated")
        WhatsNew(:visible="whatsNewIsVisible" :newStuff="newStuff")
    //- .row
    //-   a(href="https://kinopio.club/pop-up-shop-u9XxpuIzz2_LvQUAayl65")
    //-     button
    //-       img.icon(src="@/assets/sticker.svg")
    //-       span Pop Up Shop{{' '}}
              //- img.icon.visit(src="@/assets/visit.svg")
  section(v-if="!isAddPage")
    //- .row
    //-   a(href="https://help.kinopio.club/posts/extensions/")
    //-     button
    //-       span Browser Extensions{{' '}}
    //-       img.icon.visit(src="@/assets/visit.svg")
    .row
      .button-wrap
        button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: appsAndExtensionsIsVisible}")
          span Apps and Extensions
        AppsAndExtensions(:visible="appsAndExtensionsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleKeyboardShortcutsIsVisible")
          .badge.keyboard-shortcut.badge-in-button ?
          span Keyboard Shortcuts
  section
    .row
      p 100% funded and made possible by people like you
    .row
      .button-wrap
        a(href="https://discord.gg/h2sR45Nby8")
          button
            span Discord{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        a(href="https://club.kinopio.club")
          button
            span Forum{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
    .row
      AboutMe
    .row(v-if="!isSecureAppContextIOS")
      .button-wrap
        button(@click.left.stop="triggerDonateIsVisible")
          img.icon(src="@/assets/heart-empty.svg")
          span Donate
    .row
      .button-wrap
        a(href="https://kinopio.club/social-media-plezJhK98WCzh52YOYSLR")
          button
            span Social Media{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
</template>

<script>
import WhatsNew from '@/components/dialogs/WhatsNew.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'
import Help from '@/components/dialogs/Help.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import AboutMe from '@/components/AboutMe.vue'

import dayjs from 'dayjs'

const initTime = dayjs(new Date())
let checkKinopioUpdatesIntervalTimer

export default {
  name: 'About',
  components: {
    WhatsNew,
    AppsAndExtensions,
    Help,
    AboutMe
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
      appsAndExtensionsIsVisible: false,
      helpIsVisible: false,
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
    await this.updateNewStuff()
    if (!utils.arrayHasItems(this.newStuff)) { return }
    this.checkNewStuffIsUpdated(this.newStuff[0].id)
    checkKinopioUpdatesIntervalTimer = setInterval(() => {
      this.checkIfKinopioUpdatesAreAvailable()
    }, 1000 * 60 * 60 * 1) // 1 hour
  },
  beforeUnmount () {
    clearInterval(checkKinopioUpdatesIntervalTimer)
  },
  computed: {
    newStuffIsUpdated () { return this.$store.state.newStuffIsUpdated },
    isAddPage () { return this.$store.state.isAddPage },
    childDialogIsVisible () {
      return this.whatsNewIsVisible || this.appsAndExtensionsIsVisible || this.helpIsVisible
    },
    isSecureAppContextIOS () { return consts.isSecureAppContextIOS }
  },
  methods: {
    triggerDonateIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerDonateIsVisible')
    },
    refreshBrowser () {
      window.location.reload()
    },
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
    toggleAppsAndExtensionsIsVisible () {
      const isVisible = this.appsAndExtensionsIsVisible
      this.closeDialogs()
      this.appsAndExtensionsIsVisible = !isVisible
    },
    toggleHelpIsVisible () {
      const isVisible = this.helpIsVisible
      this.closeDialogs()
      this.helpIsVisible = !isVisible
    },
    async updateNewStuff () {
      try {
        let data = await this.$store.dispatch('api/getNewStuff')
        if (!data) { return }
        data = data.items.slice(0, 20)
        data = data.map(item => {
          item.summary = utils.convertHTMLEntities(item.summary)
          return item
        })
        this.newStuff = data
      } catch (error) {
        console.error('🚒 updateNewStuff', error)
      }
    },
    checkNewStuffIsUpdated (latestUpdateId) {
      if (this.isAddPage) { return }
      const userlastReadId = this.$store.state.currentUser.lastReadNewStuffId
      const newStuffIsUpdated = userlastReadId !== latestUpdateId
      this.$store.commit('newStuffIsUpdated', newStuffIsUpdated)
    },
    async checkIfKinopioUpdatesAreAvailable () {
      await this.updateNewStuff()
      if (!this.newStuff.length) { return }
      let newest = this.newStuff[0]
      newest = dayjs(newest.date_published)
      const timeSinceNewest = initTime.diff(newest, 'minute')
      if (timeSinceNewest < 0) {
        this.$store.commit('notifyKinopioUpdatesAreAvailable', true)
      }
    },
    closeDialogs () {
      this.whatsNewIsVisible = false
      this.appsAndExtensionsIsVisible = false
      this.helpIsVisible = false
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
        this.$store.commit('shouldExplicitlyHideFooter', true)
      } else {
        this.$store.commit('shouldExplicitlyHideFooter', false)
      }
    }
  }
}
</script>

<style lang="stylus">
.about
  top calc(100% - 6px) !important
  &.overflow
    overflow auto
  .updated
    margin 0
    margin-left 3px
  .keyboard-shortcut
    padding 0 4px !important
  .about-video
    border-radius var(--entity-radius)
</style>
