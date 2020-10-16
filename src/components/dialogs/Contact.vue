<template lang="pug">
dialog.contact(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Contact
  section
    .row
      img.email(src="@/assets/email.gif")
      //- p I made Kinopio to help you connect your thoughts, ideas, and plans together.
      p Please send questions, comments, and requests to hi@kinopio.club
        a(href="mailto:hi@kinopio.club")
          button Email hi@kinopio.club

  section
    .button-wrap
      a(href="https://are.na/kinopio")
        button Are.na →
    .button-wrap
      a(href="https://twitter.com/KinopioClub")
        button Twitter →

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'Contact',
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
      dialogHeight: null
    }
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
.contact
  overflow auto
  max-height calc(100vh - 250px)
  .row
    margin-top 0
    align-items flex-start
    p
      margin-top 0
    button
      margin-top 10px
  .email
    width 60px
    margin-right 10px
</style>
