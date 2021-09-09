<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    template(v-if="isSpaceMember")
      .row.space-meta-row
        .button-wrap(@click.left.stop="toggleBackgroundIsVisible")
          .background-tint(:style="backgroundTintStyles")
          button.background-button(:style="backgroundStyles" :class="{ active: backgroundIsVisible }")
          //- Background Upload Progress
          .uploading-container-footer(v-if="pendingUpload")
            .badge.info(:class="{absolute : pendingUpload.imageDataUrl}")
              Loader(:visible="true")
              span {{pendingUpload.percentComplete}}%
          //- Background Remote Upload Progress
          .uploading-container-footer(v-if="remotePendingUpload")
            .badge.info
              Loader(:visible="true")
              span {{remotePendingUpload.percentComplete}}%
          Background(:visible="backgroundIsVisible" @updateSpaces="updateSpaces")
        input(ref="name" placeholder="name" v-model="spaceName")
      .row.privacy-row
        PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showIconOnly="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateSpaces="updateSpaces")
        ShowInExploreButton(@updateSpaces="updateSpaces")

    template(v-if="!isSpaceMember")
      .row.space-meta-row.not-space-member
        .button-wrap(@click.left.stop="toggleBackgroundIsVisible")
          .background-tint(:style="backgroundTintStyles")
          button.background-button(:style="backgroundStyles" :class="{ active: backgroundIsVisible }")
          Background(:visible="backgroundIsVisible")
        p {{spaceName}}
      .row(v-if="shouldShowInExplore")
        .badge.status.explore-message
          img.icon.sunglasses(src="@/assets/sunglasses.svg")
          span In Explore

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
      Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="currentSpace" @updateSpaces="updateSpaces")

  section.results-actions
    .row
      //- Add Space
      .button-wrap
        button(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: addSpaceIsVisible }")
          img.icon(src="@/assets/add.svg")
          span Space
        AddSpace(:visible="addSpaceIsVisible" @closeDialogs="closeDialogs" @addSpace="addSpace")
      //- Import
      .button-wrap
        button(@click.left.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
          span Import
        Import(:visible="importIsVisible" @updateSpaces="updateSpaces" @closeDialog="closeDialogs")
      //- Filters
      .button-wrap.toggle-filters(v-if="spacesHasJournalSpace")
        button(@click.left.stop="toggleSpaceFiltersIsVisible" :class="{ active: spaceFiltersIsVisible }")
          template(v-if="spaceFiltersActive")
            span.badge.info
              img.icon(src="@/assets/filter.svg")
          template(v-else)
            img.icon(src="@/assets/filter.svg")
        SpaceFilters(:visible="spaceFiltersIsVisible")

  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="filteredSpaces" :isLoading="isLoadingRemoteSpaces" :showUserIfCurrentUserIsCollaborator="true" :parentIsSpaceDetails="true" @selectSpace="changeSpace")
</template>

<script>
import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import AddSpace from '@/components/dialogs/AddSpace.vue'
import Background from '@/components/dialogs/Background.vue'
import SpaceFilters from '@/components/dialogs/SpaceFilters.vue'
import SpaceList from '@/components/SpaceList.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import ShowInExploreButton from '@/components/ShowInExploreButton.vue'
import templates from '@/data/templates.js'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import backgroundImages from '@/data/backgroundImages.json'

import debounce from 'lodash-es/debounce'

let shouldUpdateFavorites = true
const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'SpaceDetails',
  components: {
    Export,
    Import,
    AddSpace,
    Background,
    SpaceFilters,
    SpaceList,
    PrivacyButton,
    ShowInExploreButton,
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
      }
      if (mutation.type === 'updatePageSizes') {
        this.updateHeights()
      }
      if (mutation.type === 'triggerUpdateBackgroundTint') {
        this.updateBackgroundTint()
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
      privacyPickerIsVisible: false,
      backgroundIsVisible: false,
      isLoadingRemoteSpaces: false,
      remoteSpaces: [],
      resultsSectionHeight: null,
      dialogHeight: null,
      backgroundTint: '',
      filterShowJournalSpacesOnly: false,
      filterShowSpacesOnly: false,
      journalSpaces: [],
      nonJournalSpaces: [],
      spaceFiltersIsVisible: false
    }
  },
  computed: {
    filteredSpaces () {
      if (this.filterShowJournalSpacesOnly) {
        this.updateJournalSpaces()
        return this.journalSpaces
      } else if (this.filterShowSpacesOnly) {
        this.updateNonJournalSpaces()
        return this.nonJournalSpaces
      } else {
        return this.spaces
      }
    },
    spaceFiltersActive () {
      if (this.filterShowJournalSpacesOnly || this.filterShowSpacesOnly) {
        return '1'
      } else {
        return null
      }
    },
    currentSpace () { return this.$store.state.currentSpace },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    shouldShowInExplore () {
      const privacy = this.$store.state.currentSpace.privacy
      if (privacy === 'private') { return false }
      return this.$store.state.currentSpace.showInExplore
    },
    spaceName: {
      get () {
        return this.$store.state.currentSpace.name
      },
      set (newName) {
        this.$store.dispatch('currentSpace/updateSpace', { name: newName })
        this.updateSpaces()
      }
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
    backgroundStyles () {
      const defaultBackgroundThumbnail = 'https://kinopio-backgrounds.us-east-1.linodeobjects.com/background-thumbnail.svg'
      let background = this.$store.state.currentSpace.background
      const backgroundImage = backgroundImages.find(image => {
        const isImage = image.url === background
        const hasThumbnailUrl = image.thumbnailUrl
        return isImage && hasThumbnailUrl
      })
      if (backgroundImage) {
        background = backgroundImage.thumbnailUrl || background
      }
      if (!utils.urlIsImage(background)) {
        background = defaultBackgroundThumbnail
      }
      return {
        backgroundImage: `url(${background})`
      }
    },
    backgroundTintStyles () {
      if (this.backgroundTint) {
        return {
          background: this.backgroundTint,
          mixBlendMode: 'multiply'
        }
      } else {
        return {}
      }
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
    remotePendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      let remotePendingUploads = this.$store.state.remotePendingUploads
      return remotePendingUploads.find(upload => {
        const inProgress = upload.percentComplete < 100
        const isSpace = upload.spaceId === currentSpace.id
        return inProgress && isSpace
      })
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
    toggleFilterShowJournalSpacesOnly () {
      const isVisible = this.filterShowJournalSpacesOnly
      this.closeDialogs()
      this.filterShowSpacesOnly = false
      this.filterShowJournalSpacesOnly = !isVisible
    },
    toggleFilterShowSpacesOnly () {
      const isVisible = this.filterShowSpacesOnly
      this.closeDialogs()
      this.filterShowJournalSpacesOnly = false
      this.filterShowSpacesOnly = !isVisible
    },
    toggleShouldShowAllSpaces () {
      this.closeDialogs()
      this.filterShowJournalSpacesOnly = false
      this.filterShowSpacesOnly = false
    },
    addSpace () {
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addSpace')
      this.updateSpaces()
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
    togglePrivacyPickerIsVisible () {
      const isVisible = this.privacyPickerIsVisible
      this.closeDialogs()
      this.privacyPickerIsVisible = !isVisible
    },
    toggleBackgroundIsVisible () {
      const isVisible = this.backgroundIsVisible
      this.closeDialogs()
      this.backgroundIsVisible = !isVisible
    },
    closeDialogs () {
      this.exportIsVisible = false
      this.importIsVisible = false
      this.addSpaceIsVisible = false
      this.privacyPickerIsVisible = false
      this.backgroundIsVisible = false
      this.spaceFiltersIsVisible = false
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
      this.updateSpaces()
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
    updateSpaces () {
      this.debouncedUpdateSpaces()
    },
    debouncedUpdateSpaces: debounce(async function () {
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
        cache.removeSpacePermanent(spaceToRemove)
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
      this.updateSpaces()
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
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    updateResultsSectionHeight () {
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element) - 2
      })
    },
    updateBackgroundTint () {
      let color = this.currentSpace.backgroundTint
      this.backgroundTint = color
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateSpaces()
        this.updateWithRemoteSpaces()
        this.closeDialogs()
        this.updateFavorites()
        this.updateHeights()
        this.updateBackgroundTint()
      }
    }
  }
}
</script>

<style lang="stylus">
.space-details
  .privacy-row
    display flex
    align-items flex-start
  .privacy-button
    > button
      height 24px
      min-width 24px
  .explore-message
    display flex
  button.disabled
    opacity 0.5
    pointer-events none
  .space-meta-row
    > .button-wrap + input
      margin 0
    > .button-wrap
      padding-right 6px
      > button
        width 24px
        height 24px
        background-size cover
        background-position center
    > .button-wrap + p
      margin-top 0
    &.not-space-member
      margin 0
      margin-bottom 10px
  .uploading-container-footer
    position absolute
    top 15px
    left 8px
    width 100px
    pointer-events none
    z-index 1
    .badge
      display inline-block
      &.absolute
        position absolute
        top 6px
        left 6px
  .background-tint
    width 22px
    height 22px
    top 1px
    left 1px
    position absolute
    pointer-events none
  .background-button
    &:hover,
    &:active,
    &.active
      background-color var(--primary-background)
  .toggle-filters
    .badge
      margin-right 0
</style>
