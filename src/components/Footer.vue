<template lang="pug">
footer
  span Beta {{buildHash}}
  button(@click="toggleFeedbackIsVisible" :class="{active: feedbackIsVisible}") Feedback
  Feedback(:visible="feedbackIsVisible")

</template>

<script>
import Feedback from '@/components/dialogs/Feedback.vue'

export default {
  name: 'Footer',
  components: {
    Feedback
  },
  data () {
    return {
      feedbackIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.feedbackIsVisible = false
      }
    })
  },
  mounted () {
    console.log('🐢 kinopio-client', this.buildHash)
  },
  computed: {
    buildHash () {
      const regex = /(app\.)([a-z0-9])\w+/
      const scripts = Array.from(document.querySelectorAll('script'))
      const path = scripts.find(script => {
        const src = script.src
        return src.includes('app')
      })
      let hash = path.src.match(regex)[0] // app.768db305407f4c847d44
      return hash.replace('app.', '') // 768db305407f4c847d44
    }
  },
  methods: {
    toggleFeedbackIsVisible () {
      const isVisible = this.feedbackIsVisible
      this.feedbackIsVisible = !isVisible
    }
  }
}
</script>

<style lang="stylus">
footer
  position fixed
  right 8px
  bottom 8px
  button
    margin-left 6px
  dialog
    left initial
    right 8px
    top initial
    bottom calc(100% - 4px)
</style>
