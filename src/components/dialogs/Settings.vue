<template lang="pug">
dialog.settings.narrow(v-if="visible" :open="visible")
  section
    p yo

</template>

<script>
export default {
  name: 'Settings',
  props: {
    visible: Boolean
  },
  data () {
    return {
      xyz: []
    }
  },
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       this.supportIsVisible = false
  //       this.betaNotesIsVisible = false
  //       this.whatsNewIsVisible = false
  //     }
  //   })
  // },
  methods: {
    // closeDialogs () {
    //   this.supportIsVisible = false
    //   this.betaNotesIsVisible = false
    //   this.whatsNewIsVisible = false
    // }
  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       this.checkNewStuffIsUpdated(this.newStuff[0].id)
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.about
  top calc(100% - 8px)
  .hidden
    display none
  .kaomoji-section
    padding-top 14px
  .updated
    margin 0
    margin-left 3px
</style>
