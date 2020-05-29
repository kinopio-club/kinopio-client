<template lang="pug">
dialog.keyboard-shortcuts(v-if="visible" :open="visible" @click.stop)
  section
    .row
      .badge.title Keyboard Shortcuts
      .badge.info ?

  section
    article
      .row.multiple-items
        .badge.title
          img.icon(src="@/assets/add.svg")
          span Add Card
        .divider.badge or
        .badge.title Click Focused Item
        .badge.info Enter
    article
      .row
        .badge.title
          img.icon(src="@/assets/add.svg")
          span Add Child Card
        .badge.info Shift-Enter
      p Subsequent&nbsp;
        span.badge.info Enters
        span add siblings
    article
      .row
        .badge.title Focus Next/Previous
        .badge.info Tab/Shift-Tab
      .row
        button(@click.stop="toggleSafariInfoIsVisible" :class="{ active: safariInfoIsVisible }")
          span Safari Info
      div(v-if="safariInfoIsVisible")
        p Instead of Tab, Safari uses
        p.badge.info Option-Tab/Option-Shift-Tab
        p Unless you update your Safari preferences:
        p Preferences → Advanced → Press Tab to highlight each item on a webpage
    article
      .row
        .badge.title Focus Nearest Card
        .badge.info Arrow(→↑←↓)
    article
      .row
        .badge.title
          img.icon.cut(src="@/assets/cut.svg")
          span Copy/Cut/Paste Selected Cards
        .badge.info {{meta}}-C/{{meta}}-X/{{meta}}-V
      p You can copy and paste cards between spaces
    article
      .row
        .badge.title
          img.icon(src="@/assets/remove.svg")
          span Remove Selected
        .badge.info Delete
    article
      .row
        .badge.title
          img.icon(src="@/assets/undo.svg")
          span Restore Last Removed Card
        .badge.info {{meta}}-Z
    article
      .row
        .badge.title
          img.icon.cancel(src="@/assets/add.svg")
          span Close Dialogs
        .badge.info Escape

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'KeyboardShortcuts',
  props: {
    visible: Boolean
  },
  data () {
    return {
      safariInfoIsVisible: false
    }
  },
  computed: {
    meta () {
      if (utils.isMacOrIpad() || utils.isIPhone()) {
        return 'Cmd'
      } else {
        return 'Ctrl'
      }
    }
  },
  methods: {
    toggleSafariInfoIsVisible () {
      this.safariInfoIsVisible = !this.safariInfoIsVisible
    }
  }
}
</script>

<style lang="stylus">
.keyboard-shortcuts
  overflow auto
  max-height calc(100vh - 280px)
  .title
    padding-left 0
  .badge
    display inline-block
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary)
    &:last-child
      margin-bottom 0
      padding-bottom 0
      border-bottom 0
  .row
    display flex
    justify-content space-between
  .multiple-items
    .badge
      margin-right 0
    .divider
      padding-left 0
      margin-right 6px
  .badge.title + .badge.info
    margin-right 0
</style>
