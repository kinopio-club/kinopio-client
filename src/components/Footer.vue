<template lang="pug">
.footer-wrap(:style="position" v-if="isVisible" :class="{'fade-out': isFadingOut}" ref="footer")
  .left(v-if="leftIsVisble")
    footer
      Notifications
      .controls(v-if="controlsIsVisible" :class="{'hidden': isHiddenOnTouch}")
        section
          .button-wrap(v-if="userHasInbox")
            button(@click.left.prevent.stop="toggleAddToInboxIsVisible" :class="{ active: addToInboxIsVisible}")
              img.icon(src="@/assets/add.svg")
              img.icon.inbox-icon(src="@/assets/inbox.svg")
            AddToInbox(:visible="addToInboxIsVisible")

  .right(:class="{'is-embed': isEmbedMode, 'hidden': isHiddenOnTouch}" v-if="!isMobileOrTouch")
    SpaceZoom
    .button-wrap.input-button-wrap.settings-button-wrap(@click="toggleUserSettingsIsVisible")
      button.small-button(:class="{active: userSettingsIsVisible}" title="Settings → Controls")
        img.icon.settings(src="@/assets/settings.svg")
</template>

<script>
import AddToInbox from '@/components/dialogs/AddToInbox.vue'
import Notifications from '@/components/Notifications.vue'
import SpaceZoom from '@/components/SpaceZoom.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

const fadeOutDuration = 10
const hiddenOnTouchDuration = 20
const updatePositionDuration = 60
let fadeOutIteration, fadeOutTimer, hiddenOnTouchIteration, hiddenOnTouchTimer, updatePositionIteration, updatePositionTimer, shouldCancelFadeOut

export default {
  name: 'Footer',
  components: {
    Notifications,
    Loader,
    SpaceZoom,
    AddToInbox
  },
  props: {
    isPinchZooming: Boolean,
    isTouchScrolling: Boolean
  },
  data () {
    return {
      position: {},
      isFadingOut: false,
      isHiddenOnTouch: false,
      addToInboxIsVisible: false,
      userHasInbox: false
    }
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.closeDialogs()
      } else if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        this.updatePosition()
      } else if (mutation.type === 'triggerHideTouchInterface') {
        this.hideOnTouch()
      } else if (mutation.type === 'triggerAddToInboxIsVisible') {
        this.addToInboxIsVisible = true
      } else if (mutation.type === 'triggerCheckIfUseHasInboxSpace') {
        this.updateUserHasInbox()
      }
    })
    window.addEventListener('scroll', this.updatePosition)
    this.updatePosition()
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePosition)
  },
  computed: {
    ...mapState([
      'isAddPage',
      'isEmbedMode',
      'currentUser',
      'shouldExplicitlyHideFooter',
      'cardDetailsIsVisibleForCardId',
      'multipleSelectedActionsIsVisible',
      'connectionDetailsIsVisibleForConnectionId',
      'shouldHideFooter',
      'isPresentationMode'
    ]),
    ...mapGetters([
      'currentUser/isSignedIn',
      'isTouchDevice'
    ]),
    isMobileOrTouch () {
      const isMobile = utils.isMobile()
      return this.isTouchDevice || isMobile
    },
    isVisible () {
      if (this.isAddPage) { return }
      return true
    },
    leftIsVisble () {
      if (this.isPresentationMode) { return }
      if (this.isEmbedMode) { return }
      return true
    },
    controlsIsVisible () {
      const contentDialogIsVisible = Boolean(this.cardDetailsIsVisibleForCardId || this.multipleSelectedActionsIsVisible || this.connectionDetailsIsVisibleForConnectionId)
      if (this.shouldExplicitlyHideFooter) { return }
      if (contentDialogIsVisible) { return }
      if (this.shouldHideFooter) { return }
      return true
    },
    isMobile () { return utils.isMobile() },
    isMobileStandalone () {
      return utils.isMobile() && navigator.standalone // is homescreen app
    },
    isFavoriteSpace () { return this.$store.getters['currentSpace/isFavorite'] },
    userSettingsIsVisible () { return this.$store.state.userSettingsIsVisible }
  },
  methods: {
    closeDialogs () {
      this.addToInboxIsVisible = false
    },
    toggleAddToInboxIsVisible () {
      const isVisible = this.addToInboxIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.addToInboxIsVisible = !isVisible
    },
    async updateUserHasInbox () {
      const currentUserIsSignedIn = this['currentUser/isSignedIn']
      if (!currentUserIsSignedIn) { return }
      const inboxSpace = await this.$store.dispatch('currentUser/inboxSpace')
      this.userHasInbox = Boolean(inboxSpace)
    },

    // settings

    toggleUserSettingsIsVisible () {
      const value = !this.$store.state.userSettingsIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('userSettingsIsVisible', value)
      this.$nextTick(() => {
        this.$store.commit('triggerControlsSettingsIsVisible')
      })
    },

    // hide

    hideOnTouch (event) {
      if (!this.isTouchDevice) { return }
      hiddenOnTouchIteration = 0
      if (hiddenOnTouchTimer) { return }
      hiddenOnTouchTimer = window.requestAnimationFrame(this.hiddenOnTouchFrame)
    },
    hiddenOnTouchFrame () {
      hiddenOnTouchIteration++
      this.isHiddenOnTouch = true
      if (hiddenOnTouchIteration < hiddenOnTouchDuration) {
        window.requestAnimationFrame(this.hiddenOnTouchFrame)
      } else {
        this.cancelHidden()
      }
    },
    cancelHidden () {
      window.cancelAnimationFrame(hiddenOnTouchTimer)
      hiddenOnTouchTimer = undefined
      this.isHiddenOnTouch = false
    },

    // fade out

    fadeOut () {
      fadeOutIteration = 0
      if (fadeOutTimer) { return }
      shouldCancelFadeOut = false
      fadeOutTimer = window.requestAnimationFrame(this.fadeOutFrame)
    },
    cancelFadeOut () {
      window.cancelAnimationFrame(fadeOutTimer)
      fadeOutTimer = undefined
      this.isFadingOut = false
      this.cancelUpdatePosition()
      this.updatePosition()
    },
    fadeOutFrame () {
      fadeOutIteration++
      this.isFadingOut = true
      if (shouldCancelFadeOut) {
        this.cancelFadeOut()
      } else if (fadeOutIteration < fadeOutDuration) {
        window.requestAnimationFrame(this.fadeOutFrame)
      }
    },

    // update position

    updatePosition () {
      updatePositionIteration = 0
      if (updatePositionTimer) { return }
      updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
    },
    cancelUpdatePosition () {
      window.cancelAnimationFrame(updatePositionTimer)
      updatePositionTimer = undefined
    },
    updatePositionFrame () {
      updatePositionIteration++
      this.updatePositionInVisualViewport()
      if (updatePositionIteration < updatePositionDuration) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        this.cancelUpdatePosition()
      }
    },
    updatePositionInVisualViewport () {
      const viewport = utils.visualViewport()
      const scale = utils.roundFloat(viewport.scale)
      const counterScale = utils.roundFloat(1 / viewport.scale)
      const left = Math.round(viewport.offsetLeft)
      let element = this.$refs.footer
      const rect = element.getBoundingClientRect()
      let height = rect.height
      if (window.navigator.shouldAddSafeAreaPaddingBottom) {
        height = height + 20
      }
      let style = {
        // transform: `translate(${left}px, ${top + offsetTop}px) scale(${counterScale})`,
        transform: `translate(${left}px, 0px) scale(${counterScale})`,
        maxWidth: Math.round(viewport.width * scale) + 'px',
        top: `calc(100dvh - ${height}px)`
      }
      if (utils.isIPhone() && scale <= 1) {
        style.transform = 'none'
        style.zoom = counterScale
      }
      this.position = style
    }
  },
  watch: {
    isPinchZooming (value) {
      if (value) {
        this.fadeOut()
        this.updatePosition()
      } else {
        shouldCancelFadeOut = true
        this.cancelFadeOut()
      }
    },
    isTouchScrolling (value) {
      if (!utils.isAndroid()) { return }
      if (value) {
        this.fadeOut()
        this.updatePosition()
      } else {
        shouldCancelFadeOut = true
        this.cancelFadeOut()
      }
    }
  }
}
</script>

<style lang="stylus">
.footer-wrap
  display flex
  justify-content space-between
  align-items flex-end
  --footer-max-z 2147483644 // var(--max-z) - 2, hardcoded because firefox vars in calc is buggy
  z-index var(--footer-max-z)
  position fixed
  left 0
  right 0
  padding 8px
  max-width 100%
  pointer-events none
  transform-origin left bottom
  margin-bottom env(safe-area-inset-bottom)
  .right
    margin-left auto
    display flex
    align-items center
    pointer-events all
    text-align right
    transition 0.2s opacity
    &.is-embed
      position absolute
      right 0
    .settings-button-wrap
      pointer-events all
      cursor pointer
      padding-top 6px
      padding-left 4px
      padding-bottom 10px
      padding-right 6px
      margin-right -6px
      translate 0px 3px
      display block
      button
        font-size 1rem
  &.is-mobile
    margin-bottom 10px
  &.is-mobile-standalone
    margin-bottom 20px

  .left,
  .right
    pointer-events none
    button,
    .space-zoom
      pointer-events auto

footer
  .is-mobile-icon
    vertical-align 2px !important
  .undo
    margin 0
    height 11px
  .controls
    transition 0.2s opacity
    > section
      display flex
      &:last-child
        margin-top 6px
      > .button-wrap
        pointer-events all
        margin-left 6px
        display inline-block
        dialog
          top initial
          bottom calc(100% - 8px)
        &:first-child
          margin-left 0

  .segmented-buttons
    .down-arrow
      padding 0

  button
    .icon.down-arrow
      padding 0
    .icon.camera
      vertical-align 0
  .inbox-icon
    vertical-align 0px
    width 13px
    margin-left 6px

  </style>
