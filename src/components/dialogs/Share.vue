<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.stop="closeDialogs" ref="dialog")
  section
    p Share
  section(v-if="spaceHasUrl")
    template(v-if="isSpaceMember")
      .button-wrap.privacy-wrap
        button(@click.stop="togglePrivacyPickerIsVisible" :class="{ active: privacyPickerIsVisible }")
          .badge(:class="privacyState.color")
            img.icon(:src="privacyIcon(privacyState).path" :class="privacyState.name")
            span {{privacyState.name | capitalize}}
          p.description {{privacyState.description | capitalize}}
        PrivacyPicker(:visible="privacyPickerIsVisible" @closeDialog="closeDialogs")

    template(v-if="!spaceIsPrivate")
      input.textarea(ref="url" v-model="url")
      button(@click="copyUrl" v-if="!canNativeShare")
        span Copy Url
      .segmented-buttons(v-if="canNativeShare")
        button(@click="copyUrl")
          span Copy Url
        button(@click="shareUrl")
          img.icon(src="@/assets/share.svg")
      .row
        .badge.success.success-message(v-if="urlIsCopied") Url Copied

  //- section(v-if="spaceHasUrl && canEditSpace")
  //-   .button-wrap
  //-     button(@click.stop="toggleInviteCollaboratorsIsVisible" :class="{ active: inviteCollaboratorsIsVisible }")
  //-       span Invite Collaborators
  //-     InviteCollaborators(:visible="inviteCollaboratorsIsVisible")

  section(v-if="!spaceHasUrl")
    p
      //- span To share or invite collaborators,
      span To share,
      span.badge.info you need to Sign Up or In
      span for your spaces to be synced and accessible anywhere.
    button(@click="triggerSignUpOrInIsVisible") Sign Up or In

</template>

<script>
import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'
import InviteCollaborators from '@/components/dialogs/InviteCollaborators.vue'
import utils from '@/utils.js'
import privacy from '@/spaces/privacy.js'

export default {
  name: 'Share',
  components: {
    PrivacyPicker,
    InviteCollaborators
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      urlIsCopied: false,
      spaceHasUrl: false,
      privacyPickerIsVisible: false,
      inviteCollaboratorsIsVisible: false
    }
  },
  filters: {
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    }
  },
  computed: {
    spaceName () { return this.$store.state.currentSpace.name },
    spacePrivacy () { return this.$store.state.currentSpace.privacy },
    canEditSpace () {
      const canEdit = this.$store.getters['currentUser/canEditSpace']()
      return canEdit
    },
    // only works in https, supported by safari and android chrome
    // https://caniuse.com/#feat=web-share
    canNativeShare () {
      return Boolean(navigator.share)
    },
    privacyState () {
      return privacy.states().find(state => {
        return state.name === this.spacePrivacy
      })
    },
    spaceIsPrivate () {
      return this.spacePrivacy === 'private'
    },
    url: {
      get () {
        return window.location.href
      }
    },
    isSpaceMember () {
      const currentSpace = this.$store.state.currentSpace
      return this.$store.getters['currentUser/isSpaceMember'](currentSpace)
    }
  },
  methods: {
    // url () {
    //   return window.location.href
    // },
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
    privacyIcon (privacyState) {
      return {
        path: require(`@/assets/${privacyState.icon}.svg`)
      }
    },
    closeDialogs () {
      this.privacyPickerIsVisible = false
      this.inviteCollaboratorsIsVisible = false
    }
  },
  watch: {
    visible (visible) {
      this.urlIsCopied = false
      this.spaceHasUrl = window.location.href !== (window.location.origin + '/')
      this.closeDialogs()
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
  .textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
  .privacy-wrap + .textarea
    margin-top 10px
  .description
    margin-top 3px

  dialog.privacy-picker
    left initial
    right 8px
</style>
