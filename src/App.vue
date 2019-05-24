<template lang='pug'>
.app(
  @mouseup="stopInteractions"
  @touchend="stopInteractions"
)
  Painting
  router-view
  Header
</template>

<script>
import Header from '@/components/Header.vue'
import Painting from '@/components/Painting.vue'

export default {
  name: 'app',
  components: {
    Header,
    Painting
  },
  methods: {
    stopInteractions () {
      this.$store.commit('currentUserIsDrawingConnection', false)
      this.$store.commit('drawingConnectionOrigin', {})
      this.$store.commit('currentUserIsPainting', false)
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

footer
  position fixed
  right 0
  bottom 0
</style>
