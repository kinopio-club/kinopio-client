<template lang="pug">
dialog.card-tips(v-if="visible" @click.stop :open="visible" ref="dialog")
  section
    p Tips
  section
    article
      p Card character limit is {{maxCardLength}}
    article
      p
        span.badge.keyboard-shortcut Enter
        span new card
      p
        span.badge.keyboard-shortcut Shift-Enter
        span child card
      p
        span.badge.keyboard-shortcut Ctrl-Enter
        span line break
    article(v-if="shouldHideExtras")
      p
        span.badge.keyboard-shortcut [[
        span backlinked tag
      p
        span.badge.keyboard-shortcut /
        span link to other spaces

    article
      .row
        button(@click.left.stop="toggleMarkdownInfoIsVisible" :class="{ active: markdownInfoIsVisible }")
          img.icon.view(v-if="markdownInfoIsVisible" src="@/assets/view-hidden.svg")
          img.icon.view(v-else src="@/assets/view.svg")
          span Markdown
      div(v-if="markdownInfoIsVisible")
        p
          span.badge.keyboard-shortcut # heading 1
        p
          span.badge.keyboard-shortcut ## heading 2
        p
          span.badge.keyboard-shortcut _italic_ or *italic*
        p
          span.badge.keyboard-shortcut **bold**
        p
          span.badge.keyboard-shortcut ~~strikethrough~~
        p
          span.badge.keyboard-shortcut [link text](url)
        p
          span.badge.keyboard-shortcut `code`
        p
          span.badge.keyboard-shortcut ``` code block ```
</template>

<script>
import utils from '@/utils.js'
import consts from '@/consts.js'

export default {
  name: 'CardTips',
  props: {
    visible: Boolean,
    preventScrollIntoView: Boolean,
    shouldHideExtras: Boolean
  },
  data () {
    return {
      markdownInfoIsVisible: false
    }
  },
  computed: {
    maxCardLength () { return consts.maxCardLength }
  },
  methods: {
    scrollIntoView () {
      if (this.preventScrollIntoView) { return }
      if (utils.isMobile()) { return }
      this.$nextTick(() => {
        const element = this.$refs.dialog
        utils.scrollIntoView(element)
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
dialog.card-tips
  left initial
  right 8px
  top 22px
  width 180px
  overflow auto
  overscroll-behavior-y auto
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary-border)
    &:last-child
      margin-bottom 0
      padding-bottom 0
      border-bottom 0

  label
    margin-left 6px
  .row
    justify-content space-between

</style>
