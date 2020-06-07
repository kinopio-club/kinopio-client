<template lang="pug">
footer(:style="visualViewportPosition")
  Notifications
  section(v-if="!dialogsVisible")
    .button-wrap
      button(@click="toggleExploreIsVisible" :class="{ active: exploreIsVisible}")
        span Explore
      Explore(:visible="exploreIsVisible")

    .button-wrap
      label(:class="{active: isFavoriteSpace}" @click.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace")
        input(type="checkbox" v-model="isFavoriteSpace")
        span Favorite

  section.controls(v-if="!dialogsVisible")
    .button-wrap
      button(@click="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
        img.refresh.icon(src="@/assets/remove.svg")
        span Removed
      Removed(:visible="removedIsVisible")

    .button-wrap
      button(@click="toggleFiltersIsVisible" :class="{ active: filtersIsVisible}")
        .span.badge.info(v-if="totalFilters") {{totalFilters}}
        img.icon.sunglasses(src="@/assets/filter.svg")
        span Filters
      Filters(:visible="filtersIsVisible")

    .button-wrap(v-if="isOffline")
      button(@click="toggleOfflineIsVisible" :class="{ active: offlineIsVisible}")
        span Offline
      Offline(:visible="offlineIsVisible")

</template>

<script>
import Explore from '@/components/dialogs/Explore.vue'
import Removed from '@/components/dialogs/Removed.vue'
import Offline from '@/components/dialogs/Offline.vue'
import Filters from '@/components/dialogs/Filters.vue'
import Notifications from '@/components/Notifications.vue'

const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'Footer',
  components: {
    Explore,
    Removed,
    Offline,
    Notifications,
    Filters
  },
  data () {
    return {
      removedIsVisible: false,
      offlineIsVisible: false,
      filtersIsVisible: false,
      exploreIsVisible: false,
      pinchZoomOffsetLeft: 0,
      pinchZoomScale: 1
    }
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.removedIsVisible = false
        this.offlineIsVisible = false
        this.filtersIsVisible = false
        this.exploreIsVisible = false
      }
      if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        currentIteration = 0
        if (updatePositionTimer) { return }
        updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
      }
    })
    window.addEventListener('scroll', this.updatePositionInVisualViewport)
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
    dialogsVisible () {
      return Boolean(this.$store.state.cardDetailsIsVisibleForCardId || this.$store.state.multipleSelectedActionsIsVisible || this.$store.state.connectionDetailsIsVisibleForConnectionId)
    },
    isOffline () {
      return !this.$store.state.isOnline
    },
    totalFilters () {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return types.length + frames.length
    },
    isFavoriteSpace () {
      const currentSpace = this.$store.state.currentSpace
      const favoriteSpaces = this.$store.state.currentUser.favoriteSpaces
      const isFavoriteSpace = favoriteSpaces.filter(space => space.id === currentSpace.id)
      return Boolean(isFavoriteSpace.length)
    },
    visualViewportPosition () {
      if (this.pinchZoomScale === 1) { return }
      const viewport = window.visualViewport
      const layoutViewport = document.getElementById('layout-viewport')
      const offsetTop = viewport.height - layoutViewport.getBoundingClientRect().height + viewport.offsetTop
      if (this.pinchZoomScale > 1) {
        return {
          transform: `translate(${this.pinchZoomOffsetLeft}px, ${offsetTop}px) scale(${1 / this.pinchZoomScale})`,
          'transform-origin': 'left bottom'
        }
      } else {
        return {
          transform: `translate(${this.pinchZoomOffsetLeft}px, ${offsetTop}px)`,
          zoom: 1 / this.pinchZoomScale,
          'transform-origin': 'left bottom'
        }
      }
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
      this.pinchZoomScale = window.visualViewport.scale
      this.pinchZoomOffsetLeft = window.visualViewport.offsetLeft
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
      this.$store.dispatch('closeAllDialogs')
      this.removedIsVisible = !isVisible
    },
    toggleOfflineIsVisible () {
      const isVisible = this.offlineIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.offlineIsVisible = !isVisible
    },
    toggleFiltersIsVisible () {
      const isVisible = this.filtersIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.filtersIsVisible = !isVisible
    },
    toggleExploreIsVisible () {
      const isVisible = this.exploreIsVisible
      this.$store.dispatch('closeAllDialogs')
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
  .user-details
    .space-picker
      bottom initial
      top calc(100% - 8px)
</style>
