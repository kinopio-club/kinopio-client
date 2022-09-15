<template lang="pug">
dialog.narrow.invite(v-if="visible" :open="visible" @click.left.stop)

  // add by email
  // share link

  section
    p Invite
  section
    Loader(:visible="loading")
    template(v-if="!loading && collaboratorKey")
      .row
        .url-textarea {{url}}
        .input-button-wrap
          button(@click.left="copyUrl" :class="{success: urlIsCopied}")
            span(v-if="urlIsCopied") Invite Copied
            span(v-else) Copy Invite URL
    //- Error
    template(v-if="!loading && !collaboratorKey")
      .row
        .badge.danger シ_ _)シ Something went wrong
      .row
        button(@click="updateCollaboratorKey") Try Again
    //- View and Edit Permissions
    .row(v-if="spaceIsPrivate")
      p
        .badge.info
          img.icon(src="@/assets/view.svg")
        span No account needed to view private spaces
    //- Free Cards
    .row(v-if="currentUserIsUpgraded")
      p
        .badge.success Free Cards
        span Because your account is upgraded, invitees can create cards here for free
</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Invite',
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

<style lang="stylus" scoped>
.invite
  left initial
  right 8px
  max-height calc(100vh - 180px)
  overflow auto
  @media(max-height 570px)
    top -100px
</style>
