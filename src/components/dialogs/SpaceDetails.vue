<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    template(v-if="isSpaceMember")
      .row
        input(ref="name" placeholder="name" v-model="spaceName")
      .row.privacy-row
        PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showIconOnly="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateSpaces="updateSpaces")
        ShowInExploreButton(@updateSpaces="updateSpaces")

    template(v-if="!isSpaceMember")
      p {{spaceName}}
      .row(v-if="shouldShowInExplore")
        .badge.status.explore-message
          img.icon(src="@/assets/checkmark.svg")
          span Shown in Explore

    .button-wrap(v-if="isSpaceMember")
      button(@click.left="removeCurrentSpace" :class="{ disabled: currentSpaceIsTemplate }")
        img.icon(src="@/assets/remove.svg")
        span {{removeLabel}}
    .button-wrap(v-if="!isSpaceMember")
      button(@click.left="duplicateSpace")
        img.icon(src="@/assets/add.svg")
        span Duplicate
    .button-wrap
      button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        img.icon.visit(src="@/assets/export.svg")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="currentSpace" :exportScope="exportScope" @updateSpaces="updateSpaces")

  section.results-actions
    .row
      .button-wrap
        button(@click.left.stop="toggleAddSpaceIsVisible" :class="{ active: addSpaceIsVisible }")
          img.icon(src="@/assets/add.svg")
          span Add
        AddSpace(:visible="addSpaceIsVisible" @closeDialogs="closeDialogs" @addSpace="addSpace")
      .button-wrap
        button(@click.left.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
          span Import
        Import(:visible="importIsVisible" @updateSpaces="updateSpaces" @closeDialog="closeDialogs")

  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="spaces" :isLoading="isLoadingRemoteSpaces" :showUserIfCurrentUserIsCollaborator="true" :parentIsSpaceDetails="true" @selectSpace="changeSpace")
</template>

<script>
import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import AddSpace from '@/components/dialogs/AddSpace.vue'
import SpaceList from '@/components/SpaceList.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import ShowInExploreButton from '@/components/ShowInExploreButton.vue'
import templates from '@/data/templates.js'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

import debounce from 'lodash-es/debounce'

let shouldUpdateFavorites = true

export default {
  name: 'SpaceDetails',
  components: {
    Export,
    Import,
    AddSpace,
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
      isLoadingRemoteSpaces: false,
      remoteSpaces: [],
      resultsSectionHeight: null,
      dialogHeight: null
    }
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    exportScope () { return 'space' },
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
    }
  },
  methods: {
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
    closeDialogs () {
      this.exportIsVisible = false
      this.importIsVisible = false
      this.addSpaceIsVisible = false
      this.privacyPickerIsVisible = false
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
      if (!this.visible) { return }
      this.updateDialogHeight()
      this.updateResultsSectionHeight()
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
      if (visible) {
        this.updateSpaces()
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
  .privacy-row
    display flex
    align-items flex-start
  .privacy-button
    > button
      height 24px
      min-width 24px
  .explore-message
    display flex
    margin-top 6px
  button.disabled
    opacity 0.5
    pointer-events none
</style>
