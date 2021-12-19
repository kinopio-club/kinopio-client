<template lang="pug">
.footer-wrap(:style="visualViewportPosition")
  .left(v-if="!isEmbed")
    footer
      Notifications
      section(v-if="isVisible")
        //- Explore
        .button-wrap
          .segmented-buttons
            button(@click.left="toggleExploreIsVisible" :class="{ active: exploreIsVisible}")
              img.icon.sunglasses(src="@/assets/sunglasses.svg")
              span Explore
            button(@click.left="toggleLiveIsVisible" :class="{ active: liveIsVisible}")
              img.icon.camera(src="@/assets/camera.svg")
              span(v-if="liveSpaces.length") {{ liveSpaces.length }}
          Explore(:visible="exploreIsVisible")
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

      section.controls(v-if="isVisible")
        //- Removed
        .button-wrap
          button(@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
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

        //- Mobile Tips
        .button-wrap(v-if="isMobileOrTouch" :style="{zIndex: mobileTipsZIndex}")
          button(@click.left="toggleMobileTipsIsVisible" :class="{ active: mobileTipsIsVisible}")
            img.icon(src="@/assets/press-and-hold.svg")
            span Mobile Tips
          MobileTips(:visible="mobileTipsIsVisible")

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

const maxIterations = 30
let currentIteration, updatePositionTimer
let updateFavoritesIntervalTimer, updateLiveSpacesIntervalTimer

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
      visualViewportPosition: {},
      liveSpaces: [],
      isLoadingLiveSpaces: true
    }
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      const linksIsPinnedDialog = this.$store.state.linksIsPinnedDialog
      const tagsIsPinnedDialog = this.$store.state.tagsIsPinnedDialog
      if (mutation.type === 'closeAllDialogs') {
        this.removedIsVisible = false
        this.favoritesIsVisible = false
        this.exploreIsVisible = false
        this.liveIsVisible = false
        this.mobileTipsIsVisible = false
        if (!linksIsPinnedDialog) {
          this.linksIsVisible = false
        }
        if (!tagsIsPinnedDialog) {
          this.tagsIsVisible = false
        }
      }
      if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        currentIteration = 0
        if (updatePositionTimer) { return }
        updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
      }
    })
    this.updatePositionInVisualViewport()
    window.addEventListener('scroll', this.updatePositionInVisualViewport)
    window.addEventListener('online', this.updateLiveSpaces)
    this.updateFavorites()
    this.updateLiveSpaces()
    updateFavoritesIntervalTimer = setInterval(() => {
      this.updateFavorites()
    }, 1000 * 60 * 10) // 10 minutes
    updateLiveSpacesIntervalTimer = setInterval(() => {
      this.updateLiveSpaces()
    }, 1000 * 60 * 5) // 5 minutes
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updatePositionInVisualViewport)
    window.removeEventListener('online', this.updateLiveSpaces)
    clearInterval(updateFavoritesIntervalTimer)
    clearInterval(updateLiveSpacesIntervalTimer)
  },
  computed: {
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
      const isTouchDevice = this.$store.state.isTouchDevice
      const isMobile = utils.isMobile()
      return isTouchDevice || isMobile
    },
    isVisible () {
      const isTouchDevice = this.$store.state.isTouchDevice
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
    dialogsArePinned () {
      const linksIsPinnedDialog = this.$store.state.linksIsPinnedDialog
      const tagsIsPinnedDialog = this.$store.state.tagsIsPinnedDialog
      return linksIsPinnedDialog || tagsIsPinnedDialog
    },
    mobileTipsZIndex () {
      if (this.mobileTipsIsVisible) {
        return 0
      } else if (this.dialogsArePinned) {
        return -1
      }
      return 0
    }
  },
  methods: {
    updatePositionFrame () {
      currentIteration++
      this.updatePositionInVisualViewport()
      if (currentIteration < maxIterations) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
      }
    },
    footerMarginBottom () {
      if (this.isMobileOrTouch) {
        return 20
      } else {
        return 0
      }
    },
    updatePositionInVisualViewport () {
      const viewport = utils.visualViewport()
      const layoutViewport = document.getElementById('layout-viewport')
      const pinchZoomScale = viewport.scale
      const marginBottom = this.footerMarginBottom()
      const pinchZoomOffsetLeft = viewport.offsetLeft
      const pinchZoomOffsetTop = viewport.height + viewport.offsetTop - layoutViewport.getBoundingClientRect().height
      let style
      if (pinchZoomScale === 1) {
        style = {
          'margin-bottom': marginBottom + 'px'
        }
      } else if (pinchZoomScale > 1) {
        style = {
          transform: `translate(${pinchZoomOffsetLeft}px, ${pinchZoomOffsetTop}px) scale(${1 / pinchZoomScale})`,
          'transform-origin': 'left bottom',
          'margin-bottom': marginBottom / pinchZoomScale + 'px'
        }
      } else {
        style = {
          transform: `translate(${pinchZoomOffsetLeft}px, 0px)`,
          zoom: 1 / pinchZoomScale,
          'transform-origin': 'left bottom',
          'margin-bottom': marginBottom + 'px',
          'margin-left': `-${pinchZoomOffsetLeft}px`
        }
      }
      this.visualViewportPosition = style
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
    margin-top 6px
  > section
    display flex
    > .button-wrap
      pointer-events all
      margin-left 6px
      display inline-block
      dialog
        top initial
        bottom calc(100% - 8px)
      &:first-child
        margin-left 0

  .sunglasses
    vertical-align middle

  .segmented-buttons
    .down-arrow
      padding 0
  </style>
