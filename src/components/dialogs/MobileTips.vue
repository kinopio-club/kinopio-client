<template lang="pug">
dialog.narrow.background(v-if="visible" :open="visible" @click.left="closeDialogs")
  section
    p Mobile Tips

  section(
    @mouseup.stop
    @touchend.stop
  )
    p blah blah

</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'MobileTips',
  props: {
    visible: Boolean
  }
  // computed: {
  // currentSpace () { return this.$store.state.currentSpace },
  // },
  // methods: {
  // },
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       this.closeDialogs()
  //       this.clearErrors()
  //     } else {
  //       if (this.error.isNotImageUrl) {
  //         this.removeBackground()
  //       }
  //     }
  //   },
  // }
}
</script>

<style lang="stylus">
// .mobile-tips
//   @media(max-width 435px)
//     left -100px
//   &.narrow
//     width 215px
//   textarea
//     margin-bottom 6px
//   .error-container
//     margin-bottom 10px
//   .uploading-container
//     position relative
//     img
//       border-radius 3px
//     .badge
//       display inline-block
//       &.absolute
//         position absolute
//         top 6px
//         left 6px
//   .hidden
//     display none

</style>
