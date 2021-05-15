<template lang="pug">
dialog.card-tips.narrow(v-if="visible" @click.stop :open="visible" ref="dialog")
  section
    p Tips
  section
    article
      p
        span.badge.info [[
        span create tags to label and group ideas
    article
      p
        span.badge.info /
        span link to other spaces
    article
      p
        span.badge.info ((
        span turn card into comment
    article
      p
        span.badge.info Ctrl-Enter
        span line break
    article
      .row
        button(@click.left.stop="toggleMarkdownInfoIsVisible" :class="{ active: markdownInfoIsVisible }")
          span Markdown
      div(v-if="markdownInfoIsVisible")
        p
          span.badge.info _italic_ or *italic*
        p
          span.badge.info **bold**
        p
          span.badge.info ~~strikethrough~~
        p
          span.badge.info [link text](url)
        p
          span.badge.info `code`
        p
          span.badge.info ``` code block ```
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

export default {
  name: 'CardTips',
  props: {
    visible: Boolean
  },
  data () {
    return {
      markdownInfoIsVisible: false
    }
  },
  // computed: {
  // },
  methods: {
    scrollIntoView () {
      if (utils.isMobile()) { return }
      this.$nextTick(() => {
        const element = this.$refs.dialog
        const isTouchDevice = this.$store.state.isTouchDevice
        scrollIntoView.scroll(element, isTouchDevice)
      })
    },
    toggleMarkdownInfoIsVisible () {
      this.markdownInfoIsVisible = !this.markdownInfoIsVisible
      if (this.markdownInfoIsVisible) {
        this.scrollIntoView()
      }
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
.card-tips
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

</style>
