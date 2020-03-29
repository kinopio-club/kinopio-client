<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click="closeDialogs")
  section
    template(v-if="isSpaceMember")
      .row
        input(placeholder="name" v-model="spaceName")
      .row
        PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showIconOnly="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateSpaces="updateSpaces")
        ShowInExploreButton(@updateSpaces="updateSpaces")

    template(v-if="!isSpaceMember")
      p {{spaceName}}
      .row(v-if="shouldShowInExplore")
        .badge.status.explore-message
          img.icon(src="@/assets/checkmark.svg")
          span Shown in Explore

    button(v-if="isSpaceMember" @click="removeCurrentSpace")
      img.icon(src="@/assets/remove.svg")
      span Remove
    .button-wrap
      button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="currentSpace" :exportScope="exportScope")

  section.results-actions
    .row
      .segmented-buttons
        button(@click.stop="hideFavorites" :class="{ active: !favoritesIsVisible }")
          span Yours
        button(@click.stop="showFavorites" :class="{ active: favoritesIsVisible }")
          span Favorites
    .row(v-if="!favoritesIsVisible")
      button(@click="addSpace")
        img.icon(src="@/assets/add.svg")
        span Add
      .button-wrap
        button(@click.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
          span Import
        Import(:visible="importIsVisible" @updateSpaces="updateSpaces" @closeDialog="closeDialogs")

  section.results-section(v-if="!favoritesIsVisible")
    .filter-wrap(v-if="isManySpaces")
      img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
      input(placeholder="Search" v-model="spaceFilter" ref="filterInput")
      button.borderless.clear-input-wrap(@click="clearFilter")
        img.icon(src="@/assets/add.svg")
    SpaceList(:spaces="spacesFiltered" @selectSpace="changeSpace")

  Favorites(:visible="favoritesIsVisible")

</template>

<script>
import fuzzy from 'fuzzy'

import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import SpaceList from '@/components/SpaceList.vue'
import Favorites from '@/components/Favorites.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import ShowInExploreButton from '@/components/ShowInExploreButton.vue'

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
      filter: '',
      filteredSpaces: [],
      privacyPickerIsVisible: false,
      favoritesIsVisible: false,
      favoriteUsersIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerFavoritesIsVisible') {
        this.favoritesIsVisible = true
        // todo getfavs()
      }
    })
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    exportScope () { return 'space' },
    isManySpaces () { return Boolean(this.spaces.length >= 5) },
    userIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
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
    spacesFiltered () {
      if (this.filter) {
        return this.filteredSpaces
      } else {
        return this.spaces
      }
    },
    spaceFilter: {
      get () {
        return this.filter
      },
      set (newValue) {
        this.filter = newValue
        const options = {
          pre: '',
          post: '',
          extract: (space) => {
            return space.name
          }
        }
        const filtered = fuzzy.filter(this.filter, this.spaces, options)
        const spaces = filtered.map(space => {
          return {
            name: space.string,
            id: space.original.id
          }
        })
        this.filteredSpaces = spaces
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
    focusFilterInput () {
      const element = this.$refs.filterInput
      element.focus()
      element.setSelectionRange(0, 0)
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
      this.$store.dispatch('currentSpace/addSpace')
      this.$nextTick(() => {
        this.updateSpaces()
      })
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space })
    },
    changeToLastSpace () {
      if (this.spaces.length) {
        this.$store.dispatch('currentSpace/changeSpace', { space: this.spaces[0] })
      } else {
        this.addSpace()
      }
    },
    removeCurrentSpace () {
      this.$store.dispatch('currentSpace/removeCurrentSpace')
      this.updateSpaces()
      this.changeToLastSpace()
    },
    async updateSpaces () {
      const userSpaces = cache.getAllSpaces().filter(space => {
        return this.$store.getters['currentUser/canEditSpace'](space)
      })
      this.spaces = userSpaces
    },
    pruneCachedSpaces (remoteSpaces) {
      const remoteSpaceIds = remoteSpaces.map(space => space.id)
      const spacesToRemove = this.spaces.filter(space => !remoteSpaceIds.includes(space.id))
      spacesToRemove.forEach(spaceToRemove => {
        cache.removeSpace(spaceToRemove)
      })
    },
    async updateWithRemoteSpaces () {
      const remoteSpaces = await this.$store.dispatch('api/getUserSpaces')
      if (!remoteSpaces) { return }
      this.pruneCachedSpaces(remoteSpaces)
      this.spaces = remoteSpaces
    },
    clearFilter () {
      this.filter = ''
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateSpaces()
        this.updateWithRemoteSpaces()
        this.closeDialogs()
        this.clearFilter()
      }
    }
  }
}
</script>

<style lang="stylus">
.space-details
  .explore-message
    display flex
    margin-top 6px
  .privacy-button
    > button
      height 24px
      min-width 24px
</style>
