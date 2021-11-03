<template lang="pug">
dialog.narrow.invite-collaborators(v-if="visible" :open="visible" @click.left.stop)

  // add by email
  // share link

  section
    p Invite Collaborators

  section
    Loader(:visible="loading")

    template(v-if="!loading && collaboratorKey")
      .row
        input.url-textarea(ref="url" v-model="url")
      button(v-if="!canNativeShare" @click.left="copyUrl")
        span Copy Invite Url
      .segmented-buttons(v-if="canNativeShare")
        button(@click.left="copyUrl" :disabled="loading")
          span Copy Invite Url
        button(@click.left="shareUrl" :disabled="loading")
          img.icon(src="@/assets/share.svg")

    p(v-if="spaceIsPrivate")
      img.icon(src="@/assets/view.svg")
      span Invitees can view private spaces without a Kinopio account

    template(v-if="!loading && !collaboratorKey")
      .row
        .badge.danger シ_ _)シ Something went wrong
      button(@click="updateCollaboratorKey") Try Again

    .row
      .badge.success.success-message(v-if="urlIsCopied") Url Copied

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
    canNativeShare () {
      return Boolean(navigator.share)
    },
    spaceIsPrivate () {
      return this.$store.state.currentSpace.privacy === 'private'
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
</style>
