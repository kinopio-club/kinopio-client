<template lang="pug">
dialog.narrow.invite-others-to-edit(v-if="visible" :open="visible" @click.stop)

  // add by email
  // share link

  section
    p Invite Collaborators

  section
    //- p Share this url to edit with others
    img(src="@/assets/collaborators.jpg")

    input.textarea(ref="url" v-model="url")

    button(v-if="!canNativeShare" @click="copyUrl")
      span Copy Invite Url
    .segmented-buttons(v-if="canNativeShare")
      button(@click="copyUrl")
        span Copy Invite Url
      button(@click="shareUrl")
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
      urlIsCopied: false
    }
  },
  computed: {
    // only works in https, supported by safari and android chrome
    // https://caniuse.com/#feat=web-share
    canNativeShare () {
      return Boolean(navigator.share)
    },
    url: {
      get () {
        const collaboratorKey = this.$store.state.currentSpace.collaboratorKey
        const spaceId = this.$store.state.currentSpace.id
        return `${window.location.origin}/invite?spaceId=${spaceId}&collaboratorKey=${collaboratorKey}`
      }
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
    }
  },
  watch: {
    visible (visible) {
      this.urlIsCopied = false
    }
  }
}
</script>

<style lang="stylus" scoped>
// todo media query for short screens (SE)?
.invite-others-to-edit
  left initial
  right 8px
  max-height calc(100vh - 180px)
  overflow auto
  .textarea
    margin-top 10px
</style>
