<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click.left="closeDialogs")
  section
    template(v-if="isSpaceMember")
      .row
        input(placeholder="name" v-model="spaceName")
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
      button(@click.left="removeCurrentSpace")
        img.icon(src="@/assets/remove.svg")
        span {{removeLabel}}
    .button-wrap(v-if="!isSpaceMember")
      button(@click.left="duplicateSpace")
        img.icon(src="@/assets/add.svg")
        span Duplicate
    .button-wrap
      button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="currentSpace" :exportScope="exportScope" @updateSpaces="updateSpaces")

  section.results-actions
    .row
      .segmented-buttons
        button(@click.left.stop="hideFavorites" :class="{ active: !favoritesIsVisible }")
          span Yours
        button(@click.left.stop="showFavorites" :class="{ active: favoritesIsVisible }")
          span Favorites
    .row(v-if="!favoritesIsVisible")
      button(@click.left="addSpace")
        img.icon(src="@/assets/add.svg")
        span Add
      .button-wrap
        button(@click.left.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
          span Import
        Import(:visible="importIsVisible" @updateSpaces="updateSpaces" @closeDialog="closeDialogs")

  section.results-section(v-if="!favoritesIsVisible")
    SpaceList(:spaces="spaces" :isLoading="isLoadingRemoteSpaces" :showUserIfCurrentUserIsCollaborator="true" @selectSpace="changeSpace")

  Favorites(:visible="favoritesIsVisible" :loading="!hasRestoredFavorites")

</template>

<script>
import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import SpaceList from '@/components/SpaceList.vue'
import Favorites from '@/components/Favorites.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import ShowInExploreButton from '@/components/ShowInExploreButton.vue'
import utils from '@/utils.js'

export default {
  name: 'SpaceDetails',
  components: {
    Export,
    Import,
    SpaceList,
    Favorites,
    PrivacyButton,
    ShowInExploreButton
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spaces: [],
      favoriteSpaces: [],
      favoriteUsers: [],
      exportIsVisible: false,
      importIsVisible: false,
      privacyPickerIsVisible: false,
      favoritesIsVisible: false,
      favoriteUsersIsVisible: false,
      removeLabel: 'Remove',
      isLoadingRemoteSpaces: false
    }
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    exportScope () { return 'space' },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    hasRestoredFavorites () { return this.$store.state.hasRestoredFavorites },
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
    }
  },
  methods: {
    showFavorites () {
      this.favoritesIsVisible = true
    },
    hideFavorites () {
      this.favoritesIsVisible = false
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
    closeDialogs () {
      this.exportIsVisible = false
      this.importIsVisible = false
      this.privacyPickerIsVisible = false
    },
    togglePrivacyPickerIsVisible () {
      const isVisible = this.privacyPickerIsVisible
      this.closeDialogs()
      this.privacyPickerIsVisible = !isVisible
    },
    addSpace () {
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addSpace')
      this.updateSpaces()
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space })
      this.updateRemoveLabel()
    },
    changeToLastSpace () {
      const currentSpace = this.$store.state.currentSpace
      const spaces = this.spaces.filter(space => space.id !== currentSpace.id)
      if (spaces.length) {
        this.$store.dispatch('currentSpace/changeSpace', { space: spaces[0] })
      } else {
        this.addSpace()
      }
      this.updateRemoveLabel()
    },
    removeCurrentSpace () {
      const currentUser = this.$store.state.currentUser
      const currentUserIsSpaceCollaborator = this.$store.getters['currentUser/isSpaceCollaborator']()
      if (currentUserIsSpaceCollaborator) {
        this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', currentUser)
      } else {
        this.$store.dispatch('currentSpace/removeCurrentSpace')
      }
      this.updateSpaces()
      this.changeToLastSpace()
    },
    async updateSpaces () {
      this.$nextTick(() => {
        const currentUser = this.$store.state.currentUser
        const userSpaces = cache.getAllSpaces().filter(space => {
          return this.$store.getters['currentUser/canEditSpace'](space)
        })
        this.spaces = utils.AddCurrentUserIsCollaboratorToSpaces(userSpaces, currentUser)
        this.updateRemoveLabel()
      })
    },
    pruneCachedSpaces (remoteSpaces) {
      const remoteSpaceIds = remoteSpaces.map(space => space.id)
      const spacesToRemove = this.spaces.filter(space => !remoteSpaceIds.includes(space.id))
      spacesToRemove.forEach(spaceToRemove => {
        cache.removeSpacePermanent(spaceToRemove)
      })
    },
    async updateWithRemoteSpaces () {
      this.isLoadingRemoteSpaces = true
      const remoteSpaces = await this.$store.dispatch('api/getUserSpaces')
      this.isLoadingRemoteSpaces = false
      if (!remoteSpaces) { return }
      this.pruneCachedSpaces(remoteSpaces)
      this.spaces = remoteSpaces
    },
    updateRemoveLabel () {
      const currentUserIsSpaceCollaborator = this.$store.getters['currentUser/isSpaceCollaborator']()
      if (currentUserIsSpaceCollaborator) {
        this.removeLabel = 'Leave'
      } else {
        this.removeLabel = 'Remove'
      }
    },
    async updateFavorites () {
      await this.$store.dispatch('currentUser/restoreUserFavorites')
    },
    duplicateSpace () {
      const duplicatedSpaceName = this.$store.state.currentSpace.name
      this.$store.dispatch('currentSpace/duplicateSpace')
      this.$store.commit('addNotification', { message: `${duplicatedSpaceName} is now yours to edit`, type: 'success' })
      this.updateSpaces()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateSpaces()
        this.updateWithRemoteSpaces()
        this.closeDialogs()
        this.updateFavorites()
      } else {
        this.favoritesIsVisible = false
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
</style>
