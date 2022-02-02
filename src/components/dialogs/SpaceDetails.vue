<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    SpaceDetailsInfo(@updateSpaces="updateLocalSpaces" @closeDialogs="closeDialogs")
    //- Remove
    .button-wrap(v-if="isSpaceMember")
      button(@click.left="removeCurrentSpace" :class="{ disabled: currentSpaceIsTemplate }")
        img.icon(src="@/assets/remove.svg")
        span {{removeLabel}}
    //-  Duplicate
    .button-wrap(v-if="!isSpaceMember")
      button(@click.left="duplicateSpace")
        img.icon(src="@/assets/add.svg")
        span Duplicate
    //- Export
    .button-wrap
      button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        img.icon.visit(src="@/assets/export.svg")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="exportData" @updateSpaces="updateLocalSpaces")

  section.results-actions
    .row
      //- Add Space
      .button-wrap
        button(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: addSpaceIsVisible }")
          img.icon(src="@/assets/add.svg")
          span Space
        AddSpace(:visible="addSpaceIsVisible" @closeDialogs="closeDialogs" @addSpace="addSpace" @addJournalSpace="addJournalSpace")
      //- Import
      .button-wrap
        button(@click.left.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
          span Import
        Import(:visible="importIsVisible" @updateSpaces="updateLocalSpaces" @closeDialog="closeDialogs")
      //- Filters
      .button-wrap.toggle-filters(v-if="spacesHasJournalSpace")
        button(@click.left.stop="toggleSpaceFiltersIsVisible" :class="{ active: spaceFiltersIsVisible || spaceFiltersIsActive }")
          img.icon(src="@/assets/filter.svg")
          .badge.info.filter-is-active(v-if="spaceFiltersIsActive")
        SpaceFilters(:visible="spaceFiltersIsVisible" :spaces="filteredSpaces")

  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="filteredSpaces" :isLoading="isLoadingRemoteSpaces" :showUserIfCurrentUserIsCollaborator="true" :parentIsSpaceDetails="true" @selectSpace="changeSpace")
</template>

<script>
import cache from '@/cache.js'
import SpaceDetailsInfo from '@/components/SpaceDetailsInfo.vue'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import AddSpace from '@/components/dialogs/AddSpace.vue'
import SpaceFilters from '@/components/dialogs/SpaceFilters.vue'
import SpaceList from '@/components/SpaceList.vue'
import templates from '@/data/templates.js'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'

let shouldUpdateFavorites = true
const maxIterations = 30
let currentIteration, updatePositionTimer
const offsetfooterHeight = 50

export default {
  name: 'SpaceDetails',
  components: {
    SpaceDetailsInfo,
    Export,
    Import,
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
      }
      if (mutation.type === 'updatePageSizes') {
        this.updateHeights()
      }
    })
  },
  data () {
    return {
      spaces: [],
      favoriteSpaces: [],
      favoriteUsers: [],
      exportIsVisible: false,
      importIsVisible: false,
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
    spaceName () { return this.$store.state.currentSpace.name },
    dialogSpaceFilters () { return this.$store.state.currentUser.dialogSpaceFilters },
    dialogSpaceFilterByUser () { return this.$store.state.currentUser.dialogSpaceFilterByUser },
    spaceFiltersIsActive () {
      return Boolean(this.dialogSpaceFilters || utils.objectHasKeys(this.dialogSpaceFilterByUser))
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
      // filter by user
      if (utils.objectHasKeys(this.dialogSpaceFilterByUser)) {
        spaces = spaces.filter(space => space.userId === this.dialogSpaceFilterByUser.id)
      }
      return spaces
    },
    currentSpace () { return this.$store.state.currentSpace },
    exportData () { return this.$store.getters['currentSpace/all'] },
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
    spacesHasJournalSpace () {
      const journal = this.spaces.find(space => space.moonPhase)
      return Boolean(journal)
    }
  },
  methods: {
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
      this.$store.dispatch('currentSpace/addJournalSpace')
      this.updateLocalSpaces()
      this.$store.commit('triggerFocusSpaceDetailsName')
    },
    toggleExportIsVisible () {
      const isVisible = this.exportIsVisible
      this.closeDialogs()
      this.exportIsVisible = !isVisible
    },
    toggleImportIsVisible () {
      const isVisible = this.importIsVisible
      this.closeDialogs()
      this.importIsVisible = !isVisible
    },
    toggleAddSpaceIsVisible () {
      const isVisible = this.addSpaceIsVisible
      this.closeDialogs()
      this.addSpaceIsVisible = !isVisible
    },
    closeDialogs () {
      this.exportIsVisible = false
      this.importIsVisible = false
      this.addSpaceIsVisible = false
      this.spaceFiltersIsVisible = false
      this.$store.commit('triggerSpaceDetailsCloseDialogs')
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space })
      this.$store.dispatch('closeAllDialogs', 'spaceDetails.changeSpace')
    },
    changeToLastSpace () {
      const currentSpace = this.$store.state.currentSpace
      const spaces = this.spaces.filter(space => space.id !== currentSpace.id)
      if (spaces.length) {
        this.$store.dispatch('currentSpace/changeSpace', { space: spaces[0] })
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
        userSpaces = this.updateFavoriteSpaces(userSpaces)
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
    async updateWithRemoteSpaces () {
      this.isLoadingRemoteSpaces = true
      this.remoteSpaces = await this.$store.dispatch('api/getUserSpaces')
      this.isLoadingRemoteSpaces = false
      if (!this.remoteSpaces) { return }
      this.removeRemovedCachedSpaces(this.remoteSpaces)
      const spaces = this.updateFavoriteSpaces(this.remoteSpaces)
      this.spaces = spaces
      this.updateCachedSpacesUpdatedAt()
    },
    updateJournalSpaces () {
      const journalSpaces = this.spaces.filter(space => space.moonPhase)
      this.journalSpaces = journalSpaces
    },
    updateNonJournalSpaces () {
      const nonJournalSpaces = this.spaces.filter(space => !space.moonPhase)
      this.nonJournalSpaces = nonJournalSpaces
    },
    updateCachedSpacesUpdatedAt () {
      this.spaces.forEach(space => {
        const cachedSpace = cache.space(space.id)
        const isCachedSpace = utils.objectHasKeys(cachedSpace)
        const shouldUpdateDate = space.updatedAt !== cachedSpace.updatedAt
        if (isCachedSpace && shouldUpdateDate) {
          cache.updateSpace('updatedAt', space.updatedAt, space.id)
        }
      })
    },
    async updateFavorites () {
      if (!shouldUpdateFavorites) { return }
      shouldUpdateFavorites = false
      await this.$store.dispatch('currentUser/restoreUserFavorites')
    },
    duplicateSpace () {
      const duplicatedSpaceName = this.$store.state.currentSpace.name + ' copy'
      this.$store.dispatch('currentSpace/duplicateSpace')
      this.$store.commit('addNotification', { message: `${duplicatedSpaceName} is now yours to edit`, type: 'success' })
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
</style>
