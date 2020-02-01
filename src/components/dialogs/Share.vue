<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Share
  section(v-if="spaceHasUrl")
    template(v-if="canEditSpace")
      button
        //- TODO img lock or unlock based on spaceIsPrivate
        span {{privacy}}
      p
        .badge.info Everyone can view
        span and only you can edit
      //- Everyone can view this space but only you and your [collaborators || group] , can edit it
    textarea(ref="url") {{url()}}

    button(@click="copyUrl" v-if="!canNativeShare") Copy Url
    .segmented-buttons(v-if="canNativeShare")
      button(@click="copyUrl")
        span Copy Url
      button(@click="shareUrl")
        img.icon(src="@/assets/share.svg")
    .row
      .badge.success(v-if="urlIsCopied") Url Copied

  section(v-if="!spaceHasUrl")
    p
      span To share,
      span.badge.info you need to Sign Up or In
      span for your spaces to be synced and accessible anywhere.
    button(@click="triggerSignUpOrInIsVisible") Sign Up or In
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'Share',
  props: {
    visible: Boolean
  },
  data () {
    return {
      urlIsCopied: false,
      spaceHasUrl: false
    }
  },
  computed: {
    spaceName () { return this.$store.state.currentSpace.name },
    canEditSpace () {
      const canEdit = this.$store.getters['currentUser/canEditCurrentSpace']
      return canEdit
    },
    // only works in https, supported by safari and android chrome
    // https://caniuse.com/#feat=web-share
    canNativeShare () {
      return Boolean(navigator.share)
    },
    privacy () {
      return utils.capitalizeFirstLetter(this.$store.state.currentSpace.privacy)
    },
    spaceIsPrivate () {
      return this.privacy === 'Private'
    }
  },
  methods: {
    url () {
      return window.location.href
    },
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    shareUrl () {
      const data = {
        title: 'Kinopio',
        text: this.spaceName,
        url: this.url()
      }
      navigator.share(data)
    }
  },
  watch: {
    visible (visible) {
      this.urlIsCopied = false
      this.spaceHasUrl = window.location.href !== (window.location.origin + '/')
    }
  }
}
</script>

<style lang="stylus">
.share
  top calc(100% - 8px)
  left initial
  right 8px
  .badge
    display inline-block
  .badge.success
    margin-top 10px
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
    margin-bottom 4px
    height 50px
</style>
