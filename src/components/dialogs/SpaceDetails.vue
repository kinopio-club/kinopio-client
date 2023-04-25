<template lang="pug">
dialog.narrow.space-details.is-pinnable(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog" :style="style" :data-is-pinned="spaceDetailsIsPinned" :class="{'is-pinned': spaceDetailsIsPinned}")
  section
    SpaceDetailsInfo(@updateLocalSpaces="updateLocalSpaces" @closeDialogs="closeDialogs" @updateDialogHeight="updateHeights" :currentSpaceIsHidden="currentSpaceIsHidden" @addSpace="addSpace")
  section.results-actions
    .row
      //- Add Space
      .button-wrap
        button.success(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: addSpaceIsVisible }")
          img.icon.add(src="@/assets/add.svg")
          span New
          Loader(:visible="isLoadingSpace")
        AddSpace(:visible="addSpaceIsVisible" @closeDialogs="closeDialogs" @addSpace="addSpace" @addJournalSpace="addJournalSpace")
      //- Filters
      .button-wrap
        // no filters
        template(v-if="!spaceFiltersIsActive")
          button(@click.left.stop="toggleSpaceFiltersIsVisible" :class="{ active: spaceFiltersIsActive }")
            img.icon(src="@/assets/filter.svg")
        // filters active
        template(v-if="spaceFiltersIsActive")
          .segmented-buttons
            button(@click.left.stop="toggleSpaceFiltersIsVisible" :class="{ active: spaceFiltersIsVisible || spaceFiltersIsActive }")
              img.icon(src="@/assets/filter.svg")
              .badge.info.filter-is-active
            button(@click.left.stop="clearAllFilters")
              img.icon.cancel(src="@/assets/add.svg")
        SpaceFilters(:visible="spaceFiltersIsVisible" :spaces="filteredSpaces")

  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="filteredSpaces" :isLoading="isLoadingRemoteSpaces" :showUserIfCurrentUserIsCollaborator="true" :parentIsSpaceDetails="true" :showCreateNewSpaceFromSearch="true" @selectSpace="changeSpace" @addSpace="addSpace" :resultsSectionHeight="resultsSectionHeight")
</template>

<script>
import cache from '@/cache.js'
import SpaceDetailsInfo from '@/components/SpaceDetailsInfo.vue'
import AddSpace from '@/components/dialogs/AddSpace.vue'
import SpaceFilters from '@/components/dialogs/SpaceFilters.vue'
import SpaceList from '@/components/SpaceList.vue'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

import debounce from 'lodash-es/debounce'
import dayjs from 'dayjs'
import { mapState, mapGetters } from 'vuex'

let shouldUpdateFavorites = true
const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'SpaceDetails',
  components: {
    SpaceDetailsInfo,
    AddSpace,
    SpaceFilters,
    SpaceList,
    Loader
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerFocusSpaceDetailsName') {
        this.$nextTick(() => {
          this.$nextTick(() => {
            const element = this.$refs.name
            if (!element) { return }
            element.focus()
            element.setSelectionRange(0, element.value.length)
          })
        })
      } else if (mutation.type === 'triggerSpaceDetailsUpdateLocalSpaces') {
        this.updateLocalSpaces()
      } else if (mutation.type === 'updatePageSizes') {
        this.updateHeights()
      } else if (mutation.type === 'currentUser/favoriteSpaces') {
        if (!this.visible) { return }
        this.updateLocalSpaces()
      } else if (mutation.type === 'isLoadingSpace') {
        const isLoading = mutation.payload
        if (!this.visible) { return }
        if (isLoading) { return }
        this.updateLocalSpaces()
      }
    })
  },
  data () {
    return {
      spaces: [],
      favoriteSpaces: [],
      favoriteUsers: [],
      addSpaceIsVisible: false,
      isLoadingRemoteSpaces: false,
      remoteSpaces: [],
      resultsSectionHeight: null,
      dialogHeight: null,
      journalSpaces: [],
      normalSpaces: [],
      spaceFiltersIsVisible: false
    }
  },
  computed: {
    ...mapState([
      'currentSpace',
      'currentUser',
      'spaceDetailsIsPinned',
      'isLoadingSpace'
    ]),
    ...mapGetters([
      'currentUser/isSignedIn',
      'currentUser/isSpaceCollaborator',
      'currentUser/isSpaceMember',
      'cachedOrOtherSpaceById',
      'currentUser/canEditSpace'
    ]),
    currentSpaceIsHidden () { return this.currentSpace.isHidden },
    style () { return { maxHeight: this.dialogHeight + 'px' } },
    spaceName () { return this.currentSpace.name },
    spaceFilterShowHiddenIsActive () { return this.currentUser.dialogSpaceFilterShowHidden },
    dialogSpaceFilters () { return this.currentUser.dialogSpaceFilters },
    dialogSpaceFilterByUser () { return this.currentUser.dialogSpaceFilterByUser },
    spaceFiltersIsActive () {
      return Boolean(this.spaceFilterShowHiddenIsActive || this.dialogSpaceFilters || utils.objectHasKeys(this.dialogSpaceFilterByUser))
    },
    filteredSpaces () {
      let spaces
      // filter by space type
      if (this.dialogSpaceFilters === 'journals') {
        this.updateJournalSpaces()
        spaces = this.journalSpaces
      } else if (this.dialogSpaceFilters === 'spaces') {
        this.updateNormalSpaces()
        spaces = this.normalSpaces
      } else {
        spaces = this.spaces
      }
      // filter by hidden spaces
      if (this.spaceFilterShowHiddenIsActive) {
        spaces = spaces.filter(space => space.isHidden)
      } else {
        spaces = spaces.filter(space => !space.isHidden)
      }
      // filter by user
      if (utils.objectHasKeys(this.dialogSpaceFilterByUser)) {
        spaces = spaces.filter(space => space.userId === this.dialogSpaceFilterByUser.id)
      }
      return spaces
    },
    currentUserIsSignedIn () { return this['currentUser/isSignedIn'] },
    shouldShowInExplore () {
      const privacy = this.currentSpace.privacy
      if (privacy === 'private') { return false }
      return this.currentSpace.showInExplore
    },
    isSpaceMember () {
      return this['currentUser/isSpaceMember'](this.currentSpace)
    },
    removeLabel () {
      const currentUserIsSpaceCollaborator = this['currentUser/isSpaceCollaborator']()
      if (currentUserIsSpaceCollaborator) {
        return 'Leave'
      } else {
        return 'Remove'
      }
    }
  },
  methods: {
    clearAllFilters () {
      this.closeDialogs()
      this.$store.commit('triggerClearAllSpaceFilters')
    },
    toggleSpaceFiltersIsVisible () {
      const isVisible = this.spaceFiltersIsVisible
      this.closeDialogs()
      this.spaceFiltersIsVisible = !isVisible
    },
    addSpace () {
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addSpace')
      this.updateLocalSpaces()
      this.$store.commit('triggerFocusSpaceDetailsName')
    },
    addJournalSpace () {
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/loadJournalSpace') // triggers updateLocalSpaces in addJournalSpace
      this.$store.commit('triggerFocusSpaceDetailsName')
    },
    toggleAddSpaceIsVisible () {
      const isVisible = this.addSpaceIsVisible
      this.closeDialogs()
      this.addSpaceIsVisible = !isVisible
    },
    closeDialogs () {
      this.addSpaceIsVisible = false
      this.spaceFiltersIsVisible = false
      this.$store.commit('triggerSpaceDetailsCloseDialogs')
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space })
      this.$store.dispatch('closeAllDialogs')
      this.closeDialogs()
    },
    orderByFavoriteSpaces (spaces) {
      let favoriteSpaces = []
      spaces = spaces.filter(space => {
        if (space.isFavorite) {
          favoriteSpaces.push(space)
        } else {
          return space
        }
      })
      return favoriteSpaces.concat(spaces)
    },
    updateFavoriteSpaces (spaces) {
      const userFavoriteSpaces = this.currentUser.favoriteSpaces
      const favoriteSpaceIds = userFavoriteSpaces.map(space => space.id)
      spaces = spaces.map(space => {
        if (favoriteSpaceIds.includes(space.id)) {
          space.isFavorite = true
        }
        return space
      })
      spaces = this.orderByFavoriteSpaces(spaces)
      return spaces
    },
    updateInboxSpace (spaces) {
      const inboxSpaces = spaces.filter(space => space.name === 'Inbox')
      if (!inboxSpaces.length) { return spaces }
      spaces = spaces.filter(space => space.name !== 'Inbox')
      spaces = inboxSpaces.concat(spaces)
      return spaces
    },
    updateLocalSpaces () {
      this.debouncedUpdateLocalSpaces()
    },
    debouncedUpdateLocalSpaces: debounce(async function () {
      this.$nextTick(() => {
        let userSpaces = cache.getAllSpaces().filter(space => {
          return this['currentUser/canEditSpace'](space)
        })
        userSpaces = this.updateWithExistingRemoteSpaces(userSpaces)
        userSpaces = this.sortSpacesByEditedOrCreatedAt(userSpaces)
        userSpaces = this.updateFavoriteSpaces(userSpaces)
        userSpaces = this.updateInboxSpace(userSpaces)
        this.spaces = utils.AddCurrentUserIsCollaboratorToSpaces(userSpaces, this.currentUser)
      })
    }, 350, { leading: true }),
    removeRemovedCachedSpaces (remoteSpaces) {
      const remoteSpaceIds = remoteSpaces.map(space => space.id)
      const spacesToRemove = this.spaces.filter(space => !remoteSpaceIds.includes(space.id))
      spacesToRemove.forEach(spaceToRemove => {
        cache.deleteSpace(spaceToRemove)
      })
    },
    updateWithExistingRemoteSpaces (userSpaces) {
      if (!utils.arrayExists(this.remoteSpaces)) { return userSpaces }
      let spaces = userSpaces
      this.remoteSpaces.forEach(space => {
        const spaceExists = userSpaces.find(userSpace => userSpace.id === space.id)
        if (!spaceExists) {
          spaces.push(space)
        }
      })
      this.updateCachedSpaces()
      return spaces
    },
    sortSpacesByEditedOrCreatedAt (spaces) {
      spaces = spaces.map(space => {
        space.editedAt = space.editedAt || space.createdAt
        return space
      })
      const sortedSpaces = spaces.sort((a, b) => {
        const bEditedAt = dayjs(b.editedAt).unix()
        const aEditedAt = dayjs(a.editedAt).unix()
        return bEditedAt - aEditedAt
      })
      return sortedSpaces
    },
    async updateWithRemoteSpaces () {
      this.isLoadingRemoteSpaces = true
      this.remoteSpaces = await this.$store.dispatch('api/getUserSpaces')
      this.isLoadingRemoteSpaces = false
      if (!this.remoteSpaces) { return }
      this.removeRemovedCachedSpaces(this.remoteSpaces)
      this.sortSpacesByEditedOrCreatedAt(this.remoteSpaces)
      let spaces = this.updateFavoriteSpaces(this.remoteSpaces)
      spaces = this.updateInboxSpace(spaces)
      this.spaces = spaces
      this.updateCachedSpaces()
    },
    updateJournalSpaces () {
      const journalSpaces = this.spaces.filter(space => space.moonPhase)
      this.journalSpaces = journalSpaces
    },
    updateNormalSpaces () {
      let normalSpaces = this.spaces.filter(space => !space.moonPhase)
      this.normalSpaces = normalSpaces
    },
    updateCachedSpaces () {
      this.spaces.forEach(space => {
        const cachedSpace = cache.space(space.id)
        const isCachedSpace = utils.objectHasKeys(cachedSpace)
        if (!isCachedSpace) {
          this.storeLocal(`space-${space.id}`, space)
        }
      })
    },
    async updateFavorites () {
      if (!shouldUpdateFavorites) { return }
      shouldUpdateFavorites = false
      await this.$store.dispatch('currentUser/restoreUserFavorites')
    },
    updateHeights () {
      if (!this.visible) {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
        return
      }
      currentIteration = 0
      if (updatePositionTimer) { return }
      updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
    },
    updatePositionFrame () {
      currentIteration++
      this.updateDialogHeight()
      this.updateResultsSectionHeight()
      if (currentIteration < maxIterations) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
      }
    },
    updateDialogHeight () {
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    updateResultsSectionHeight () {
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element) - 2
      })
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      if (visible) {
        this.updateLocalSpaces()
        this.updateWithRemoteSpaces()
        this.closeDialogs()
        this.updateFavorites()
        this.updateHeights()
      }
    }
  }
}
</script>

<style lang="stylus">
dialog.space-details
  width 234px !important
  button.disabled
    opacity 0.5
    pointer-events none
  .filter-is-active
    margin 0
    margin-left 5px
    padding-top 0
    padding-bottom 0
  &.is-pinned
    left -65px
    top -13px
</style>
