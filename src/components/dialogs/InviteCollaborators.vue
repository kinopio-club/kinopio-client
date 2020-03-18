<template lang="pug">
dialog.narrow.invite-others-to-edit(v-if="visible" :open="visible" @click.stop)

  // add by email
  // share link

  section
    p Invite Collaborators

  section
    p Share this url to edit with others

    input.textarea(ref="url" v-model="url")

    button(v-if="!canNativeShare")
      span Copy Invite Url
    .segmented-buttons(v-if="canNativeShare")
      button(@click="copyUrl")
        span Copy Invite Url
      button(@click="shareUrl")
        img.icon(src="@/assets/share.svg")

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
        return window.location.href
      }
    }

  },
  methods: {
  }
}
</script>

<style lang="stylus" scoped>
// todo media query for short screens (SE)?
.invite-others-to-edit
  left initial
  right 8px
  .textarea
    margin-top 10px
  // input
  //   margin-top 10px
  // textarea
  //   margin-top 10px
</style>
