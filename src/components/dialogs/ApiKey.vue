<template lang="pug">
dialog.narrow.api-key(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p API Key
  section(v-if="currentUserIsSignedIn")
    p.badge.danger Be careful with sharing your API Key
    p Anyone with your key can read, edit, and remove your cards and spaces
    button(v-if="!keyIsRevealed" @click="revealKey")
      img.icon.view(src="@/assets/view.svg")
      span Reveal API Key
    template(v-if="keyIsRevealed")
      p.row
        .url-textarea.single-line
          span {{key}}
        .input-button-wrap(@click.left="copyKey")
          button.small-button
            img.icon.copy(src="@/assets/copy.svg")
      .row
        button(@click.left="copyKey")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy API Key

  section(v-if="!currentUserIsSignedIn")
    p After you sign up you'll be able to access your API Key here
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  section
    .button-wrap
      a(href="https://help.kinopio.club/api")
        button API Docs →

</template>

<script>
import cache from '@/cache.js'
import utils from '@/utils.js'

export default {
  name: 'ApiKey',
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
      dialogHeight: null,
      keyIsRevealed: false,
      key: ''
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'ApiInfo.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    revealKey () {
      this.key = cache.user().apiKey
      console.log(this.key, cache.user().apiKey)
      this.keyIsRevealed = true
    },
    async copyKey (event) {
      this.$store.commit('clearNotificationsWithPosition')
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(this.key)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copyKey', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      this.keyIsRevealed = false
      this.key = ''
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.api-key
  max-height calc(100vh - 190px)
  overflow auto
</style>
