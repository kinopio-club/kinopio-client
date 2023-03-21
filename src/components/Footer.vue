<template lang="pug">
.footer-wrap(:style="position" v-if="isVisible" :class="{'fade-out': isFadingOut}")
  .left(v-if="leftIsVisble")
    footer
      Notifications
      .controls(v-if="controlsIsVisible" :class="{'hidden': isHidden}")
        section
          .button-wrap(v-if="userHasInbox")
            button(@click.left="toggleAddToInboxIsVisible" :class="{ active: addToInboxIsVisible}")
              img.icon(src="@/assets/add.svg")
              img.icon.inbox-icon(src="@/assets/inbox.svg")
            AddToInbox(:visible="addToInboxIsVisible")
          .button-wrap
            .segmented-buttons
              //- Explore
              button(@click.left="toggleExploreIsVisible" :class="{ active: exploreIsVisible}")
                img.icon.sunglasses(src="@/assets/sunglasses.svg")
                span Explore
                span(v-if="unreadExploreSpacesLength") &nbsp;{{ unreadExploreSpacesLength }}
              // Live
              button(@click.left="toggleLiveIsVisible" :class="{ active: liveIsVisible}")
                img.icon.camera(src="@/assets/camera.svg")
                span(v-if="liveSpaces.length") {{ liveSpaces.length }}
            Explore(:visible="exploreIsVisible" @preloadedSpaces="exploreSpaces")
            Live(:visible="liveIsVisible" :spaces="liveSpaces" :loading="isLoadingLiveSpaces")
          .button-wrap
            button(:class="{active: isFavoriteSpace}" @click.left.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace")
              img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
              img.icon(v-else src="@/assets/heart-empty.svg")

  .right(:class="{'is-embed': isEmbedMode, 'hidden': isHidden}" v-if="!isMobileOrTouch")
    SpaceZoom
</template>

<script>
import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'
import AddToInbox from '@/components/dialogs/AddToInbox.vue'
import Notifications from '@/components/Notifications.vue'
import SpaceZoom from '@/components/SpaceZoom.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

import dayjs from 'dayjs'

let updateLiveSpacesIntervalTimer

const fadeOutDuration = 10
const hiddenDuration = 20
const updatePositionDuration = 60
let fadeOutIteration, fadeOutTimer, hiddenIteration, hiddenTimer, updatePositionIteration, updatePositionTimer, shouldCancelFadeOut

export default {
  name: 'Footer',
  components: {
    Explore,
    Live,
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
      exploreIsVisible: false,
      liveIsVisible: false,
      position: {},
      liveSpaces: [],
      isLoadingLiveSpaces: true,
      isFadingOut: false,
      isHidden: false,
      exploreSpaces: [],
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
        this.hidden()
      } else if (mutation.type === 'triggerAddToInboxIsVisible') {
        this.addToInboxIsVisible = true
      } else if (mutation.type === 'triggerCheckIfUseHasInboxSpace') {
        this.updateUserHasInbox()
      } else if (mutation.type === 'triggerShowExplore') {
        this.exploreIsVisible = true
      }
    })
    window.addEventListener('scroll', this.updatePosition)
    window.addEventListener('online', this.updateLiveSpaces)
    this.updatePosition()
    this.updateLiveSpaces()
    this.updateExploreSpaces()
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePosition)
    window.removeEventListener('online', this.updateLiveSpaces)
    clearInterval(updateLiveSpacesIntervalTimer)
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
      // only hide footer on touch devices
      if (!this.isTouchDevice) { return true }
      if (this.shouldExplicitlyHideFooter) { return }
      let isVisible = true
      if (contentDialogIsVisible) { isVisible = false }
      if (this.shouldHideFooter) { isVisible = false }
      return isVisible
    },
    isMobile () { return utils.isMobile() },
    isMobileStandalone () {
      return utils.isMobile() && navigator.standalone // is homescreen app
    },
    unreadExploreSpacesLength () {
      let readDate = this.currentUser.showInExploreUpdatedAt
      if (!readDate) { return '20+' }
      readDate = dayjs(readDate)
      const unreadSpaces = this.exploreSpaces.filter(space => {
        const spaceDate = dayjs(space.showInExploreUpdatedAt)
        const delta = readDate.diff(spaceDate, 'second')
        return delta < 0
      })
      return unreadSpaces.length
    },
    isFavoriteSpace () { return this.$store.getters['currentSpace/isFavorite'] }
  },
  methods: {
    toggleIsFavoriteSpace () {
      const currentSpace = this.$store.state.currentSpace
      if (this.isFavoriteSpace) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'space', item: currentSpace })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'space', item: currentSpace })
      }
      this.updateLocalSpaces()
    },
    closeDialogs (exclude) {
      this.exploreIsVisible = false
      this.liveIsVisible = false
      this.addToInboxIsVisible = false
    },
    toggleExploreIsVisible () {
      const isVisible = this.exploreIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.exploreIsVisible = !isVisible
    },
    toggleLiveIsVisible () {
      const isVisible = this.liveIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.liveIsVisible = !isVisible
      if (this.liveIsVisible) {
        this.updateLiveSpaces()
      }
    },
    toggleAddToInboxIsVisible () {
      const isVisible = this.addToInboxIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.addToInboxIsVisible = !isVisible
    },
    async updateLiveSpaces () {
      this.isLoadingLiveSpaces = true
      let spaces = await this.$store.dispatch('api/getLiveSpaces')
      if (!spaces || !spaces.length) {
        this.isLoadingLiveSpaces = false
        return
      }
      spaces = spaces.filter(space => space.user.id !== this.currentUser.id)
      spaces = this.normalizeLiveSpaces(spaces)
      this.liveSpaces = spaces
      this.isLoadingLiveSpaces = false
    },
    normalizeLiveSpaces (spaces) {
      let normalizedSpaces = []
      spaces = spaces.map(space => {
        space.otherUsers = []
        return space
      })
      spaces.forEach(space => {
        const spaceExists = normalizedSpaces.find(normalizedSpace => normalizedSpace.id === space.id)
        if (spaceExists) {
          // update otherUsers
          normalizedSpaces = normalizedSpaces.map(normalizedSpace => {
            if (normalizedSpace.id === space.id) {
              normalizedSpace.otherUsers.push(space.user)
            }
            return normalizedSpace
          })
        } else {
          normalizedSpaces.push(space)
        }
      })
      return normalizedSpaces
    },
    async updateUserHasInbox () {
      const currentUserIsSignedIn = this['currentUser/isSignedIn']
      if (!currentUserIsSignedIn) { return }
      const inboxSpace = await this.$store.dispatch('currentUser/inboxSpace')
      this.userHasInbox = Boolean(inboxSpace)
    },

    // preload explore spaces

    async updateExploreSpaces () {
      try {
        this.exploreSpaces = await this.$store.dispatch('api/getExploreSpaces')
      } catch (error) {
        console.warn('🚑 updateExploreSpaces', error)
      }
    },

    // hide

    hidden (event) {
      if (!this.isTouchDevice) { return }
      hiddenIteration = 0
      if (hiddenTimer) { return }
      hiddenTimer = window.requestAnimationFrame(this.hiddenFrame)
    },
    hiddenFrame () {
      hiddenIteration++
      this.isHidden = true
      if (hiddenIteration < hiddenDuration) {
        window.requestAnimationFrame(this.hiddenFrame)
      } else {
        this.cancelHidden()
      }
    },
    cancelHidden () {
      window.cancelAnimationFrame(hiddenTimer)
      hiddenTimer = undefined
      this.isHidden = false
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
      if (!this.isTouchDevice) { return }
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
      const layoutViewport = document.getElementById('layout-viewport')
      const scale = utils.roundFloat(viewport.scale)
      const counterScale = utils.roundFloat(1 / viewport.scale)
      const left = Math.round(viewport.offsetLeft)
      let offsetTop = 0
      if (navigator.standalone) {
        offsetTop = 15
      }
      const top = Math.round(viewport.height + viewport.offsetTop - layoutViewport.getBoundingClientRect().height)
      let style = {
        transform: `translate(${left}px, ${top + offsetTop}px) scale(${counterScale})`,
        maxWidth: Math.round(viewport.width * scale) + 'px'
      }
      if (utils.isIPhone() && scale <= 1) {
        style.transform = 'none'
        style.zoom = counterScale
        style.marginBottom = offsetTop + 'px'
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
  bottom 0
  right 0
  padding 8px
  max-width 100%
  pointer-events none
  transform-origin left bottom
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
