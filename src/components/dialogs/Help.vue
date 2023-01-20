<template lang="pug">
dialog.help-and-about.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Help and Support
  section
    .row.contact
      img.email.icon(src="@/assets/email.gif")
      p For your questions, comments, and requests
    .row
      .button-wrap
        a(href="mailto:hi@kinopio.club")
          button hi@kinopio.club
  section
    .row
      p Guides, topics, and policies
    .row
      .button-wrap
        a(href="https://help.kinopio.club")
          button Help Site →
      .button-wrap
        a(href="https://help.kinopio.club/api")
          button API Docs →

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'Help',
  props: {
    visible: Boolean
  },
  data () {
    return {
      dialogHeight: null
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  methods: {
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
.help-and-about
  max-height calc(100vh - 260px)
  overflow auto
  .contact
    align-items flex-start
    margin-top 0
    p
      margin-top 0
    button
      margin-top 10px

    .email
      width 60px
      margin-right 10px

</style>
