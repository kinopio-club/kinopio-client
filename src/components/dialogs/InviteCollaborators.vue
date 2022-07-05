<template lang="pug">
dialog.narrow.invite-collaborators(v-if="visible" :open="visible" @click.left.stop)

  // add by email
  // share link

  section
    p Invite Collaborators
  section
    Loader(:visible="loading")
    template(v-if="!loading && collaboratorKey")
      //- Input
      .row
        input.url-textarea(ref="url" v-model="url")
      //- Copy Button
      .row(v-if="!canNativeShare" @click.left="copyUrl")
        button
          span Copy Invite Url
      .row(v-if="canNativeShare")
        .segmented-buttons
          button(@click.left="copyUrl" :disabled="loading")
            span Copy Invite Url
          button(@click.left="shareUrl" :disabled="loading")
            img.icon(src="@/assets/share.svg")
    //- Status
    template(v-if="!loading && !collaboratorKey")
      .row
        .badge.danger シ_ _)シ Something went wrong
      button(@click="updateCollaboratorKey") Try Again
    .row
      .badge.success.success-message(v-if="urlIsCopied") Url Copied
    .row.align-top(v-if="spaceIsPrivate")
      p
        .badge.info
          img.icon.view(src="@/assets/view.svg")
          img.icon.lock(src="@/assets/lock.svg")
        span Invitees don't need an account to view private spaces
    .row(v-if="currentUserIsUpgraded")
      p
        .badge.success Free Cards
        span Because your account is upgraded, invitees can create cards here for free
</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'InviteCollaborators',
  props: {
    visible: Boolean
  },
  components: {
    Loader
  },
  data () {
    return {
      urlIsCopied: false,
      url: '',
      loading: false,
      collaboratorKey: ''
    }
  },
  computed: {
    // only works in https, supported by safari and android chrome
    // https://caniuse.com/#feat=web-share
    canNativeShare () { return Boolean(navigator.share) },
    spaceIsPrivate () { return this.$store.state.currentSpace.privacy === 'private' },
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded }
  },
  methods: {
    async copyUrl () {
      await navigator.clipboard.writeText(this.url)
      this.urlIsCopied = true
    },
    shareUrl () {
      const data = {
        title: 'Kinopio Invite',
        text: this.spaceName,
        url: this.url
      }
      navigator.share(data)
    },
    async updateCollaboratorKey () {
      this.collaboratorKey = ''
      const space = this.$store.state.currentSpace
      this.loading = true
      const collaboratorKey = await this.$store.dispatch('api/getSpaceCollaboratorKey', space)
      this.collaboratorKey = collaboratorKey
      this.loading = false
      this.$store.commit('currentSpace/updateSpace', { collaboratorKey })
      this.updateInviteUrl(collaboratorKey)
    },
    updateInviteUrl (collaboratorKey) {
      const currentSpace = this.$store.state.currentSpace
      const spaceId = currentSpace.id
      const spaceName = utils.normalizeString(currentSpace.name)
      this.url = `${window.location.origin}/invite?spaceId=${spaceId}&collaboratorKey=${collaboratorKey}&name=${spaceName}`
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.urlIsCopied = false
        this.updateCollaboratorKey()
      }
    }
  }
}
</script>

<style lang="stylus">
.invite-collaborators
  left initial
  right 8px
  max-height calc(100vh - 180px)
  overflow auto
  .lock
    margin-top 2px
    padding-right 2px
  .view
    margin-right 4px
</style>
