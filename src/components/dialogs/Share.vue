<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .row.title-row
      span Share
      .button-wrap(v-if="spaceHasUrl")
        button.small-button(@click.left.stop="toggleSpaceRssFeedIsVisible" :class="{ active: spaceRssFeedIsVisible }")
          span RSS
        SpaceRssFeed(:visible="spaceRssFeedIsVisible")

  section
    .row
      // Import, Export
      .segmented-buttons(@click.stop)
        button(@click.left.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
          span Import
          Import(:visible="importIsVisible" @closeDialog="closeDialogs")
        button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          span Export
          Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="exportData")

      //- Embed
      .button-wrap
        button(@click.left.stop="toggleEmbedIsVisible" :class="{ active: embedIsVisible }")
          span Embed
        Embed(:visible="embedIsVisible")

  section(v-if="spaceHasUrl")
    PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showDescription="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs")

    //- Public space
    template(v-if="!spaceIsPrivate")
      p.row
        .url-textarea {{url}}
        .input-button-wrap(@click.left="copyUrl")
          button.small-button
            img.icon.copy(src="@/assets/copy.svg")
            span URL

    //- Private space
    template(v-if="spaceIsPrivate")
      p.share-private
        span To share this space publically, set the privacy to
        span.badge.info
          img.icon.closed(src="@/assets/unlock.svg")
          span {{privacyName(1)}}
        span or
        span.badge.success.last-child
          img.icon.open(src="@/assets/open.svg")
          span {{privacyName(0)}}

    //- Invite
    .row(v-if="spaceHasUrl && isSpaceMember")
      .button-wrap
        button(@click.left.stop="toggleInviteIsVisible" :class="{ active: inviteIsVisible }")
          UserLabelInline(:shouldHideName="true" :user="currentUser")
          span Invite
        Invite(:visible="inviteIsVisible")

  section.results-section.collaborators(v-if="spaceHasCollaborators || spaceHasOtherCardUsers")
    // collaborators
    template(v-if="spaceHasCollaborators")
      UserList(:users="spaceCollaborators" :selectedUser="userDetailsSelectedUser" @selectUser="toggleUserDetails" :showRemoveUser="isSpaceMember" @removeUser="removeCollaborator" :isClickable="true")
    // card users
    template(v-if="spaceHasOtherCardUsers")
      UserList(:users="spaceOtherCardUsers" :selectedUser="userDetailsSelectedUser" @selectUser="toggleUserDetails" :isClickable="true")

  section(v-if="!spaceHasUrl")
    p
      span To share or invite collaborators,
      span.badge.info you need to Sign Up or In
      span for your spaces to be synced and accessible anywhere.
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

</template>

<script>
import PrivacyButton from '@/components/PrivacyButton.vue'
import Invite from '@/components/dialogs/Invite.vue'
import SpaceRssFeed from '@/components/dialogs/SpaceRssFeed.vue'
import Embed from '@/components/dialogs/Embed.vue'
import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'
import privacy from '@/data/privacy.js'
import UserLabelInline from '@/components/UserLabelInline.vue'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'

export default {
  name: 'Share',
  components: {
    PrivacyButton,
    Invite,
    SpaceRssFeed,
    Embed,
    UserList,
    UserLabelInline,
    Export,
    Import
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
      inviteIsVisible: false,
      selectedUser: {},
      dialogHeight: null,
      spaceRssFeedIsVisible: false,
      embedIsVisible: false,
      exportIsVisible: false,
      importIsVisible: false
    }
  },
  computed: {
    userDetailsIsVisible () { return this.$store.state.userDetailsIsVisible },
    userDetailsSelectedUser () {
      if (!this.userDetailsIsVisible) { return }
      return this.$store.state.userDetailsUser
    },
    url () { return this.$store.getters['currentSpace/url'] },
    spaceName () { return this.$store.state.currentSpace.name },
    spacePrivacy () { return this.$store.state.currentSpace.privacy },
    currentUser () { return this.$store.state.currentUser },
    canEditSpace () {
      const canEdit = this.$store.getters['currentUser/canEditSpace']()
      return canEdit
    },
    spaceIsPrivate () {
      return this.spacePrivacy === 'private'
    },
    isSpaceMember () {
      const currentSpace = this.$store.state.currentSpace
      return this.$store.getters['currentUser/isSpaceMember'](currentSpace)
    },
    spaceCollaborators () { return this.$store.state.currentSpace.collaborators },
    spaceHasCollaborators () {
      return Boolean(this.spaceCollaborators.length)
    },
    spaceOtherCardUsers () {
      const currentUserId = this.$store.state.currentUser.id
      let users = this.$store.getters['currentCards/users']
      users = users.filter(user => Boolean(user))
      // remove currentUser
      users = users.filter(user => user.id !== currentUserId)
      // remove collaborators
      users = users.filter(user => {
        const isCollaborator = this.spaceCollaborators.find(collaborator => {
          return collaborator.id === user.id
        })
        return !isCollaborator
      })
      return users
    },
    spaceHasOtherCardUsers () { return Boolean(this.spaceOtherCardUsers.length) },
    exportData () { return this.$store.getters['currentSpace/all'] }
  },
  methods: {
    privacyName (number) {
      const state = privacy.states()[number]
      const name = state.friendlyName || state.name
      return utils.capitalizeFirstLetter(name)
    },
    async copyUrl (event) {
      this.$store.commit('clearNotificationsWithPosition')
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(this.url)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copyText', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
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
      // only works in https, supported by safari and android chrome
      // https://caniuse.com/#feat=web-share
      navigator.share(data)
    },
    togglePrivacyPickerIsVisible () {
      const isVisible = this.privacyPickerIsVisible
      this.closeDialogs()
      this.privacyPickerIsVisible = !isVisible
    },
    toggleInviteIsVisible () {
      const isVisible = this.inviteIsVisible
      this.closeDialogs()
      this.inviteIsVisible = !isVisible
    },
    toggleSpaceRssFeedIsVisible () {
      const isVisible = this.spaceRssFeedIsVisible
      this.closeDialogs()
      this.spaceRssFeedIsVisible = !isVisible
    },
    toggleEmbedIsVisible () {
      const isVisible = this.embedIsVisible
      this.closeDialogs()
      this.embedIsVisible = !isVisible
    },
    toggleExportIsVisible () {
      const isVisible = this.exportIsVisible
      this.closeDialogs()
      this.exportIsVisible = !isVisible
    },
    toggleImportIsVisible () {
      const isVisible = this.importIsVisible
      this.closeDialogs()
      this.importIsVisible = !isVisible
    },
    closeDialogs () {
      this.privacyPickerIsVisible = false
      this.inviteIsVisible = false
      this.spaceRssFeedIsVisible = false
      this.embedIsVisible = false
      this.exportIsVisible = false
      this.importIsVisible = false
      this.$store.commit('userDetailsIsVisible', false)
    },
    toggleUserDetails (event, user) {
      this.closeDialogs()
      this.showUserDetails(event, user)
    },
    showUserDetails (event, user) {
      let element = event.target
      let options = { element, offsetX: 25, shouldIgnoreZoom: true }
      let position = utils.childDialogPositionFromParent(options)
      this.$store.commit('userDetailsUser', user)
      this.$store.commit('userDetailsPosition', position)
      this.$store.commit('userDetailsIsVisible', true)
    },
    async removeCollaborator (user) {
      this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
      const isCurrentUser = this.$store.state.currentUser.id === user.id
      if (isCurrentUser) {
        this.$store.dispatch('closeAllDialogs', 'Share.removeCollaborator')
      }
      this.closeDialogs()
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
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      this.updateSpaceHasUrl()
      this.closeDialogs()
      if (visible) {
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
  .privacy-button + .textarea
    margin-top 10px
  .description
    margin-top 3px
  dialog.privacy-picker,
  dialog.dialog-wrap
    left initial
    right 8px
  dialog.user-details
    left initial
    right calc(100% - 20px)
  dialog.import
    top calc(100% - 8px)
    left initial
    right 8px

  .collaborators
    max-height calc(100vh - 200px)
  .share-private
    margin-bottom 10px
    .last-child
      margin 0
  .privacy-button + input
    margin-top 10px
  .privacy-button
    > button
      padding-top 8px
  .user
    vertical-align -3px
</style>
