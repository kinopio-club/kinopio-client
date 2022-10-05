<template lang="pug">
dialog.narrow.space-details.is-pinnable(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog" :style="style" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  section
    SpaceDetailsInfo(@updateSpaces="updateLocalSpaces" @closeDialogs="closeDialogs")
    .button-wrap(v-if="isSpaceMember")
      .segmented-buttons
        //- Remove
        button(@click.left="removeCurrentSpace" :class="{ disabled: currentSpaceIsTemplate }")
          img.icon(src="@/assets/remove.svg")
          span {{removeLabel}}
        // Hide Space
        button(@click.stop="toggleHideSpace" :class="{ active: currentSpaceIsHidden }")
          img.icon(v-if="!currentSpaceIsHidden" src="@/assets/view.svg")
          img.icon(v-if="currentSpaceIsHidden" src="@/assets/view-hidden.svg")
          span Hide
    //-  Duplicate
    .button-wrap(v-if="!isSpaceMember")
      button(@click.left="duplicateSpace")
        img.icon(src="@/assets/add.svg")
        span Duplicate

  section.results-actions
    .row
      //- Add Space
      .button-wrap
        button.success(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: addSpaceIsVisible }")
          img.icon(src="@/assets/add.svg")
          span New
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
    SpaceList(:spaces="filteredSpaces" :isLoading="isLoadingRemoteSpaces" :showUserIfCurrentUserIsCollaborator="true" :parentIsSpaceDetails="true" :showCreateNewSpaceFromSearch="true" @selectSpace="changeSpace" @addSpace="addSpace")
</template>

<script>
import cache from '@/cache.js'
import SpaceDetailsInfo from '@/components/SpaceDetailsInfo.vue'
import AddSpace from '@/components/dialogs/AddSpace.vue'
import SpaceFilters from '@/components/dialogs/SpaceFilters.vue'
import SpaceList from '@/components/SpaceList.vue'
import templates from '@/data/templates.js'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'
import dayjs from 'dayjs'

let shouldUpdateFavorites = true
const maxIterations = 30
let currentIteration, updatePositionTimer
const offsetfooterHeight = 50

export default {
  name: 'SpaceDetails',
  components: {
    SpaceDetailsInfo,
    AddSpace,
    SpaceFilters,
    SpaceList
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
      nonJournalSpaces: [],
      spaceFiltersIsVisible: false
    }
  },
  computed: {
    currentSpaceIsHidden () { return this.$store.state.currentSpace.isHidden },
    style () { return { maxHeight: this.dialogHeight + 'px' } },
    spaceName () { return this.$store.state.currentSpace.name },
    spaceFilterShowHiddenIsActive () { return this.$store.state.currentUser.dialogSpaceFilterShowHidden },
    dialogSpaceFilters () { return this.$store.state.currentUser.dialogSpaceFilters },
    dialogSpaceFilterByUser () { return this.$store.state.currentUser.dialogSpaceFilterByUser },
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
        this.updateNonJournalSpaces()
        spaces = this.nonJournalSpaces
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
    currentSpace () { return this.$store.state.currentSpace },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    shouldShowInExplore () {
      const privacy = this.$store.state.currentSpace.privacy
      if (privacy === 'private') { return false }
      return this.$store.state.currentSpace.showInExplore
    },
    isSpaceMember () {
      const currentSpace = this.$store.state.currentSpace
      return this.$store.getters['currentUser/isSpaceMember'](currentSpace)
    },
    removeLabel () {
      const currentUserIsSpaceCollaborator = this.$store.getters['currentUser/isSpaceCollaborator']()
      if (currentUserIsSpaceCollaborator) {
        return 'Leave'
      } else {
        return 'Remove'
      }
    },
    currentSpaceIsTemplate () {
      const id = this.$store.state.currentSpace.id
      const templateSpaceIds = templates.spaces().map(space => space.id)
      return templateSpaceIds.includes(id)
    },
    dialogIsPinned () { return this.$store.state.spaceDetailsIsPinned }
  },
  methods: {
    clearAllFilters () {
      this.closeDialogs()
      this.$store.commit('triggerClearAllSpaceFilters')
    },
    toggleHideSpace () {
      const value = !this.currentSpaceIsHidden
      this.$store.dispatch('currentSpace/updateSpace', { isHidden: value })
      this.updateLocalSpaces()
      this.$store.commit('notifySpaceIsHidden', value)
    },
    toggleSpaceFiltersIsVisible () {
      const isVisible = this.spaceFiltersIsVisible
      this.closeDialogs()
      this.spaceFiltersIsVisible = !isVisible
    },
    addSpace () {
      this.$store.dispatch('currentSpace/addSpace')
      this.updateLocalSpaces()
      this.$store.commit('triggerFocusSpaceDetailsName')
    },
    addJournalSpace () {
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
      this.$store.dispatch('closeAllDialogs', 'spaceDetails.changeSpace')
      this.closeDialogs()
    },
    changeToLastSpace () {
      const currentSpace = this.$store.state.currentSpace
      const spaces = this.spaces.filter(space => space.id !== currentSpace.id)
      if (spaces.length) {
        const cachedSpace = this.$store.getters.cachedOrOtherSpaceById(this.$store.state.currentUser.prevLastSpaceId)
        this.$store.dispatch('currentSpace/changeSpace', { space: cachedSpace || spaces[0] })
      } else {
        this.addSpace()
      }
    },
    removeCurrentSpace () {
      const currentUser = this.$store.state.currentUser
      const currentSpaceId = this.$store.state.currentSpace.id
      const currentUserIsSpaceCollaborator = this.$store.getters['currentUser/isSpaceCollaborator']()
      if (currentUserIsSpaceCollaborator) {
        this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', currentUser)
      } else {
        this.$store.dispatch('currentSpace/removeCurrentSpace')
        this.$store.commit('notifyCurrentSpaceIsNowRemoved', true)
      }
      if (utils.arrayExists(this.remoteSpaces)) {
        this.remoteSpaces = this.remoteSpaces.filter(space => space.id !== currentSpaceId)
      }
      this.updateLocalSpaces()
      this.changeToLastSpace()
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
      const userFavoriteSpaces = this.$store.state.currentUser.favoriteSpaces
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
        const currentUser = this.$store.state.currentUser
        let userSpaces = cache.getAllSpaces().filter(space => {
          return this.$store.getters['currentUser/canEditSpace'](space)
        })
        userSpaces = this.updateWithExistingRemoteSpaces(userSpaces)
        userSpaces = this.sortSpacesByEditedAt(userSpaces)
        userSpaces = this.updateFavoriteSpaces(userSpaces)
        userSpaces = this.updateInboxSpace(userSpaces)
        this.spaces = utils.AddCurrentUserIsCollaboratorToSpaces(userSpaces, currentUser)
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
      return spaces
    },
    sortSpacesByEditedAt (spaces) {
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
      this.sortSpacesByEditedAt(this.remoteSpaces)
      let spaces = this.updateFavoriteSpaces(this.remoteSpaces)
      spaces = this.updateInboxSpace(spaces)
      this.spaces = spaces
      this.updateCachedSpacesDate()
    },
    updateJournalSpaces () {
      const journalSpaces = this.spaces.filter(space => space.moonPhase)
      this.journalSpaces = journalSpaces
    },
    updateNonJournalSpaces () {
      const nonJournalSpaces = this.spaces.filter(space => !space.moonPhase)
      this.nonJournalSpaces = nonJournalSpaces
    },
    updateCachedSpacesDate () {
      this.spaces.forEach(space => {
        const cachedSpace = cache.space(space.id)
        const isCachedSpace = utils.objectHasKeys(cachedSpace)
        const shouldUpdate = space.editedAt !== cachedSpace.editedAt
        if (isCachedSpace && shouldUpdate) {
          cache.updateSpace('editedAt', space.editedAt, space.id)
        }
      })
    },
    async updateFavorites () {
      if (!shouldUpdateFavorites) { return }
      shouldUpdateFavorites = false
      await this.$store.dispatch('currentUser/restoreUserFavorites')
    },
    duplicateSpace () {
      this.$store.dispatch('currentSpace/duplicateSpace')
      this.updateLocalSpaces()
      this.updateWithRemoteSpaces()
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
        this.dialogHeight = utils.elementHeight(element) - offsetfooterHeight
      })
    },
    updateResultsSectionHeight () {
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element) - 2 - offsetfooterHeight
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
.space-details
  .privacy-button
    > button
      height 24px
      min-width 24px
  .explore-message
    display flex
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
  .button-down-arrow
    padding 0
</style>
