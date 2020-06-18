<template lang="pug">
dialog.upgrade-user.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p hello hello
</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'UpgradeUser',
  props: {
    visible: Boolean
  },
  // data () {
  //   return {
  //     xyz: false
  //   }
  // },
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  // if (mutation.type === 'closeAllDialogs') {
  //   this.contactIsVisible = false
  //   this.whatsNewIsVisible = false
  //   this.addToHomescreenIsVisible = false
  // }
  //   })
  // },
  // async mounted () {
  //   this.isAndroid = utils.isAndroid()
  // },
  // computed: {
  // newStuffIsUpdated () { return this.$store.state.newStuffIsUpdated }
  // },
  methods: {
    // closeDialogs () {
    //   this.keyboardShortcutsIsVisible = false
    // }
  }
  // watch: {
  //   visible (visible) {
  // if (visible && this.newStuff.length) {
  //   this.checkNewStuffIsUpdated(this.newStuff[0].id)
  // }
  //   }
  // }
}
</script>

<style lang="stylus">
// .upgrade-user
//   left initial
//   right 8px
//   top calc(100% - 6px) !important
</style>
