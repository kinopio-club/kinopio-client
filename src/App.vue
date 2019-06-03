<template lang='pug'>
.app
  MagicInk
  router-view
  Header
</template>

<script>
import Header from '@/components/Header.vue'
import MagicInk from '@/components/MagicInk.vue'

export default {
  components: {
    Header,
    MagicInk
  },
  methods: {
  }
}
</script>

<style lang="stylus">
:root
  --primary-background white
  --primary black
  --secondary-background #e3e3e3

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box

body
  margin 0
  color var(--primary)
  background-color var(--primary-background)

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

</style>
