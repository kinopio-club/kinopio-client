<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Share
  section(v-if="spaceHasUrl")
    template(v-if="canEditSpace")
      .button-wrap
        button(@click="togglePrivacyPickerIsVisible" :class="{ active: privacyPickerIsVisible }")
          //- TODO img lock or unlock based on spaceIsPrivate
          .badge(:class="privacyState.color")
            img.icon(v-if="spaceIsPrivate" src="@/assets/lock.svg")
            img.icon(v-else src="@/assets/unlock.svg")
            span {{privacyState.name | capitalize}}
          p.description {{privacyState.description | capitalize}}
          //- span

        PrivacyPicker(:visible="privacyPickerIsVisible")
      //-v-if privacy === public

      //-v-if privacy === closed
      //- p
      //-   .badge.info Everyone can view
      //-   span and only you can edit
      //- Everyone can view this space but only you and your [collaborators || group] , can edit it

      //-v-if privacy === private

      //- todo  PrivacyPicker.vue (based on SpacePicker.vue)

    textarea(ref="url") {{url()}}

    button(@click="copyUrl" v-if="!canNativeShare") Copy Url
    .segmented-buttons(v-if="canNativeShare")
      button(@click="copyUrl")
        span Copy Url
      button(@click="shareUrl")
        img.icon(src="@/assets/share.svg")
    .row
      .badge.success.success-message(v-if="urlIsCopied") Url Copied

  section(v-if="!spaceHasUrl")
    p
      span To share,
      span.badge.info you need to Sign Up or In
      span for your spaces to be synced and accessible anywhere.
    button(@click="triggerSignUpOrInIsVisible") Sign Up or In
</template>

<script>
import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'
import utils from '@/utils.js'
import privacy from '@/spaces/privacy.js'

export default {
  name: 'Share',
  components: {
    PrivacyPicker
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      urlIsCopied: false,
      spaceHasUrl: false,
      privacyPickerIsVisible: false
    }
  },
  filters: {
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
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
    privacyState () {
      const currentPrivacy = this.$store.state.currentSpace.privacy
      return privacy.states().find(state => {
        return state.name === currentPrivacy
      })
      // console.log(x)
      // return x
    },
    spaceIsPrivate () {
      const currentPrivacy = this.$store.state.currentSpace.privacy
      return currentPrivacy === 'private'
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
    },
    togglePrivacyPickerIsVisible () {
      this.privacyPickerIsVisible = !this.privacyPickerIsVisible
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
    &.danger
      background-color var(--danger-background)
  .success-message
    margin-top 10px
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
    margin-bottom 4px
    height 50px
    margin-top 10px
  .description
    margin-top 3px
</style>
