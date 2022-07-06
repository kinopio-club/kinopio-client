<template lang="pug">
.footer-wrap(:style="position" v-if="!isAddPage")
  .left(v-if="!isEmbed")
    footer
      Notifications
      .controls(v-if="isVisible" :class="{'fade-out': isFadingOut, 'hidden': isHidden}")
        section
          .button-wrap
            .segmented-buttons
              //- Explore
              button(@click.left="toggleExploreIsVisible" :class="{ active: exploreIsVisible}")
                img.icon.sunglasses(src="@/assets/sunglasses.svg")
                span(v-if="unreadExploreSpacesLength") {{ unreadExploreSpacesLength }}
              // Live
              button(@click.left="toggleLiveIsVisible" :class="{ active: liveIsVisible}")
                img.icon.camera(src="@/assets/camera.svg")
                span(v-if="liveSpaces.length") {{ liveSpaces.length }}
            Explore(:visible="exploreIsVisible" @preloadedSpaces="exploreSpaces")
            Live(:visible="liveIsVisible" :spaces="liveSpaces" :loading="isLoadingLiveSpaces")
          //- Favorites
          .button-wrap
            .segmented-buttons
              button(:class="{active: favoritesActionsIsVisible}" @click.left.prevent="toggleFavoritesActionsIsVisible" @keydown.stop.enter="toggleFavoritesActionsIsVisible")
                img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
                img.icon(v-else src="@/assets/heart-empty.svg")
              button(@click.left="toggleFavoritesIsVisible" :class="{ active: favoritesIsVisible}")
                img.icon.down-arrow(src="@/assets/down-arrow.svg" :class="{ 'is-mobile-icon': isMobile }")
                span(v-if="favoriteSpacesEditedCount") {{favoriteSpacesEditedCount}}
            Favorites(:visible="favoritesIsVisible")
            FavoritesActions(:visible="favoritesActionsIsVisible")
          //- Mobile Tips
          .button-wrap(v-if="isMobileOrTouch")
            button(@click.left="toggleMobileTipsIsVisible" :class="{ active: mobileTipsIsVisible}")
              img.icon(src="@/assets/press-and-hold.svg")
              span Tips
            MobileTips(:visible="mobileTipsIsVisible")

  .right(:class="{'is-embed': isEmbed, 'fade-out': isFadingOut, 'hidden': isHidden}")
    button(@pointerup="toggleMinimapIsVislble" :class="{ active: minimapIsVisible }")
      img.icon.minimap(src="@/assets/minimap.svg")
    template(v-if="!isMobileOrTouch")
      SpaceZoom
</template>

<script>
import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'
import Favorites from '@/components/dialogs/Favorites.vue'
import FavoritesActions from '@/components/dialogs/FavoritesActions.vue'
import MobileTips from '@/components/dialogs/MobileTips.vue'
import Notifications from '@/components/Notifications.vue'
import SpaceZoom from '@/components/SpaceZoom.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'

let updateFavoritesIntervalTimer, updateLiveSpacesIntervalTimer

const fadeOutDuration = 10
const hiddenDuration = 10
const updatePositionDuration = 60
let shouldNotifyMinimapKeyboardShortcut = true
let fadeOutIteration, fadeOutTimer, hiddenIteration, hiddenTimer, updatePositionIteration, updatePositionTimer, shouldCancelFadeOut

export default {
  name: 'Footer',
  components: {
    Explore,
    Live,
    Notifications,
    Favorites,
    FavoritesActions,
    MobileTips,
    Loader,
    SpaceZoom
  },
  props: {
    isPinchZooming: Boolean
  },
  data () {
    return {
      favoritesActionsIsVisible: false,
      favoritesIsVisible: false,
      exploreIsVisible: false,
      liveIsVisible: false,
      mobileTipsIsVisible: false,
      position: {},
      liveSpaces: [],
      isLoadingLiveSpaces: true,
      isFadingOut: false,
      isHidden: false,
      exploreSpaces: []
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
      }
    })
    window.addEventListener('scroll', this.updatePosition)
    window.addEventListener('online', this.updateLiveSpaces)
    this.updatePosition()
    this.updateFavorites()
    this.updateLiveSpaces()
    updateFavoritesIntervalTimer = setInterval(() => {
      this.updateFavorites()
    }, 1000 * 60 * 10) // 10 minutes
    updateLiveSpacesIntervalTimer = setInterval(() => {
      this.updateLiveSpaces()
    }, 1000 * 60 * 5) // 5 minutes
    this.updateExploreSpaces()
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePosition)
    window.removeEventListener('online', this.updateLiveSpaces)
    clearInterval(updateFavoritesIntervalTimer)
    clearInterval(updateLiveSpacesIntervalTimer)
  },
  computed: {
    minimapIsVisible () { return this.$store.state.minimapIsVisible },
    isAddPage () { return this.$store.state.isAddPage },
    isEmbed () { return this.$store.state.isEmbed },
    currentUser () { return this.$store.state.currentUser },
    favoriteSpacesEditedCount () {
      let favoriteSpaces = utils.clone(this.currentUser.favoriteSpaces)
      favoriteSpaces = favoriteSpaces.filter(space => {
        const isEditedByOtherUser = space.editedByUserId !== this.currentUser.id
        const isEditedAndNotVisited = space.isEdited && space.userId !== this.currentUser.id
        return isEditedByOtherUser && isEditedAndNotVisited
      })
      return favoriteSpaces.length
    },
    isMobileOrTouch () {
      const isTouchDevice = this.$store.getters.isTouchDevice
      const isMobile = utils.isMobile()
      return isTouchDevice || isMobile
    },
    isVisible () {
      const isTouchDevice = this.$store.getters.isTouchDevice
      const shouldExplicitlyHideFooter = this.$store.state.shouldExplicitlyHideFooter
      const contentDialogIsVisible = Boolean(this.$store.state.cardDetailsIsVisibleForCardId || this.$store.state.multipleSelectedActionsIsVisible || this.$store.state.connectionDetailsIsVisibleForConnectionId)
      // only hide footer on touch devices
      if (!isTouchDevice) { return true }
      if (shouldExplicitlyHideFooter) { return }
      let isVisible = true
      if (contentDialogIsVisible) { isVisible = false }
      if (this.shouldHideFooter) { isVisible = false }
      return isVisible
    },
    shouldHideFooter () {
      return this.$store.state.shouldHideFooter
    },
    isFavoriteSpace () { return this.$store.getters['currentSpace/isFavorite'] },
    isMobile () {
      return utils.isMobile()
    },
    isMobileStandalone () {
      return utils.isMobile() && navigator.standalone // is homescreen app
    },
    unreadExploreSpacesLength () {
      let readDate = this.$store.state.currentUser.showInExploreUpdatedAt
      if (!readDate) { return '20+' }
      readDate = dayjs(readDate)
      const unreadSpaces = this.exploreSpaces.filter(space => {
        const spaceDate = dayjs(space.showInExploreUpdatedAt)
        const delta = readDate.diff(spaceDate, 'second')
        return delta < 0
      })
      return unreadSpaces.length
    }
  },
  methods: {
    toggleMinimapIsVislble (event) {
      this.closeDialogs()
      const value = !this.minimapIsVisible
      this.$store.commit('minimapIsVisible', value)
      const isMouseClick = event.pointerType === 'mouse'
      if (value && isMouseClick && shouldNotifyMinimapKeyboardShortcut) {
        this.$store.commit('addNotification', { message: 'Hold z for minimap', type: 'currentUser', icon: 'minimap' })
        shouldNotifyMinimapKeyboardShortcut = false
      }
    },
    closeDialogs (exclude) {
      this.favoritesActionsIsVisible = false
      this.favoritesIsVisible = false
      this.exploreIsVisible = false
      this.liveIsVisible = false
      this.mobileTipsIsVisible = false
    },
    toggleFavoritesActionsIsVisible () {
      const isVisible = this.favoritesActionsIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleFavoritesActionsIsVisible')
      this.favoritesActionsIsVisible = !isVisible
    },
    toggleFavoritesIsVisible () {
      const isVisible = this.favoritesIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleFavoritesIsVisible')
      this.favoritesIsVisible = !isVisible
    },
    toggleExploreIsVisible () {
      const isVisible = this.exploreIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleExploreIsVisible')
      this.exploreIsVisible = !isVisible
    },
    toggleLiveIsVisible () {
      const isVisible = this.liveIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleLiveIsVisible')
      this.liveIsVisible = !isVisible
      if (this.liveIsVisible) {
        this.updateLiveSpaces()
      }
    },
    toggleMobileTipsIsVisible () {
      const isVisible = this.mobileTipsIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleMobileTipsIsVisible')
      this.mobileTipsIsVisible = !isVisible
    },
    async updateFavorites () {
      await this.$store.dispatch('currentUser/restoreUserFavorites')
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

    // preload explore spaces

    async updateExploreSpaces () {
      this.exploreSpaces = await this.$store.dispatch('api/getExploreSpaces')
    },

    // hide

    hidden (event) {
      if (!this.$store.getters.isTouchDevice) { return }
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
      if (!this.$store.getters.isTouchDevice) { return }
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
        offsetTop = 10
      }
      const top = Math.round(viewport.height + viewport.offsetTop - layoutViewport.getBoundingClientRect().height - (offsetTop))
      let style
      if (scale > 1) {
        style = {
          transform: `translate(${left}px, ${top}px) scale(${counterScale})`,
          'transform-origin': 'left bottom'
        }
      } else {
        if (offsetTop) { offsetTop = offsetTop + 5 }
        style = {
          transform: `translate(${left}px, ${-offsetTop}px)`,
          zoom: counterScale,
          'transform-origin': 'left bottom',
          'margin-left': `-${left}px`
        }
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
  left 8px
  bottom 8px
  right 8px
  max-width 100%
  pointer-events none
  .right
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
  </style>
