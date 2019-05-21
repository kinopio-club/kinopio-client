<template lang='pug'>
  .app
    Header
    Space(msg="space")
    Painting
</template>

<script>
import Header from '@/components/Header.vue'
import Space from '@/components/Space.vue'
import Painting from '@/components/Painting.vue'

export default {
  name: 'app',
  components: {
    Header,
    Space,
    Painting
  }
}
</script>

<style lang="stylus">
:root
  --primary-background cyan
  --primary black
  --violet violet

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box

body
  margin 0
  color var(--primary)

.app
  background-color var(--primary-background)

header
  margin-bottom 1rem
  a
    margin-right 5px
</style>
