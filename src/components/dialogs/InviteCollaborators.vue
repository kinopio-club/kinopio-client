<template lang="pug">
dialog.narrow.invite-collaborators(v-if="visible" :open="visible" @click.left.stop)

  // add by email
  // share link

  section
    p Invite Collaborators

  section
    //- p Share this url to edit with others
    //- img(src="@/assets/collaborators.jpg")

    input.textarea(ref="url" v-model="url")

    button(v-if="!canNativeShare" @click.left="copyUrl")
      span Copy Invite Url
    .segmented-buttons(v-if="canNativeShare")
      button(@click.left="copyUrl")
        span Copy Invite Url
      button(@click.left="shareUrl")
        img.icon(src="@/assets/share.svg")
    .row
      .badge.success.success-message(v-if="urlIsCopied") Url Copied

</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'InviteCollaborators',
  props: {
    visible: Boolean
  },
  data () {
    return {
      urlIsCopied: false,
      url: ''
    }
  },
  computed: {
    // only works in https, supported by safari and android chrome
    // https://caniuse.com/#feat=web-share
    canNativeShare () {
      return Boolean(navigator.share)
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
      const space = this.$store.state.currentSpace
      const collaboratorKey = await this.$store.dispatch('api/getSpaceCollaboratorKey', space)
      this.$store.commit('currentSpace/updateSpace', { collaboratorKey })
    },
    updateInviteUrl () {
      const collaboratorKey = this.$store.state.currentSpace.collaboratorKey
      const spaceId = this.$store.state.currentSpace.id
      this.url = `${window.location.origin}/invite?spaceId=${spaceId}&collaboratorKey=${collaboratorKey}`
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.urlIsCopied = false
        this.updateCollaboratorKey()
        this.updateInviteUrl()
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
  // .textarea
  //   margin-top 10px
</style>
