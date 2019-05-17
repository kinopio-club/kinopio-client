<template lang='pug'>
  .app
    Header
    Space(msg="helloooo")
    canvas#painting
</template>

<script>
import Header from '@/components/Header.vue'
import Space from '@/components/Space.vue'

export default {
  name: 'app',
  components: {
    Header,
    Space
  }
}

</script>

<style lang="stylus">
primary-background = cyan
primary = black

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box

body
  margin 0
  color primary

.app
  background-color primary-background

header
  margin-bottom 1rem
  a
    margin-right 5px
</style>
