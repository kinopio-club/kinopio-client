<template lang="pug">
dialog.keyboard-shortcuts(v-if="visible" :open="visible" @click.stop)
  section
    .row
      .badge.title Keyboard Shortcuts
      .badge.info ?

  section
    article
      .row
        .badge.title Add Card
        .badge.info Enter
    article
      .row
        .badge.title Add child card
        .badge.info Shift-Enter
      p Subsequent&nbsp;
        span.badge.info Enters
        span add siblings
    article
      .row
        .badge.title Close Dialogs
        .badge.info Escape
      p Also starts a new card tree
    article
      .row
        .badge.title Focus next/previous
        .badge.info Tab/Shift-Tab
      p
        span.badge.info Enter
        span clicks focused items

      .row
        button(@click.stop="toggleSafariInfoIsVisible" :class="{ active: safariInfoIsVisible }")
          span Safari Info

      div(v-if="safariInfoIsVisible")
        p.badge.info Option-Tab/Option-Shift-Tab
        p Unless you update your Safari preferences:
        p Preferences → Advanced → Press Tab to highlight each item on a webpage

    //- article
    //-   .row
    //-     .badge.title Undo/Redo
    //-     .badge.info Cmd-Z/Cmd-Shift-Z
    //- SUPER= ${super}, cmd on mac, else ctrl. (both work tho)

    article
      .row
        .badge.title Remove item(s)
        .badge.info Delete
</template>

<script>
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
  button
    margin-top 10px
</style>
