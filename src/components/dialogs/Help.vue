<template lang="pug">
dialog.help-and-about.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" :class="{'child-dialog-is-visible': contactIsVisible}")
  section
    p Help and About
  section
    .row
      p How to use Kinopio, and other help topics
    .row
      .button-wrap
        a(href="https://help.kinopio.club")
          button Help Topics →
    .row
      .button-wrap
        a(href="https://join.slack.com/t/kinopio-club/shared_invite/zt-garivnp1-qMbj9Nk2bo5wI78hgxkD_A")
          button
            span Community Slack →
    .row
      .button-wrap
        button(@click.left.stop="toggleContactIsVisible" :class="{active: contactIsVisible}")
          span Contact
        Contact(:visible="contactIsVisible")

  section
    .row
      p Kinopio is self-funded and entirely supported by people like you
    .row
      .button-wrap
        a(href="https://help.kinopio.club/posts/who-makes-kinopio")
          button Who Makes Kinopio? →
    //- .row
    //-   .button-wrap
    //-     a(href="https://pketh.org")
    //-       button Blog →
</template>

<script>
import Contact from '@/components/dialogs/Contact.vue'

export default {
  name: 'Help',
  components: {
    Contact
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      contactIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.contactIsVisible = false
      }
    })
  },
  methods: {
    toggleContactIsVisible () {
      const isVisible = this.contactIsVisible
      this.closeDialogs()
      this.contactIsVisible = !isVisible
    },
    closeDialogs () {
      this.contactIsVisible = false
    }
  }
}
</script>

<style lang="stylus">
.help-and-about
  max-height calc(100vh - 260px)
  overflow auto
  &.child-dialog-is-visible
    overflow initial !important
</style>
