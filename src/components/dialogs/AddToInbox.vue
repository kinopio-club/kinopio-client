<template lang="pug">
dialog.add-to-inbox(v-if="visible" :open="visible" @touchstart.stop.prevent @touchend.stop.prevent @click.left.stop ref="dialog")
  template(v-if="currentUserIsSignedIn")
    section
      .title-row-flex
        span Add To Inbox
        .button-wrap
          button.small-button(@click.stop="toggleExploreRssFeedIsVisible" :class="{active: exploreRssFeedIsVisible}")
            img.icon.inbox-icon(src="@/assets/inbox.svg")
            span Inbox
    AddToInbox(:visible="true")

  template(v-else)
    section
      p
        span To add cards to your inbox from anywhere,
        span.badge.info you need to Sign Up or In
      button(@pointerup.stop="triggerSignUpOrInIsVisible")
        span Sign Up or In

</template>

<script>
import AddToInbox from '@/components/AddToInbox.vue'

export default {
  name: 'AddToInboxDialog',
  components: {
    AddToInbox
  },
  props: {
    visible: Boolean
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'SpacePicker.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }
  }
}
</script>

<style lang="stylus">
dialog.add-to-inbox
  width 210px
  .title-row-flex
    display flex
    justify-content space-between
  .small-button
    padding 0
    padding-left 6px
    padding-right 6px
    margin-left 6px
  .inbox-icon
    margin 0
</style>
