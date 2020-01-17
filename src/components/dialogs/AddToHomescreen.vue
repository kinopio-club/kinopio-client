<template lang="pug">
dialog.add-to-homescreen(v-if="visible" :open="visible" @click.stop)
  section
    //- span(v-if="isIOS")
    p [img]
    //- icon in frame for ios
    //- just icon for android
    p Kinopio is a web-app which you can add directly to your iPhone or iPad
      ol
        li
          span Tap the Share button
          .badge.info
            img.icon(src="@/assets/share.svg")
          span at the bottom of the screen
        li
          span Then tap
            .badge.info
              span Add to Home Screen
              img.icon.add(src="@/assets/add.svg")
      p (You might need to scroll down)

  //- section isAndroid
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'AddToHomescreen',
  props: {
    visible: Boolean
  },
  data () {
    return {
      isIOS: false,
      isAndroid: false
    }
  },
  mounted () {
    this.isIOS = utils.isIOS()
    this.isAndroid = utils.isAndroid()
  }
}
</script>

<style lang="stylus">
.add-to-homescreen
  overflow auto
  max-height calc(100vh - 175px)
  @media(max-width 340px)
    max-height calc(100vh - 200px)
  .badge
    display inline
    margin-left 6px
  .add
    padding-left 5px

  // copied from WhatsNew
  ol
    margin 0
    margin-top 2px
    padding-left 15px
    li
      padding-top 10px
      margin-left 5px
      user-select text

</style>
