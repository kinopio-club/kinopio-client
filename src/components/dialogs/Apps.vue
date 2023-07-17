<template lang="pug">
dialog.apps.narrow(v-if="visible" @click.stop :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .segmented-buttons
      button(:class="{active: isDesktop}" @click="toggleIsDesktop(true)")
        span Desktop
      button(:class="{active: !isDesktop}" @click="toggleIsDesktop(false)")
        span Mobile

  section(v-if="isDesktop")
    .logo-wrap
      .app-frame
        .logo-image
      span.arrow →
      img.icon(src="@/assets/computer.svg")

    p Download Kinopio
    .row
      p for
        .badge.info Mac, Windows, Linux
    .row
      a(href="https://dl.todesktop.com/201223j48l03cxi" download)
        button Download App

  section(v-if="!isDesktop")
    .logo-wrap
      .app-frame
        .logo-image
      span.arrow →
      img.icon(src="@/assets/phone.svg")

    .segmented-buttons
      button(@click="toggleIsAndroid(false)" :class="{ active: !isAndroid }")
        span iOS
      button(@click="toggleIsAndroid(true)" :class="{ active: isAndroid }")
        span Android

    template(v-if="isAndroid")
      p Kinopio is a web-app which you can add to
        span.badge.info Android
        ol
          li
            span Tap the Menu button
            .badge.info
              img.icon(src="@/assets/android-menu.svg")
            span at the top of the screen
          li
            span Then tap
              .badge.info
                span Add to Home screen
    template(v-else)
      p Kinopio is a web-app which you can add to your
        span.badge.info iPhone or iPad
        ol
          li
            span Tap the Share button
            .badge.info
              img.icon(src="@/assets/share.svg")
            span at the bottom of the screen
          li
            span Then tap
              .badge.info
                span Add to Home Screen
                img.icon.add(src="@/assets/add.svg")
              span (you'll need to scroll down)

</template>

<script>
import utils from '@/utils.js'

let shouldRestoreUrlPath, title, pathname

export default {
  name: 'Apps',
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  mounted () {
    this.updateCurrentDeviceView()
    this.isAndroid = utils.isAndroid()
    shouldRestoreUrlPath = true
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        const element = this.$refs.dialog
        if (!element) { return }
        if (shouldRestoreUrlPath) {
          shouldRestoreUrlPath = false
          this.restoreUrlPath()
        }
      }
    })
  },

  data () {
    return {
      dialogHeight: null,
      isDesktop: true,
      isAndroid: false
    }
  },
  methods: {
    toggleIsAndroid (value) {
      this.isAndroid = value
    },
    toggleIsDesktop (value) {
      this.isDesktop = value
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    stripUrlPath () {
      title = document.title
      pathname = window.location.pathname
      let url = '/'
      // temporary url change for bookmarking, doesn't update vue-router history
      history.replaceState(history.state, '', url)
    },
    restoreUrlPath () {
      // temporary url change for bookmarking, doesn't update vue-router history
      history.replaceState({}, title, pathname)
    },
    updateCurrentDeviceView () {
      if (this.$store.getters.isTouchDevice) {
        this.isDesktop = false
      } else {
        this.isDesktop = true
      }
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateCurrentDeviceView()
        this.updateDialogHeight()
        this.stripUrlPath()
      } else {
        this.restoreUrlPath()
      }
    }
  }
}
</script>

<style lang="stylus">
.apps
  // top calc(100% - 6px) !important
  overflow auto

  .logo-wrap
    display flex
    align-items center
    margin-bottom 10px
    .arrow
      margin-left 5px
      margin-right 5px
  .logo-image
    width 35px
    height 30px
    background-repeat no-repeat
    background-size cover
    background-position center
  .app-frame
    border 1px solid var(--secondary-background)
    background-color var(--secondary-background)
    border-radius 10px
    padding 6px
    display inline-block

  .badge
    display inline
    margin-left 6px
  .add
    padding-left 5px

  // copied from WhatsNew.vue
  ol
    margin 0
    margin-top 2px
    padding-left 15px
    li
      padding-top 10px
      margin-left 5px
      user-select text

</style>
