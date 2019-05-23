<template lang='pug'>
  .app(
    @mouseup="stopConnecting"
    @touchend="stopConnecting"
  )
    Painting
    router-view
    Header
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
  },
  methods: {
    stopConnecting () {
      console.log('stopConnecting')
    }
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

.hidden
  display none !important

</style>
