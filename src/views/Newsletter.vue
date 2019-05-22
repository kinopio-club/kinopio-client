<template lang='pug'>
  .meta-page
    p Sign up to get notified when Kinopio is in Beta

    p I'll only email you once.

    .form-wrap
      form(netlify)
        input(type="email" name="email" placeholder="space@jam.com")
        button(type="submit") Send

    p= "while you wait, enjoy some "
      a(href="http://mac.are.na/playlist/kinopio-bae-tracks") bae tracks

    img(alt="bless this mess" src="@/assets/froggo-wip.png")

</template>

<script>
export default {
  name: 'newsletter'
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus">
.meta-page
  max-width 600px
  margin 8px
  margin-top 60px
  position absolute
  z-index 1
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
form
  pointer-events all
</style>
