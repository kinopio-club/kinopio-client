<template lang="pug">
dialog.keyboard-shortcuts.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Keyboard Shortcuts
  section
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
    p yolo
</template>

<script>
export default {
  name: 'KeyboardShortcuts',
  props: {
    visible: Boolean
  }
  // data () {
  //   return {
  //     isIOS: false,
  //     isAndroid: false
  //   }
  // },
  // mounted () {
  //   this.isIOS = utils.isIOS()
  //   this.isAndroid = utils.isAndroid()
  //   shouldRestoreUrlPath = true
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       if (shouldRestoreUrlPath) {
  //         shouldRestoreUrlPath = false
  //         this.restoreUrlPath()
  //       }
  //     }
  //   })
  // },
  // methods: {
  //   stripUrlPath () {
  //     title = document.title
  //     pathname = window.location.pathname
  //     window.history.replaceState({}, title, '/')
  //   },
  //   restoreUrlPath () {
  //     window.history.replaceState({}, title, pathname)
  //   }
  // },
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       this.stripUrlPath()
  //     } else {
  //       this.restoreUrlPath()
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.keyboard-shortcuts
  overflow auto
  max-height calc(100vh - 280px)
  // @media(max-height 500px)
  //   top initial !important
  //   bottom 8px

</style>
