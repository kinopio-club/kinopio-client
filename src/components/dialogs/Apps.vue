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
    ol
      li
        span Download and install
        a(href="https://webcatalog.app")
          button WebCatalog →
      li
        a(href="https://webcatalog.app/catalog/kinopio")
          button Install Kinopio →
    img.icon.screenshot(src="@/assets/screenshot-app-macos.png")
</template>

<script>
import utils from '@/utils.js'

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
  data () {
    return {
      dialogHeight: null,
      isDesktop: true
      // isIPhone: false,
      // isAndroid: false
    }
  },
  methods: {
    toggleIsDesktop (value) {
      this.isDesktop = value
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
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.apps
  top calc(100% - 6px) !important
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

  .row
    margin-bottom 0
  .screenshot
    margin-top 10px

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
