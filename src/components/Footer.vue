<template lang="pug">
.footer-wrap(:style="position" v-if="!isAddPage")
  .left(v-if="!isEmbed")
    footer
      Notifications
      .controls(v-if="isVisible" :class="{'fade-out': isFadeOut, 'hidden': isHidden}")
        section
          .button-wrap
            .segmented-buttons
              //- Explore
              button(@click.left="toggleExploreIsVisible" :class="{ active: exploreIsVisible}")
                img.icon.sunglasses(src="@/assets/sunglasses.svg")
                span(v-if="unreadExploreSpaces.length") {{ unreadExploreSpaces.length }}
              // Live
              button(@click.left="toggleLiveIsVisible" :class="{ active: liveIsVisible}")
                img.icon.camera(src="@/assets/camera.svg")
                span(v-if="liveSpaces.length") {{ liveSpaces.length }}
            Explore(:visible="exploreIsVisible" @preloadedSpaces="exploreSpaces")
            Live(:visible="liveIsVisible" :spaces="liveSpaces" :loading="isLoadingLiveSpaces")
          //- Favorites
          .button-wrap
            .segmented-buttons
              button(:class="{active: isFavoriteSpace}" @click.left.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace")
                img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
                img.icon(v-else src="@/assets/heart-empty.svg")
              button(@click.left="toggleFavoritesIsVisible" :class="{ active: favoritesIsVisible}")
                img.icon.down-arrow(src="@/assets/down-arrow.svg" :class="{ 'is-mobile-icon': isMobile }")
                span(v-if="favoriteSpacesEditedCount") {{favoriteSpacesEditedCount}}
            Favorites(:visible="favoritesIsVisible")
          //- Mobile Tips
          .button-wrap(v-if="isMobileOrTouch" :style="{zIndex: mobileTipsZIndex}")
            button(@click.left="toggleMobileTipsIsVisible" :class="{ active: mobileTipsIsVisible}")
              img.icon(src="@/assets/press-and-hold.svg")
              span Mobile Tips
            MobileTips(:visible="mobileTipsIsVisible")
          //- Toggle More Controls
          .button-wrap
            button.toggle-more-controls(@click.left.stop="toggleMoreFooterControlsIsVisible" :class="{active : moreFooterControlsIsVisible}")
              img.icon.down-arrow(src="@/assets/down-arrow.svg")

        section(v-if="moreFooterControlsIsVisible")
          //- Removed
          .button-wrap
            button.danger(@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
              img.refresh.icon(src="@/assets/remove.svg")
              span Removed
            Removed(:visible="removedIsVisible")
          //- Tags and Links
          .button-wrap
            .segmented-buttons
              button(@click.left="toggleTagsIsVisible" :class="{ active: tagsIsVisible}")
                span Tags
              button(@click.left="toggleLinksIsVisible" :class="{ active: linksIsVisible}")
                span Links
            Links(:visible="linksIsVisible")
            Tags(:visible="tagsIsVisible")

  .right(v-if="!isMobileOrTouch" :class="{'is-embed': isEmbed}")
    SpaceZoom
</template>

<script>
import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'
import Removed from '@/components/dialogs/Removed.vue'
import Links from '@/components/dialogs/Links.vue'
import Tags from '@/components/dialogs/Tags.vue'
import Favorites from '@/components/dialogs/Favorites.vue'
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
let fadeOutIteration, fadeOutTimer, hiddenIteration, hiddenTimer, updatePositionIteration, updatePositionTimer

export default {
  name: 'Footer',
  components: {
    Explore,
    Live,
    Removed,
    Notifications,
    Links,
    Tags,
    Favorites,
    MobileTips,
    Loader,
    SpaceZoom
  },
  data () {
    return {
      removedIsVisible: false,
      favoritesIsVisible: false,
      linksIsVisible: false,
      tagsIsVisible: false,
      exploreIsVisible: false,
      liveIsVisible: false,
      mobileTipsIsVisible: false,
      position: {},
      liveSpaces: [],
      isLoadingLiveSpaces: true,
      isFadeOut: false,
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
      } else if (mutation.type === 'unpinOtherDialogs') {
        this.$nextTick(() => {
          this.closeDialogs(mutation.payload)
        })
      } else if (mutation.type === 'triggerHideTouchInterface') {
        this.hidden()
      }
    })
    window.addEventListener('scroll', this.handleTouchInteractions)
    window.addEventListener('gesturestart', this.handleTouchInteractions)
    window.addEventListener('gesturechange', this.handleTouchInteractions)
    window.addEventListener('touchend', this.updatePosition)
    visualViewport.addEventListener('resize', this.updatePosition)
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
    window.removeEventListener('scroll', this.handleTouchInteractions)
    window.removeEventListener('gesturestart', this.handleTouchInteractions)
    window.removeEventListener('gesturechange', this.handleTouchInteractions)
    window.removeEventListener('touchend', this.updatePosition)
    visualViewport.removeEventListener('resize', this.updatePosition)
    window.removeEventListener('online', this.updateLiveSpaces)
    clearInterval(updateFavoritesIntervalTimer)
    clearInterval(updateLiveSpacesIntervalTimer)
  },
  computed: {
    moreFooterControlsIsVisible () { return this.$store.state.currentUser.shouldShowMoreFooterControls },
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
      // only hide footer on touch devices
      if (!isTouchDevice) {
        return true
      }
      if (shouldExplicitlyHideFooter) {
        return false
      }
      let isVisible = true
      if (this.dialogsVisible) { isVisible = false }
      if (this.shouldHideFooter) { isVisible = false }
      return isVisible
    },
    dialogsVisible () {
      return Boolean(this.$store.state.cardDetailsIsVisibleForCardId || this.$store.state.multipleSelectedActionsIsVisible || this.$store.state.connectionDetailsIsVisibleForConnectionId)
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
    linksDialogIsPinned () { return this.$store.state.linksDialogIsPinned },
    tagsDialogIsPinned () { return this.$store.state.tagsDialogIsPinned },
    dialogsArePinned () { return this.linksDialogIsPinned || this.tagsDialogIsPinned },
    mobileTipsZIndex () {
      if (this.mobileTipsIsVisible) {
        return 0
      } else if (this.dialogsArePinned) {
        return -1
      }
      return 0
    },
    unreadExploreSpaces () {
      let readDate = this.$store.state.currentUser.showInExploreUpdatedAt
      if (!readDate) { return this.exploreSpaces }
      readDate = dayjs(readDate)
      const unreadSpaces = this.exploreSpaces.filter(space => {
        const spaceDate = dayjs(space.showInExploreUpdatedAt)
        const delta = readDate.diff(spaceDate, 'second')
        return delta < 0
      })
      return unreadSpaces
    }
  },
  methods: {
    closeDialogs (exclude) {
      this.removedIsVisible = false
      this.favoritesIsVisible = false
      this.exploreIsVisible = false
      this.liveIsVisible = false
      this.mobileTipsIsVisible = false
      if (!this.tagsDialogIsPinned && exclude !== 'tags') {
        this.tagsIsVisible = false
      }
      if (!this.linksDialogIsPinned && exclude !== 'links') {
        this.linksIsVisible = false
      }
    },
    toggleMoreFooterControlsIsVisible () {
      this.closeDialogs()
      const isVisible = !this.$store.state.currentUser.shouldShowMoreFooterControls
      this.$store.dispatch('currentUser/shouldShowMoreFooterControls', isVisible)
    },
    toggleIsFavoriteSpace () {
      const currentSpace = this.$store.state.currentSpace
      if (this.isFavoriteSpace) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'space', item: currentSpace })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'space', item: currentSpace })
      }
    },
    toggleRemovedIsVisible () {
      const isVisible = this.removedIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleRemovedIsVisible')
      this.removedIsVisible = !isVisible
    },
    toggleFavoritesIsVisible () {
      const isVisible = this.favoritesIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleFavoritesIsVisible')
      this.favoritesIsVisible = !isVisible
    },
    toggleLinksIsVisible () {
      const isVisible = this.linksIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleLinksIsVisible')
      this.linksIsVisible = !isVisible
    },
    toggleTagsIsVisible () {
      const isVisible = this.tagsIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleTagsIsVisible')
      this.tagsIsVisible = !isVisible
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

    handleTouchInteractions (event) {
      if (!this.$store.getters.isTouchDevice) { return }
      if (utils.shouldIgnoreTouchInteraction(event)) { return }
      this.fadeOut()
      this.updatePosition()
    },
    fadeOut () {
      fadeOutIteration = 0
      if (fadeOutTimer) { return }
      fadeOutTimer = window.requestAnimationFrame(this.fadeOutFrame)
    },
    cancelFadeOut () {
      window.cancelAnimationFrame(fadeOutTimer)
      fadeOutTimer = undefined
      this.isFadeOut = false
      this.cancelUpdatePosition()
      this.updatePosition()
    },
    fadeOutFrame () {
      fadeOutIteration++
      this.isFadeOut = true
      if (fadeOutIteration < fadeOutDuration) {
        window.requestAnimationFrame(this.fadeOutFrame)
      } else {
        this.cancelFadeOut()
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
      const top = Math.round(viewport.height + viewport.offsetTop - layoutViewport.getBoundingClientRect().height)
      let style
      if (scale > 1) {
        style = {
          transform: `translate(${left}px, ${top}px) scale(${counterScale})`,
          'transform-origin': 'left bottom'
        }
      } else {
        style = {
          transform: `translate(${left}px, 0px)`,
          zoom: counterScale,
          'transform-origin': 'left bottom',
          'margin-left': `-${left}px`
        }
      }
      this.position = style
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
    @media(max-width 460px)
     display none
    &.is-embed
      position absolute
      right 0
  &.is-mobile
    margin-bottom 10px
  &.is-mobile-standalone
    margin-bottom 20px

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
