<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :class="{overflow: !dialogIsVisible}")
  section
    .row.title-row
      span Share
      .row
        button.small-button(@click.left.stop="isPresentationMode")
          img.icon(src="@/assets/presentation.svg")
          span Present
        .button-wrap(v-if="spaceIsRemote")
          button.small-button(@click.left.stop="toggleSpaceRssFeedIsVisible" :class="{ active: spaceRssFeedIsVisible }")
            span RSS
          SpaceRssFeed(:visible="spaceRssFeedIsVisible")

  section(v-if="spaceIsRemote")
    ReadOnlySpaceInfoBadges
    PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showDescription="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs")

    //- Private
    section.subsection.share-private(v-if="spaceIsPrivate")
      .row
        .segmented-buttons
          button(@click.left="copyUrl")
            img.icon.copy(src="@/assets/copy.svg")
            span Copy Private URL
          button(v-if="webShareIsSupported" @click="webShare")
            img.icon.share(src="@/assets/share.svg")
    //- Public
    section.subsection(v-if="!spaceIsPrivate" :class="{'share-url-subsection': isSpaceMember}")
      //- Explore
      template(v-if="exploreSectionIsVisible")
        .row
          p Share with the Community
        .row
          AddToExplore
          AskToAddToExplore
        hr
      //- Copy URL
      .row
        p Share With the World
        label.label.small-button.extra-options-button.inline-button(title="Share in Presentation Mode" @mouseup.left="toggleIsShareInPresentationMode" @touchend.prevent="toggleIsShareInPresentationMode" :class="{active: isShareInPresentationMode}")
          input(type="checkbox" :value="isShareInPresentationMode")
          img.icon(src="@/assets/presentation.svg")
      .row
        .segmented-buttons
          button(@click.left="copyUrl")
            img.icon.copy(src="@/assets/copy.svg")
            span Copy Public URL
          button(v-if="webShareIsSupported" @click="webShare")
            img.icon.share(src="@/assets/share.svg")

  //- Invite
  Invite(v-if="isSpaceMember && currentUserIsSignedIn")
  //- Collaborators
  section.results-section.collaborators(v-if="spaceHasCollaborators || spaceHasOtherCardUsers || currentMemberIsSignedIn")
    //- collaborators
    template(v-if="spaceHasCollaborators")
      UserList(:users="spaceCollaborators" :selectedUser="userDetailsSelectedUser" @selectUser="toggleUserDetails" :showRemoveUser="isSpaceMember" @removeUser="removeCollaborator" :isClickable="true")
    //- card users
    template(v-if="spaceHasOtherCardUsers")
      UserList(:users="spaceOtherCardUsers" :selectedUser="userDetailsSelectedUser" @selectUser="toggleUserDetails" :isClickable="true")

  section(v-if="!spaceIsRemote")
    p
      span To share or invite collaborators,
      span.badge.info you need to Sign Up or In
      span for your spaces to be synced and accessible anywhere.
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  section
    .row
      //- Import, Export
      .segmented-buttons(@click.stop)
        button(@click.left.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
          span Import
          Import(:visible="importIsVisible" @closeDialog="closeDialogs")
        button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          span Export
          Export(:visible="exportIsVisible")
      //- Embed
      .button-wrap
        button(@click.left.stop="toggleEmbedIsVisible" :class="{ active: embedIsVisible }")
          span Embed
        Embed(:visible="embedIsVisible")

  section(v-if='!isSecureAppContextIOS')
    .button-wrap
      button(@click="triggerEarnCreditsIsVisible")
        span Earn Credits

</template>

<script>
import PrivacyButton from '@/components/PrivacyButton.vue'
import Invite from '@/components/Invite.vue'
import SpaceRssFeed from '@/components/dialogs/SpaceRssFeed.vue'
import Embed from '@/components/dialogs/Embed.vue'
import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import AddToExplore from '@/components/AddToExplore.vue'
import AskToAddToExplore from '@/components/AskToAddToExplore.vue'
import ReadOnlySpaceInfoBadges from '@/components/ReadOnlySpaceInfoBadges.vue'
import consts from '@/consts.js'

export default {
  name: 'Share',
  components: {
    PrivacyButton,
    Invite,
    SpaceRssFeed,
    Embed,
    UserList,
    Export,
    Import,
    AddToExplore,
    AskToAddToExplore,
    ReadOnlySpaceInfoBadges
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
      privacyPickerIsVisible: false,
      selectedUser: {},
      dialogHeight: null,
      spaceRssFeedIsVisible: false,
      embedIsVisible: false,
      exportIsVisible: false,
      importIsVisible: false,
      isShareInPresentationMode: false
    }
  },
  computed: {
    isSecureAppContextIOS () { return consts.isSecureAppContextIOS },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    showInExplore () { return this.$store.state.currentSpace.showInExplore },
    exploreSectionIsVisible () {
      const shouldShowAskToAddToExplore = !this.isSpaceMember && !this.showInExplore
      return this.isSpaceMember || shouldShowAskToAddToExplore
    },
    userDetailsIsVisible () { return this.$store.state.userDetailsIsVisible },
    userDetailsSelectedUser () {
      if (!this.userDetailsIsVisible) { return }
      return this.$store.state.userDetailsUser
    },
    url () {
      let url = this.$store.getters['currentSpace/url']
      url = new URL(url)
      if (this.isShareInPresentationMode) {
        url.searchParams.set('present', true)
      }
      return url.href
    },
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
      return this.$store.getters['currentUser/isSpaceMember']()
    },
    currentMemberIsSignedIn () {
      if (!this.isSpaceMember) { return true }
      return this.currentUserIsSignedIn
    },
    spaceIsRemote () {
      return this.$store.getters['currentSpace/isRemote']
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
    dialogIsVisible () {
      return this.privacyPickerIsVisible || this.spaceRssFeedIsVisible || this.embedIsVisible || this.exportIsVisible || this.importIsVisible
    },
    webShareIsSupported () { return navigator.share }
  },
  methods: {
    triggerEarnCreditsIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerEarnCreditsIsVisible')
    },
    isPresentationMode () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('isPresentationMode', true)
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
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    webShare () {
      const data = {
        title: 'Kinopio Space',
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
    toggleIsShareInPresentationMode () {
      this.closeDialogs()
      this.isShareInPresentationMode = !this.isShareInPresentationMode
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
        this.$store.dispatch('closeAllDialogs')
      }
      this.closeDialogs()
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
      this.$store.commit('clearNotificationsWithPosition')
      this.closeDialogs()
      if (visible) {
        this.updateDialogHeight()
        this.$store.commit('shouldExplicitlyHideFooter', true)
      } else {
        this.$store.commit('shouldExplicitlyHideFooter', false)
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
  &.overflow
    overflow auto
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
    margin-top 10px
  .privacy-button + input
    margin-top 10px
  .privacy-button
    > button
      padding-top 8px
  .user
    vertical-align -3px
  .button-tip-badge
    top -12px
    pointer-events none
  p + .subsection
    margin-top 10px
  .share-url-subsection
    margin-top 0
    border-top-left-radius 0
    border-top-right-radius 0

  @media(max-height 670px)
    dialog.import,
    dialog.export,
    dialog.embed
      top -50px
  @media(max-height 500px)
    dialog.import,
    dialog.export,
    dialog.embed
      top -200px

  .segmented-buttons
    z-index 1
  .extra-options-button
    margin-left auto
    margin-top 0
    margin-bottom -2px
    width auto
    cursor pointer
    height 20px
    width initial
    &.label
      padding-top 2px
      input
        background-color transparent
        pointer-events none
</style>
