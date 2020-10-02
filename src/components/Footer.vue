<template lang="pug">
footer(:style="visualViewportPosition")
  Notifications
  section(v-if="isVisible")
    .button-wrap
      button(@click.left="toggleExploreIsVisible" :class="{ active: exploreIsVisible}")
        span Explore
      Explore(:visible="exploreIsVisible")

    //- Favorites
    .button-wrap
      .segmented-buttons
        label(:class="{active: isFavoriteSpace}" @click.left.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace")
          input(type="checkbox" v-model="isFavoriteSpace")
          img.icon(src="@/assets/heart.svg")
        button(@click.left="toggleFavoritesIsVisible" :class="{ active: favoritesIsVisible}")
          span Favorites
      Favorites(:visible="favoritesIsVisible")

  section.controls(v-if="isVisible")
    .button-wrap
      button(@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
        img.refresh.icon(src="@/assets/remove.svg")
        span Removed
      Removed(:visible="removedIsVisible")

    .button-wrap
      button(@click.left="toggleFiltersIsVisible" :class="{ active: filtersIsVisible}")
        .span.badge.info(v-if="totalFiltersActive") {{totalFiltersActive}}
        img.icon.sunglasses(src="@/assets/filter.svg")
        span Filters
      Filters(:visible="filtersIsVisible")

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
    .button-wrap(v-if="isOffline")
      button(@click.left="toggleOfflineIsVisible" :class="{ active: offlineIsVisible}")
        span Offline
      Offline(:visible="offlineIsVisible")

</template>

<script>
import Explore from '@/components/dialogs/Explore.vue'
import Removed from '@/components/dialogs/Removed.vue'
import Offline from '@/components/dialogs/Offline.vue'
import Filters from '@/components/dialogs/Filters.vue'
import Favorites from '@/components/dialogs/Favorites.vue'
import Background from '@/components/dialogs/Background.vue'
import Notifications from '@/components/Notifications.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'Footer',
  components: {
    Explore,
    Removed,
    Offline,
    Notifications,
    Filters,
    Favorites,
    Background,
    Loader
  },
  data () {
    return {
      removedIsVisible: false,
      favoritesIsVisible: false,
      offlineIsVisible: false,
      filtersIsVisible: false,
      exploreIsVisible: false,
      backgroundIsVisible: false,
      pinchZoomOffsetLeft: 0,
      pinchZoomOffsetTop: 0,
      pinchZoomScale: 1
    }
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.removedIsVisible = false
        this.favoritesIsVisible = false
        this.offlineIsVisible = false
        this.filtersIsVisible = false
        this.exploreIsVisible = false
        this.backgroundIsVisible = false
      }
      if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        currentIteration = 0
        if (updatePositionTimer) { return }
        updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
      }
    })
    window.addEventListener('scroll', this.updatePositionInVisualViewport)
    this.$store.dispatch('currentUser/restoreUserFavorites')
  },
  computed: {
    // buildHash () {
    //   const regex = /(app\.)([a-z0-9])\w+/
    //   const scripts = Array.from(document.querySelectorAll('script'))
    //   const path = scripts.find(script => {
    //     const src = script.src
    //     return src.includes('app')
    //   })
    //   if (!path) { return }
    //   let hash = path.src.match(regex)[0] // app.768db305407f4c847d44
    //   return hash.replace('app.', '') // 768db305407f4c847d44
    // },
    pendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => {
        const isCurrentSpace = upload.spaceId === currentSpace.id
        const isInProgress = upload.percentComplete < 100
        return isCurrentSpace && isInProgress
      })
    },
    isVisible () {
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
    isOffline () {
      return !this.$store.state.isOnline
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
      const tagNames = this.$store.state.filteredTagNames
      const connections = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return userFilters + tagNames.length + connections.length + frames.length
    },
    isFavoriteSpace () {
      const currentSpace = this.$store.state.currentSpace
      const favoriteSpaces = this.$store.state.currentUser.favoriteSpaces
      const isFavoriteSpace = favoriteSpaces.filter(space => space.id === currentSpace.id)
      return Boolean(isFavoriteSpace.length)
    },
    visualViewportPosition () {
      if (this.pinchZoomScale === 1) { return }
      if (this.pinchZoomScale > 1) {
        return {
          transform: `translate(${this.pinchZoomOffsetLeft}px, ${this.pinchZoomOffsetTop}px) scale(${1 / this.pinchZoomScale})`,
          'transform-origin': 'left bottom'
        }
      } else {
        return {
          transform: `translate(${this.pinchZoomOffsetLeft}px, ${this.pinchZoomOffsetTop}px)`,
          zoom: 1 / this.pinchZoomScale,
          'transform-origin': 'left bottom'
        }
      }
    },
    remotePendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      let remotePendingUploads = this.$store.state.remotePendingUploads
      return remotePendingUploads.find(upload => {
        const inProgress = upload.percentComplete < 100
        const isSpace = upload.spaceId === currentSpace.id
        return inProgress && isSpace
      })
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
    updatePositionInVisualViewport () {
      const viewport = utils.visualViewport()
      const layoutViewport = document.getElementById('layout-viewport')
      this.pinchZoomScale = viewport.scale
      this.pinchZoomOffsetLeft = viewport.offsetLeft
      this.pinchZoomOffsetTop = viewport.height - layoutViewport.getBoundingClientRect().height + viewport.offsetTop
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
    toggleOfflineIsVisible () {
      const isVisible = this.offlineIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleOfflineIsVisible')
      this.offlineIsVisible = !isVisible
    },
    toggleFiltersIsVisible () {
      const isVisible = this.filtersIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleFiltersIsVisible')
      this.filtersIsVisible = !isVisible
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
    }
  }
}
</script>

<style lang="stylus">
footer
  z-index var(--max-z)
  position fixed
  left 8px
  bottom 8px
  pointer-events none
  max-width calc(100% - 17px)
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
