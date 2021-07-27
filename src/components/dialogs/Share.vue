<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Share
  section(v-if="spaceHasUrl")
    PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showDescription="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs")
    template(v-if="!spaceIsPrivate")
      input.url-textarea(ref="url" v-model="url")
      button(@click.left="copyUrl" v-if="!canNativeShare")
        span Copy Url
      .segmented-buttons(v-if="canNativeShare")
        button(@click.left="copyUrl")
          span Copy Url
        button(@click.left="shareUrl")
          img.icon(src="@/assets/share.svg")
      .row
        .badge.success.success-message(v-if="urlIsCopied") Url Copied
    p.share-private(v-if="spaceIsPrivate")
      span To share this space publically, set the privacy to
      span.badge.info
        img.icon.closed(src="@/assets/unlock.svg")
        span {{privacyName(1)}}
      span or
      span.badge.success
        img.icon.open(src="@/assets/open.svg")
        span {{privacyName(0)}}

  section(v-if="spaceHasUrl && isSpaceMember")
    .button-wrap
      button(@click.left.stop="toggleInviteCollaboratorsIsVisible" :class="{ active: inviteCollaboratorsIsVisible }")
        span Invite Collaborators
      InviteCollaborators(:visible="inviteCollaboratorsIsVisible")
  section.results-section.collaborators(v-if="spaceHasUrl && isSpaceMember && spaceHasCollaborators")
    UserList(:users="spaceCollaborators" :selectedUser="selectedUser" :showRemoveUser="true" @selectSpace="showUserDetails" @removeUser="removeCollaborator" :isClickable="true")
    UserDetails(:visible="userDetailsIsVisible" :user="selectedUser" :userDetailsPosition="userDetailsPosition" :userDetailsIsFromList="true" @removedCollaborator="removedCollaborator")

  section(v-if="!spaceHasUrl")
    p
      span To share or invite collaborators,
      span.badge.info you need to Sign Up or In
      span for your spaces to be synced and accessible anywhere.
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

</template>

<script>
import PrivacyButton from '@/components/PrivacyButton.vue'
import InviteCollaborators from '@/components/dialogs/InviteCollaborators.vue'
import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'
import privacy from '@/data/privacy.js'

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
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
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
      url: '',
      dialogHeight: null
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
    privacyName (number) {
      const state = privacy.states()[number]
      const name = state.friendlyName || state.name
      return utils.capitalizeFirstLetter(name)
    },
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'Share.triggerSignUpOrInIsVisible')
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
        this.$store.dispatch('closeAllDialogs', 'Share.removedCollaborator')
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
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    updateSpaceHasUrl () {
      const hasCurrentSpacePath = this.$store.state.currentSpacePath !== '/'
      const hasWindowUrl = window.location.href !== (window.location.origin + '/')
      this.spaceHasUrl = hasCurrentSpacePath || hasWindowUrl
    },
    updateUrl () {
      this.url = `${window.location.origin}/${this.$store.state.currentSpacePath}`
    }
  },
  watch: {
    visible (visible) {
      this.urlIsCopied = false
      this.updateSpaceHasUrl()
      this.closeDialogs()
      if (visible) {
        this.updateSpaceCollaborators()
        this.updateUrl()
        this.updateDialogHeight()
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
  .privacy-button + input
    margin-top 10px
</style>
