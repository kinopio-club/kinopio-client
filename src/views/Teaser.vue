<template lang='pug'>
.meta-page

  h1 hello kinopio

  p modular synthesis

  h2 Get notified when Kinopio is in Beta

  form(
    name="beta-email"
    method="post"
  )

    // p Thanks, you're subscribed! (disable button)

    input(
      type="email"
      name="email"
      placeholder="space@jam.com"
    )

    label(for='newStuffInterest') Send me future updates too
      input(type="checkbox" id="newStuffInterest" name="newStuffInterest")

    button(type='submit') Notify Me

  h2 follow along with progress
  p are.na design

  p= "While you wait, enjoy some "
    a(href="http://mac.are.na/playlist/kinopio-bae-tracks") bae tracks

  .iframe-wrap(style='padding:51.9% 0 0 0;position:relative;' height="275")
    iframe(src='https://player.vimeo.com/video/337868593?autoplay=1&loop=1&title=0&byline=0&portrait=0' style='position:absolute;top:0;left:0;width:100%;height:100%;' frameborder='0' allow='autoplay')

</template>

<script>
export default {
  name: 'beta-email'
  // data () {
  //   return {
  //     notSent: true
  //   }
  // },
  // methods: {
  //   sendForm () {
  //     this.notSent = false
  //   }
  // }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus">
.meta-page
  max-width 600px
  width 95%
  margin 8px
  margin-top 60px
  position absolute
  pointer-events none
  img
    max-width 100%
    border-radius: 3px
form
  padding 8px
  background-color var(--secondary-background)
  border-radius 3px
  display inline-block
input
  margin-right 5px
a,
form,
iframe
  pointer-events all
.iframe-wrap
  max-width 100% !important
</style>
