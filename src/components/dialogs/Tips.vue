<template lang="pug">
dialog.tips.narrow(v-if="visible" @click.stop :open="visible" ref="dialog")
  section.section-with-button
    .row
      p Tips
      label(:class="{active: shouldHideCardTips}" @click.left.prevent="toggleShouldHideCardTips" @keydown.stop.enter="toggleShouldHideCardTips")
        input(type="checkbox" v-model="shouldHideCardTips")
        span Hide
        span.badge.secondary ?

  section
    article
      p
        span.badge.info Ctrl-Enter
        span line break
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
  top 22px
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary)
    &:last-child
      margin-bottom 0
      padding-bottom 0
      border-bottom 0

  label
    margin-left 6px
  .row
    justify-content space-between

  .section-with-button
    padding 4px 8px

  .badge.secondary
    margin 0
    margin-left 6px
    font-size 12px
</style>
