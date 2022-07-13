<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p
      span Share
      .button-wrap(v-if="spaceHasUrl")
        button.small-button(@click.left.stop="toggleSpaceRssFeedIsVisible" :class="{ active: spaceRssFeedIsVisible }")
          span RSS
        SpaceRssFeed(:visible="spaceRssFeedIsVisible")

  section(v-if="spaceHasUrl")
    PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showDescription="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs")
    template(v-if="!spaceIsPrivate")
      input.url-textarea(ref="url" v-model="url")
      //- Share Options
      .row
        template(v-if="canNativeShare")
          .segmented-buttons
            //- Copy
            button(@click.left="copyUrl")
              span Copy
            button(@click.left="shareUrl")
              img.icon(src="@/assets/share.svg")
        template(v-if="!canNativeShare")
          //- Copy
          .button-wrap
            button(@click.left="copyUrl")
              span Copy Url
        //- Embed
        .button-wrap
          button(@click.left.stop="toggleEmbedIsVisible" :class="{ active: embedIsVisible }")
            span Embed
          Embed(:visible="embedIsVisible")

      //- Url Copied
      .badge.success.success-message(v-if="urlIsCopied") Url Copied

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

  // Export, Import
  section
    .button-wrap
      button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="exportData")
    .button-wrap
      button(@click.left.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
        span Import
      Import(:visible="importIsVisible" @closeDialog="closeDialogs")

  section(v-if="spaceHasUrl && isSpaceMember")
    .button-wrap
      button(@click.left.stop="toggleInviteCollaboratorsIsVisible" :class="{ active: inviteCollaboratorsIsVisible }")
        User(:user="currentUser" :key="currentUser.id" :hideYouLabel="true")
        span Invite Collaborators
      InviteCollaborators(:visible="inviteCollaboratorsIsVisible")

  section.results-section.collaborators(v-if="spaceHasCollaborators || spaceHasOtherCardUsers")
    // collaborators
    template(v-if="spaceHasCollaborators")
      UserList(:users="spaceCollaborators" :selectedUser="selectedUser" :showRemoveUser="isSpaceMember" @selectUser="showUserDetails" @removeUser="removeCollaborator" :isClickable="true")
    // card users
    template(v-if="spaceHasOtherCardUsers")
      UserList(:users="spaceOtherCardUsers" :selectedUser="selectedUser" :isClickable="true")
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
import SpaceRssFeed from '@/components/dialogs/SpaceRssFeed.vue'
import Embed from '@/components/dialogs/Embed.vue'
import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'
import privacy from '@/data/privacy.js'
import { defineAsyncComponent } from 'vue'
import User from '@/components/User.vue'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
const UserDetails = defineAsyncComponent({
  loader: () => import('@/components/dialogs/UserDetails.vue')
})

export default {
  name: 'Share',
  components: {
    PrivacyButton,
    InviteCollaborators,
    SpaceRssFeed,
    Embed,
    UserList,
    UserDetails,
    User,
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
      inviteCollaboratorsIsVisible: false,
      selectedUser: {},
      userDetailsPosition: {},
      userDetailsIsVisible: false,
      dialogHeight: null,
      spaceRssFeedIsVisible: false,
      embedIsVisible: false,
      exportIsVisible: false,
      importIsVisible: false
    }
  },
  computed: {
    url () { return this.$store.getters['currentSpace/url'] },
    spaceName () { return this.$store.state.currentSpace.name },
    spacePrivacy () { return this.$store.state.currentSpace.privacy },
    currentUser () { return this.$store.state.currentUser },
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
    async copyUrl () {
      await navigator.clipboard.writeText(this.url)
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
      this.inviteCollaboratorsIsVisible = false
      this.spaceRssFeedIsVisible = false
      this.embedIsVisible = false
      this.exportIsVisible = false
      this.importIsVisible = false
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
      this.userDetailsIsNotVisible()
    },
    async removeCollaborator (user) {
      this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
      this.removedCollaborator(user)
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
      this.urlIsCopied = false
      this.updateSpaceHasUrl()
      this.closeDialogs()
      if (visible) {
        this.userDetailsIsNotVisible()
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
  dialog.embed,
  dialog.dialog-wrap
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
    .last-child
      margin 0
  .privacy-button + input
    margin-top 10px
  .small-button
    padding 0
    padding-left 6px
    padding-right 6px
    margin-left 6px
  .user
    vertical-align -3px
</style>
