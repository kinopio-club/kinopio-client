<template lang="pug">
dialog.help-and-support.narrow(v-if="visible" :open="visible" @click.stop="closeDialogs")
  section
    p Help and Support
  section
    p How to use Kinopio, and other help topics
    .button-wrap
      a(href="https://help.kinopio.club")
        button Help Topics →
  section
    .row
      .button-wrap
        button(@click.stop="toggleContactIsVisible" :class="{active: contactIsVisible}")
          span Contact
        Contact(:visible="contactIsVisible")
    //- .row
    //-   .button-wrap
    //-     a(href="https://help.kinopio.club")
    //-       button Community Forum →

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
.help-and-support
  .button-wrap
    .contact
      @media(max-height 500px)
        top -100px
</style>
