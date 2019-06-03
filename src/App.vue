<template lang='pug'>
#app.app(
  :style="elementSize"
)
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
  data () {
    return {
      width: 0,
      height: 0
    }
  },
  mounted () {
    this.updateAppElementSize()
    window.addEventListener('resize', this.updateAppElementSize)
    window.addEventListener('scroll', this.updateAppElementSize)
  },
  computed: {
    elementSize () {
      return {
        width: `${this.width}px`,
        height: `${this.height}px`
      }
    }
  },
  methods: {
    updateAppElementSize () {
      const body = document.body
      const html = document.documentElement
      this.width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      this.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
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

.app
  position relative

//
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
