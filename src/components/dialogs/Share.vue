<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.stop="closeDialogs" ref="dialog")
  section
    p Share
  section(v-if="spaceHasUrl")
    PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showDescription="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs")
    template(v-if="!spaceIsPrivate")
      input.textarea(ref="url" v-model="url")
      button(@click="copyUrl" v-if="!canNativeShare")
        span Copy Url
      .segmented-buttons(v-if="canNativeShare")
        button(@click="copyUrl")
          span Copy Url
        button(@click="shareUrl")
          img.icon(src="@/assets/share.svg")
      .row
        .badge.success.success-message(v-if="urlIsCopied") Url Copied
    p.share-private(v-if="spaceIsPrivate")
      span To share this space publically, set the privacy to
      span.badge.info
        img.icon.closed(src="@/assets/unlock.svg")
        span Closed
      span or
      span.badge.success
        img.icon.open(src="@/assets/open.svg")
        span Open

  section(v-if="spaceHasUrl && isSpaceMember")
    .button-wrap
      button(@click.stop="toggleInviteCollaboratorsIsVisible" :class="{ active: inviteCollaboratorsIsVisible }")
        span Invite Collaborators
      InviteCollaborators(:visible="inviteCollaboratorsIsVisible")
  section.results-section.collaborators(v-if="spaceHasUrl && isSpaceMember && spaceHasCollaborators")
    UserList(:users="spaceCollaborators" :selectedUser="selectedUser" :showRemoveUser="true" @selectSpace="showUserDetails" @removeUser="removeCollaborator")
    UserDetails(:visible="userDetailsIsVisible" :user="selectedUser" :userDetailsPosition="userDetailsPosition" :userDetailsIsFromList="true" @removedCollaborator="removedCollaborator")

  section(v-if="!spaceHasUrl")
    p
      span To share or invite collaborators,
      span.badge.info you need to Sign Up or In
      span for your spaces to be synced and accessible anywhere.
    button(@click="triggerSignUpOrInIsVisible") Sign Up or In

</template>

<script>
import PrivacyButton from '@/components/PrivacyButton.vue'
import InviteCollaborators from '@/components/dialogs/InviteCollaborators.vue'
import UserList from '@/components/UserList.vue'

export default {
  name: 'Share',
  components: {
    PrivacyButton,
    InviteCollaborators,
    UserList,
    UserDetails: () => import('@/components/dialogs/UserDetails.vue')
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      urlIsCopied: false,
      spaceHasUrl: false,
      privacyPickerIsVisible: false,
      inviteCollaboratorsIsVisible: false,
      selectedUser: {},
      userDetailsPosition: {},
      userDetailsIsVisible: false,
      spaceCollaborators: [],
      url: ''
    }
  },
  computed: {
    spaceName () { return this.$store.state.currentSpace.name },
    spacePrivacy () { return this.$store.state.currentSpace.privacy },
    canEditSpace () {
      const canEdit = this.$store.getters['currentUser/canEditSpace']()
      return canEdit
    },
    // only works in https, supported by safari and android chrome
    // https://caniuse.com/#feat=web-share
    canNativeShare () {
      return Boolean(navigator.share)
    },
    spaceIsPrivate () {
      return this.spacePrivacy === 'private'
    },
    isSpaceMember () {
      const currentSpace = this.$store.state.currentSpace
      return this.$store.getters['currentUser/isSpaceMember'](currentSpace)
    },
    spaceHasCollaborators () {
      return Boolean(this.spaceCollaborators.length)
    }
  },
  methods: {
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    shareUrl () {
      const data = {
        title: 'Kinopio',
        text: this.spaceName,
        url: this.url
      }
      navigator.share(data)
    },
    togglePrivacyPickerIsVisible () {
      const isVisible = this.privacyPickerIsVisible
      this.closeDialogs()
      this.privacyPickerIsVisible = !isVisible
    },
    toggleInviteCollaboratorsIsVisible () {
      const isVisible = this.inviteCollaboratorsIsVisible
      this.closeDialogs()
      this.inviteCollaboratorsIsVisible = !isVisible
    },
    closeDialogs () {
      this.privacyPickerIsVisible = false
      this.inviteCollaboratorsIsVisible = false
      this.userDetailsIsNotVisible()
    },
    showUserDetails (event, user) {
      const elementRect = event.target.getBoundingClientRect()
      this.userDetailsIsNotVisible()
      this.userDetailsPosition = {
        top: elementRect.y - 6 + 'px'
      }
      this.selectedUser = user
      this.userDetailsIsVisible = true
    },
    userDetailsIsNotVisible () {
      this.userDetailsIsVisible = false
      this.selectedUser = {}
    },
    removedCollaborator (user) {
      const isCurrentUser = this.$store.state.currentUser.id === user.id
      if (isCurrentUser) {
        this.$store.dispatch('closeAllDialogs')
      }
      this.updateSpaceCollaborators()
    },
    async removeCollaborator (user) {
      this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
      this.removedCollaborator(user)
    },
    updateSpaceCollaborators () {
      this.userDetailsIsNotVisible()
      this.spaceCollaborators = this.$store.state.currentSpace.collaborators
    }
  },
  watch: {
    visible (visible) {
      this.urlIsCopied = false
      this.spaceHasUrl = window.location.href !== (window.location.origin + '/')
      this.closeDialogs()
      if (visible) {
        this.updateSpaceCollaborators()
        this.url = window.location.href
      }
    }
  }
}
</script>

<style lang="stylus">
.share
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  .badge
    display inline-block
    &.danger
      background-color var(--danger-background)
  .success-message
    margin-top 10px
  .textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
  .privacy-button + .textarea
    margin-top 10px
  .description
    margin-top 3px
  dialog.privacy-picker
    left initial
    right 8px
  dialog.user-details
    left initial
    right calc(100% - 20px)
  .collaborators
    max-height calc(100vh - 200px)
  .share-private
    .badge
      margin-left 6px
</style>
