<template lang="pug">
dialog.apps.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Apps
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
      // if (mutation.type === 'closeAllDialogs') {
      //   this.addToHomescreenIsVisible = false
      // }
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
  computed: {
    // newStuffIsUpdated () { return this.$store.state.newStuffIsUpdated }
  },
  methods: {
    // toggleHelpIsVisible () {
    //   const isVisible = this.helpIsVisible
    //   this.closeDialogs()
    //   this.helpIsVisible = !isVisible
    // },
    // toggleWhatsNewIsVisible () {
    //   const isVisible = this.whatsNewIsVisible
    //   this.closeDialogs()
    //   this.whatsNewIsVisible = !isVisible
    //   this.$store.commit('newStuffIsUpdated', false)
    // },
    // toggleAddToHomescreenIsVisible () {
    //   const isVisible = this.addToHomescreenIsVisible
    //   this.closeDialogs()
    //   this.addToHomescreenIsVisible = !isVisible
    // },
    // toggleKeyboardShortcutsIsVisible () {
    //   const isVisible = this.keyboardShortcutsIsVisible
    //   this.closeDialogs()
    //   this.keyboardShortcutsIsVisible = !isVisible
    // },
    // toggleAppsIsVisible () {
    //   const isVisible = this.appsIsVisible
    //   this.closeDialogs()
    //   this.appsIsVisible = !isVisible
    // },
    // async getNewStuff () {
    //   const response = await fetch('https://api.are.na/v2/channels/kinopio-what-s-new/contents?direction=desc')
    //   const data = await response.json()
    //   return data
    // },
    // checkNewStuffIsUpdated (latestUpdateId) {
    //   const userlastReadId = parseInt(this.$store.state.currentUser.lastReadNewStuffId)
    //   const newStuffIsUpdated = Boolean(userlastReadId !== latestUpdateId)
    //   this.$store.commit('newStuffIsUpdated', newStuffIsUpdated)
    // },
    closeDialogs () {
      // this.helpIsVisible = false
      // this.whatsNewIsVisible = false
      // this.addToHomescreenIsVisible = false
      // this.keyboardShortcutsIsVisible = false
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  }
  // watch: {
  //   visible (visible) {
  //     if (visible && this.newStuff.length) {
  //       this.checkNewStuffIsUpdated(this.newStuff[0].id)
  //     }
  //     if (visible) {
  //       this.closeDialogs()
  //       this.updateDialogHeight()
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.apps
  top calc(100% - 6px) !important
</style>
