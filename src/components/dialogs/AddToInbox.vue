<template lang="pug">
dialog.add-to-inbox(v-if="visible" :open="visible" @touchstart.stop.prevent @touchend.stop.prevent @click.left.stop ref="dialog")
  template(v-if="currentUserIsSignedIn")
    section
      .title-row-flex
        span Add To Inbox
        .button-wrap
          a(:href="inboxUrl")
            button.small-button(@pointerup="changeToInboxSpace")
              img.icon.inbox-icon(src="@/assets/inbox.svg")
              span Inbox
    AddToInbox(:visible="true" @successSpaceId="updateSuccessSpaceId")

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
  data () {
    return {
      successSpaceId: ''
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    inboxUrl () { return this.successSpaceId || 'inbox' },
    successSpaceIsCurrentSpace () {
      const currentSpace = this.$store.state.currentSpace
      return this.successSpaceId === currentSpace.id
    }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'SpacePicker.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    updateSuccessSpaceId (value) {
      this.successSpaceId = value
    },
    async changeToInboxSpace (event) {
      if (this.isAddPage) { return }
      this.$store.dispatch('closeAllDialogs', 'AddToInbox')
      event.preventDefault()
      event.stopPropagation()
      let space
      if (this.successSpaceIsCurrentSpace) { return }
      if (this.successSpaceId) {
        space = { id: this.successSpaceId }
      } else {
        space = await this.$store.dispatch('currentUser/inboxSpace')
      }
      this.$store.dispatch('currentSpace/changeSpace', { space })
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
