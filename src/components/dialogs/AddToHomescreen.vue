<template lang="pug">
dialog.add-to-homescreen(v-if="visible" :open="visible" @click.stop)
  section
    .logo-wrap
      .app-frame
        .logo-image
      span.arrow →
      img.icon(src="@/assets/phone.svg")

    span(v-if="isIOS")
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
              span (You might need to scroll down)

    span(v-if="isAndroid")
      p Kinopio is a web-app which you can add directly to your Android Phone
        ol
          li
            span Tap the Menu button
            .badge.info
              img.icon(src="@/assets/android-menu.svg")
            span at the top of the screen
          li
            span Then tap
              .badge.info
                span Add to Home screen

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

  .logo-wrap
    display flex
    align-items center
    .arrow
      margin-left 5px
      margin-right 5px
  .logo-image
    width 35px
    height 30px
    background-repeat no-repeat
    background-size cover
    background-position center
  .app-frame
    border 1px solid var(--secondary-background)
    background-color var(--secondary-background)
    border-radius 10px
    padding 6px
    display inline-block

  .badge
    display inline
    margin-left 6px
  .add
    padding-left 5px

  // copied from WhatsNew.vue
  ol
    margin 0
    margin-top 2px
    padding-left 15px
    li
      padding-top 10px
      margin-left 5px
      user-select text

</style>
