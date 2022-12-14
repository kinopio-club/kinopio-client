<template lang="pug">
.footer-wrap(v-if="!isAddPage")
  .left(v-if="!isEmbed" :class="{'fade-out': isFadingOut}")
    footer
      Notifications
      .controls(v-if="isVisible" :class="{'hidden': isHidden}")
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

  .right(:class="{'is-embed': isEmbed, 'hidden': isHidden}")
    button(v-if="isNotSupportedByDevice" @pointerup="toggleMinimapIsVislble" :class="{ active: minimapIsVisible }")
      img.icon.minimap(src="@/assets/minimap.svg")
    SpaceZoom
</template>

<script>
import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'
import Favorites from '@/components/dialogs/Favorites.vue'
import FavoritesActions from '@/components/dialogs/FavoritesActions.vue'
import AddToInbox from '@/components/dialogs/AddToInbox.vue'
import Notifications from '@/components/Notifications.vue'
import SpaceZoom from '@/components/SpaceZoom.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'
import dayjs from 'dayjs'

let updateFavoritesIntervalTimer, updateLiveSpacesIntervalTimer

const fadeOutDuration = 10
const hiddenDuration = 20
let fadeOutIteration, fadeOutTimer, hiddenIteration, hiddenTimer, shouldCancelFadeOut

export default {
  name: 'Footer',
  components: {
    Explore,
    Live,
    Notifications,
    Favorites,
    FavoritesActions,
    Loader,
    SpaceZoom,
    AddToInbox
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.closeDialogs()
      } else if (mutation.type === 'triggerHideTouchInterface') {
        this.hidden()
      } else if (mutation.type === 'triggerAddToInboxIsVisible') {
        this.addToInboxIsVisible = true
      } else if (mutation.type === 'triggerCheckIfUseHasInboxSpace') {
        this.updateUserHasInbox()
      }
    })
    window.addEventListener('online', this.updateLiveSpaces)
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
    window.removeEventListener('online', this.updateLiveSpaces)
    clearInterval(updateFavoritesIntervalTimer)
    clearInterval(updateLiveSpacesIntervalTimer)
  },
  data () {
    return {
      favoritesActionsIsVisible: false,
      favoritesIsVisible: false,
      exploreIsVisible: false,
      liveIsVisible: false,
      liveSpaces: [],
      isLoadingLiveSpaces: true,
      isFadingOut: false,
      isHidden: false,
      exploreSpaces: [],
      addToInboxIsVisible: false,
      userHasInbox: false
    }
  },
  computed: {
    ...mapState([
      'isTouchScrollingOrPinchZooming',
      'minimapIsVisible',
      'isAddPage',
      'isEmbed',
      'currentUser',
      'shouldExplicitlyHideFooter',
      'cardDetailsIsVisibleForCardId',
      'multipleSelectedActionsIsVisible',
      'connectionDetailsIsVisibleForConnectionId',
      'shouldHideFooter'
    ]),
    ...mapGetters([
      'currentSpace/isFavorite',
      'isTouchDevice',
      'currentUser/isSignedIn'
    ]),
    isNotSupportedByDevice () { return !utils.isAndroid() },
    favoriteSpacesEditedCount () {
      let favoriteSpaces = utils.clone(this.currentUser.favoriteSpaces)
      favoriteSpaces = favoriteSpaces.filter(space => {
        const isEditedByOtherUser = space.editedByUserId !== this.currentUser.id
        const isEditedAndNotVisited = space.isEdited && space.userId !== this.currentUser.id
        return isEditedByOtherUser && isEditedAndNotVisited
      })
      return favoriteSpaces.length
    },
    isVisible () {
      const contentDialogIsVisible = Boolean(this.cardDetailsIsVisibleForCardId || this.multipleSelectedActionsIsVisible || this.connectionDetailsIsVisibleForConnectionId)
      // only hide footer on touch devices
      if (!this.isTouchDevice) { return true }
      if (this.shouldExplicitlyHideFooter) { return }
      let isVisible = true
      if (contentDialogIsVisible) { isVisible = false }
      if (this.shouldHideFooter) { isVisible = false }
      return isVisible
    },
    isFavoriteSpace () { return this['currentSpace/isFavorite'] },
    isMobile () {
      return utils.isMobile()
    },
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
    }
  },
  methods: {
    toggleMinimapIsVislble (event) {
      this.closeDialogs()
      const value = !this.minimapIsVisible
      this.$store.commit('minimapIsVisible', value)
    },
    closeDialogs (exclude) {
      this.favoritesActionsIsVisible = false
      this.favoritesIsVisible = false
      this.exploreIsVisible = false
      this.liveIsVisible = false
      this.addToInboxIsVisible = false
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
    toggleAddToInboxIsVisible () {
      const isVisible = this.addToInboxIsVisible
      this.$store.dispatch('closeAllDialogs', 'Footer.toggleAddToInboxIsVisible')
      this.addToInboxIsVisible = !isVisible
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
    },
    fadeOutFrame () {
      fadeOutIteration++
      this.isFadingOut = true
      if (shouldCancelFadeOut) {
        this.cancelFadeOut()
      } else if (fadeOutIteration < fadeOutDuration) {
        window.requestAnimationFrame(this.fadeOutFrame)
      }
    }
  },
  watch: {
    isTouchScrollingOrPinchZooming (value) {
      if (value) {
        this.fadeOut()
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
  .inbox-icon
    vertical-align 0px
    width 13px
    margin-left 6px

  </style>
