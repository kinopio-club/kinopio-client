<template lang="pug">
dialog.narrow.embed(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Embed
  section

    template(v-if="!currentUserIsSignedIn")
      p
        span Sign Up or In to embed this space anywhere
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    template(v-else-if="!spaceIsPublic")
      p To embed this space, set the privacy to
        span.badge.info
          img.icon.closed(src="@/assets/unlock.svg")
          span {{privacyName(1)}}
        span or
        span.badge.success.last-child
          img.icon.open(src="@/assets/open.svg")
          span {{privacyName(0)}}

    // if not signed in

    // else if space is private

    template(v-if="isEmbedable")
      .row
        .segmented-buttons
          button(@click="toggleIframeIsVisible" :class="{ active: iframeIsVisible }")
            span iFrame
          button(@click="toggleUrlIsVisible" :class="{ active: !iframeIsVisible }")
            span URL

      //- iFrame
      template(v-if="iframeIsVisible")
        .row
          .url-textarea {{iframe}}
          .input-button-wrap(@click.left="copy")
            button.small-button
              img.icon.copy(src="@/assets/copy.svg")
      //- Url
      template(v-if="!iframeIsVisible")
        .row
          .url-textarea {{url}}
          .input-button-wrap(@click.left="copy")
            button.small-button
              img.icon.copy(src="@/assets/copy.svg")
      //- Zoom
      .row
        img.icon.icon-zoom(src="@/assets/search.svg")
        Slider(
          @updatePlayhead="updateZoom"
          :minValue="40"
          :value="spaceZoomPercent"
          :maxValue="100"
        )

      .row
        button(@click.left="copy")
          img.icon.copy(src="@/assets/copy.svg")
          span(v-if="iframeIsVisible") Copy Embed Code
          span(v-else) Copy Embed URL

</template>

<script>
import Slider from '@/components/Slider.vue'
import utils from '@/utils.js'
import privacy from '@/data/privacy.js'

export default {
  name: 'Embed',
  components: {
    Slider
  },
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
      iframeIsVisible: true,
      min: 40,
      max: 100,
      dialogHeight: null
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    spacePrivacy () { return this.$store.state.currentSpace.privacy },
    spaceIsPublic () {
      return this.spacePrivacy !== 'private'
    },
    isEmbedable () {
      return this.currentUserIsSignedIn && this.spaceIsPublic
    },
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent },
    url () {
      const spaceId = this.$store.state.currentSpace.id
      const zoom = this.spaceZoomPercent
      return `${utils.kinopioDomain()}/embed/?spaceId=${spaceId}&zoom=${zoom}`
    },
    iframe () {
      return `<div class="kinopio-embed" style="height: 420px; width: 100%;">
  <iframe src="${this.url}" style="height: 100%; width: 100%; border: 0; border-radius: 6px;">
  </iframe>
</div>`
    }
  },
  methods: {
    updateZoom (percent) {
      percent = percent / 100
      percent = Math.round(this.min + (this.max - this.min) * percent)
      this.$store.commit('spaceZoomPercent', percent)
    },
    toggleIframeIsVisible (event) {
      this.iframeIsVisible = true
      this.$store.commit('clearNotificationsWithPosition')
    },
    toggleUrlIsVisible () {
      this.iframeIsVisible = false
      this.$store.commit('clearNotificationsWithPosition')
    },
    async copy (event) {
      this.$store.commit('clearNotificationsWithPosition')
      let value
      if (this.iframeIsVisible) {
        value = this.iframe
      } else {
        value = this.url
      }
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(value)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copy', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    privacyName (number) {
      const state = privacy.states()[number]
      const name = state.friendlyName || state.name
      return utils.capitalizeFirstLetter(name)
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      if (visible) {
        this.toggleIframeIsVisible()
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.embed
  left initial
  right 8px
  overflow scroll
  @media(max-width 350px)
    right -50px
  .success-message
    margin-top 10px
  .slider
    margin-top -10px
  .icon-zoom
    margin-right 4px
    margin-top -4px
  .url-textarea
    max-height 80px
</style>
