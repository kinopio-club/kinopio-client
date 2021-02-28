<template lang="pug">
dialog.keyboard-shortcuts(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
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
      button(@click.left.stop="toggleCardInfoIsVisible" :class="{ active: cardInfoIsVisible }") More Info
      p(v-if="cardInfoIsVisible") Disabled if card contains Japanese characters
    article
      .row
        .badge.title
          img.icon(src="@/assets/add.svg")
          span Add Child Card
        .badge.info Shift-Enter
      p Subsequent&nbsp;
        span.badge.info Enters
        span add siblings
      button(@click.left.stop="toggleChildCardInfoIsVisible" :class="{ active: childCardInfoIsVisible }") More Info
      div(v-if="childCardInfoIsVisible")
        video(autoplay loop muted playsinline)
          source(src="https://kinopio-updates.us-east-1.linodeobjects.com/keyboard-shortcuts2.mp4")
    article
      .row
        .badge.title
          img.icon(src="@/assets/line-break.svg")
          span Line break in card
        .badge.info Ctrl-Enter
    article
      .row
        .badge.title Focus Next/Previous
        .badge.info Tab/Shift-Tab
      .row
        button(@click.left.stop="toggleSafariInfoIsVisible" :class="{ active: safariInfoIsVisible }")
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
          User(:user="currentUser" :key="currentUser.id" :hideYouLabel="true")
          span Toggle Card User Filter
        .badge.info 1
    article
      .row
        .badge.title
          img.icon.time(src="@/assets/time.svg")
          span Toggle Card Date Filter
        .badge.info 2
    article
      .row
        .badge.title
          img.icon.time(src="@/assets/unchecked.svg")
          span Toggle Cards Unchecked Filter
        .badge.info 3
    article
      .row
        .badge.title
          img.icon(src="@/assets/brush.svg")
          span Select All Cards
        .badge.info {{meta}}-A
    article
      .row
        .badge.title
          img.icon(src="@/assets/brush.svg")
          span Select All Connected Cards
        .badge.info {{meta}}-Click Card
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
          img.icon.connector-icon(src="@/assets/connector-open.svg")
          span Use Last Connection Type
        .badge.info Shift-Click on
          img.icon.connector-icon(src="@/assets/connector-open.svg")
      p
        span.badge.info Shift-Drag
        span card connector or
        span.badge.info Shift-Click
        span 'Connect' button to use last connection type
    article
      .row
        .badge.title
          img.icon(src="@/assets/constrain-axis.svg")
          span Constrain Card Move to Axis
        .badge.info Shift-Drag Card
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
import User from '@/components/User.vue'
import utils from '@/utils.js'

export default {
  name: 'KeyboardShortcuts',
  props: {
    visible: Boolean
  },
  components: {
    User
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      safariInfoIsVisible: false,
      cardInfoIsVisible: false,
      childCardInfoIsVisible: false,
      dialogHeight: null
    }
  },
  computed: {
    meta () {
      if (utils.isMacOrIpad() || utils.isIPhone()) {
        return '⌘'
      } else {
        return 'Ctrl'
      }
    },
    currentUser () {
      return this.$store.state.currentUser
    }
  },
  methods: {
    toggleSafariInfoIsVisible () {
      this.safariInfoIsVisible = !this.safariInfoIsVisible
    },
    toggleChildCardInfoIsVisible () {
      this.childCardInfoIsVisible = !this.childCardInfoIsVisible
    },
    toggleCardInfoIsVisible () {
      this.cardInfoIsVisible = !this.cardInfoIsVisible
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.keyboard-shortcuts
  overflow auto
  max-height calc(100vh - 300px)
  .title
    padding-left 0
  .badge
    display inline-block
  .badge.info
    img
      margin-left 6px

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
  .connector-icon
    width 11px
  video
    margin-top 10px
  .user
    margin-right 5px !important
</style>
