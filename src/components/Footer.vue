<template lang="pug">
.footer-wrap(:style="visualViewportPosition")
  .left
    footer
      Notifications
      section(v-if="isVisible")
        //- Explore
        .button-wrap
          button(@click.left="toggleExploreIsVisible" :class="{ active: exploreIsVisible}")
            span Explore
          Explore(:visible="exploreIsVisible")
        //- Favorites
        .button-wrap
          .segmented-buttons
            label(:class="{active: isFavoriteSpace}" @click.left.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace")
              input(type="checkbox" v-model="isFavoriteSpace")
              img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
              img.icon(v-else src="@/assets/heart-empty.svg")
            button(@click.left="toggleFavoritesIsVisible" :class="{ active: favoritesIsVisible}")
              img.icon.down-arrow(src="@/assets/down-arrow.svg" :class="{ 'is-mobile-icon': isMobile }")
              span(v-if="favoriteSpacesEditedCount") {{favoriteSpacesEditedCount}}
          Favorites(:visible="favoritesIsVisible")
        //- Tags and Links
        .button-wrap
          .segmented-buttons
            button(@click.left="toggleTagsIsVisible" :class="{ active: tagsIsVisible}")
              span Tags
            button(@click.left="toggleLinksIsVisible" :class="{ active: linksIsVisible}")
              span Links
          Links(:visible="linksIsVisible")
          Tags(:visible="tagsIsVisible")

      section.controls(v-if="isVisible")
        //- Removed
        .button-wrap
          button(@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
            img.refresh.icon(src="@/assets/remove.svg")
            span Removed
          Removed(:visible="removedIsVisible")
        //- Filters
        .button-wrap
          button(@click.left="toggleFiltersIsVisible" :class="{ active: filtersIsVisible}")
            .span.badge.info(v-if="totalFiltersActive") {{totalFiltersActive}}
            img.icon.sunglasses(src="@/assets/filter.svg")
            span Filters
          Filters(:visible="filtersIsVisible")
        //- Background
        .button-wrap
          button(@click.left="toggleBackgroundIsVisible" :class="{ active: backgroundIsVisible}")
            img.icon.macro(src="@/assets/macro.svg")
          //- Upload Progress
          .uploading-container-footer(v-if="pendingUpload")
            .badge.info(:class="{absolute : pendingUpload.imageDataUrl}")
              Loader(:visible="true")
              span {{pendingUpload.percentComplete}}%
          //- Remote Upload Progress
          .uploading-container-footer(v-if="remotePendingUpload")
            .badge.info
              Loader(:visible="true")
              span {{remotePendingUpload.percentComplete}}%
          Background(:visible="backgroundIsVisible")

  .right(v-if="!isMobileOrTouch")
    SpaceZoom
</template>

<script>
import Explore from '@/components/dialogs/Explore.vue'
import Removed from '@/components/dialogs/Removed.vue'
import Filters from '@/components/dialogs/Filters.vue'
import Links from '@/components/dialogs/Links.vue'
import Tags from '@/components/dialogs/Tags.vue'
import Favorites from '@/components/dialogs/Favorites.vue'
import Background from '@/components/dialogs/Background.vue'
import Notifications from '@/components/Notifications.vue'
import SpaceZoom from '@/components/SpaceZoom.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'Footer',
  components: {
    Explore,
    Removed,
    Notifications,
    Filters,
    Links,
    Tags,
    Favorites,
    Background,
    Loader,
    SpaceZoom
  },
  data () {
    return {
      removedIsVisible: false,
      favoritesIsVisible: false,
      filtersIsVisible: false,
      linksIsVisible: false,
      tagsIsVisible: false,
      exploreIsVisible: false,
      backgroundIsVisible: false,
      visualViewportPosition: {}
    }
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.removedIsVisible = false
        this.favoritesIsVisible = false
        this.filtersIsVisible = false
        this.linksIsVisible = false
        this.tagsIsVisible = false
        this.exploreIsVisible = false
        this.backgroundIsVisible = false
      }
      if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        currentIteration = 0
        if (updatePositionTimer) { return }
        updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
      }
    })
    this.updatePositionInVisualViewport()
    window.addEventListener('scroll', this.updatePositionInVisualViewport)
    this.updateFavorites()
    setInterval(() => {
      this.updateFavorites()
    }, 1000 * 60 * 10) // 10 minutes
  },
  computed: {
    favoriteSpacesEditedCount () {
      const favoriteSpaces = this.$store.state.currentUser.favoriteSpaces
      return favoriteSpaces.filter(space => space.isEdited).length
    },
    pendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => {
        const isCurrentSpace = upload.spaceId === currentSpace.id
        const isInProgress = upload.percentComplete < 100
        return isCurrentSpace && isInProgress
      })
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
    totalFiltersActive () {
      const currentUser = this.$store.state.currentUser
      let userFilters = 0
      if (currentUser.filterShowUsers) {
        userFilters += 1
      }
      if (currentUser.filterShowDateUpdated) {
        userFilters += 1
      }
      if (currentUser.filterUnchecked) {
        userFilters += 1
      }
      const tagNames = this.$store.state.filteredTagNames
      const connections = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return userFilters + tagNames.length + connections.length + frames.length
    },
    isFavoriteSpace () { return this.$store.getters['currentSpace/isFavorite'] },
    remotePendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      let remotePendingUploads = this.$store.state.remotePendingUploads
      return remotePendingUploads.find(upload => {
        const inProgress = upload.percentComplete < 100
        const isSpace = upload.spaceId === currentSpace.id
        return inProgress && isSpace
      })
    },
    isMobile () {
      return utils.isMobile()
    },
    isMobileStandalone () {
      return utils.isMobile() && navigator.standalone // is homescreen app
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
    offsetMarginBottom () {
      const isMobile = utils.isMobile()
      let margin
      if (isMobile && navigator.standalone) {
        margin = 20
      } else if (isMobile) {
        margin = 10
      } else {
        margin = 0
      }
      return margin
    },
    updatePositionInVisualViewport () {
      const viewport = utils.visualViewport()
      const layoutViewport = document.getElementById('layout-viewport')
      const pinchZoomScale = viewport.scale
      const marginBottom = this.offsetMarginBottom()
      const pinchZoomOffsetLeft = viewport.offsetLeft
      const pinchZoomOffsetTop = viewport.height + viewport.offsetTop + marginBottom - layoutViewport.getBoundingClientRect().height - 20
      let style
      if (pinchZoomScale === 1) {
        style = {
          'margin-bottom': marginBottom
        }
      } else if (pinchZoomScale > 1) {
        style = {
          transform: `translate(${pinchZoomOffsetLeft}px, ${pinchZoomOffsetTop}px) scale(${1 / pinchZoomScale})`,
          'transform-origin': 'left bottom'
        }
      } else {
        style = {
          transform: `translate(${pinchZoomOffsetLeft}px, 0px)`,
          zoom: 1 / pinchZoomScale,
          'transform-origin': 'left bottom'
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
    toggleFiltersIsVisible () {
      const isVisible = this.filtersIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleFiltersIsVisible')
      this.filtersIsVisible = !isVisible
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
    toggleBackgroundIsVisible () {
      const isVisible = this.backgroundIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleBackgroundIsVisible')
      this.backgroundIsVisible = !isVisible
    },
    toggleExploreIsVisible () {
      const isVisible = this.exploreIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleExploreIsVisible')
      this.exploreIsVisible = !isVisible
    },
    async updateFavorites () {
      await this.$store.dispatch('currentUser/restoreUserFavorites')
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
  .macro
    vertical-align -3px
    height 13px

  .uploading-container-footer
    position absolute
    top -11px
    left 8px
    width 100px
    pointer-events none
    .badge
      display inline-block
      &.absolute
        position absolute
        top 6px
        left 6px

  .segmented-buttons
    .down-arrow
      padding 0

  </style>
