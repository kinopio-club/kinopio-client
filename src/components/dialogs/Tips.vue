<template lang="pug">
dialog.tips.narrow(v-if="visible" @click.stop :open="visible" ref="dialog")
  section
    p Tips
    .button-wrap
      label(:class="{active: shouldHideCardTips}" @click.left.prevent="toggleShouldHideCardTips" @keydown.stop.enter="toggleShouldHideCardTips")
        input(type="checkbox" v-model="shouldHideCardTips")
        span Hide Tips(?)
  section
    article
      p
        span.badge.info Ctrl-Enter
        span to make a line break
    article
      p
        span.badge.info [[
        span create tags to label and group ideas
    article
      p
        span.badge.info /
        span link to other spaces

</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

export default {
  name: 'Tips',
  props: {
    visible: Boolean
  },
  computed: {
    shouldHideCardTips () { return this.$store.state.currentUser.shouldHideCardTips }
  },
  methods: {
    toggleShouldHideCardTips () {
      const value = !this.shouldHideCardTips
      this.$store.dispatch('currentUser/shouldHideCardTips', value)
    },
    scrollIntoView () {
      if (utils.isMobile()) { return }
      this.$nextTick(() => {
        const element = this.$refs.dialog
        const isTouchDevice = this.$store.state.isTouchDevice
        scrollIntoView.scroll(element, isTouchDevice)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.scrollIntoView()
      }
    }
  }
}
</script>

<style lang="stylus">
.tips
  left initial
  right 8px
  top 12px
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary)
    &:last-child
      margin-bottom 0
      padding-bottom 0
      border-bottom 0

</style>
