<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click="closeDialogs")
  section
    .row.privacy-row(v-if="isSpaceMember")
      input(placeholder="name" v-model="spaceName")

      .button-wrap(v-if="isSpaceMember")
        button(@click.stop="togglePrivacyPickerIsVisible" :class="{ active: privacyPickerIsVisible }")
          img.icon.privacy-icon(:src="privacyIcon")
        PrivacyPicker(:visible="privacyPickerIsVisible" @closeDialog="closeDialogs" @updateSpaces="updateSpaces")

    template(v-if="!isSpaceMember")
      p {{spaceName}}
      .row(v-if="showInExplore")
        .badge.status.explore-message
          img.icon(src="@/assets/checkmark.svg")
          span Shown in Explore

    .row(v-if="isSpaceMember && !currentSpaceIsPrivate")
      label(:class="{active: showInExplore}" @click.prevent="toggleShowInExplore" @keydown.stop.enter="toggleShowInExplore")
        input(type="checkbox" v-model="showInExplore")
        span Show in Explore
    template(v-if="error.signUpToShowInExplore")
      .row
        p.error-message
          span To show this,
          span.badge.info you need to Sign Up or In
          span for your spaces to be accessible anywhere.
      .row
        button(@click="triggerSignUpOrInIsVisible") Sign Up or In
    template(v-if="error.editSpaceToShowInExplore")
      p.error-message
        span To show this,
        span.badge.info you need to edit and rename this space first

    button(v-if="isSpaceMember" @click="removeCurrentSpace")
      img.icon(src="@/assets/remove.svg")
      span Remove

    .button-wrap
      button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="currentSpace" :exportScope="exportScope")

  section.results-actions
    button(@click="addSpace")
      img.icon(src="@/assets/add.svg")
      span Add

    .button-wrap
      button(@click.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
        span Import
      Import(:visible="importIsVisible" @updateSpaces="updateSpaces" @closeDialog="closeDialogs")

  section.results-section
    .filter-wrap(v-if="isNumerousSpaces")
      img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
      input(placeholder="Search" v-model="spaceFilter" ref="filterInput")
      button.borderless.clear-input-wrap(@click="clearFilter")
        img.icon(src="@/assets/add.svg")
    SpaceList(:spaces="spacesFiltered" @selectSpace="changeSpace")
</template>

<script>
import fuzzy from 'fuzzy'

import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'
import privacy from '@/spaces/privacy.js'
import SpaceList from '@/components/SpaceList.vue'

export default {
  name: 'SpaceDetails',
  components: {
    Export,
    Import,
    PrivacyPicker,
    SpaceList
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spaces: [],
      exportIsVisible: false,
      importIsVisible: false,
      filter: '',
      filteredSpaces: [],
      privacyPickerIsVisible: false,
      error: {
        signUpToShowInExplore: false,
        editSpaceToShowInExplore: false
      }
    }
  },
  computed: {
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
    currentSpace () {
      return this.$store.state.currentSpace
    },
    exportScope () {
      return 'space'
    },
    isSpaceMember () {
      const currentSpace = this.$store.state.currentSpace
      return this.$store.getters['currentUser/isSpaceMember'](currentSpace)
    },
    isNumerousSpaces () {
      return Boolean(this.spaces.length >= 5)
    },
    currentSpaceIsPrivate () {
      return this.$store.state.currentSpace.privacy === 'private'
    },
    showInExplore () {
      return this.$store.state.currentSpace.showInExplore
    },
    userIsSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    },
    privacyIcon () {
      const privacyState = privacy.states().find(state => {
        return state.name === this.$store.state.currentSpace.privacy
      })
      return require(`@/assets/${privacyState.icon}.svg`)
    }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    toggleShowInExplore () {
      const isDefaultSpace = this.$store.getters['currentSpace/isDefaultSpace']
      if (!this.userIsSignedIn) {
        this.error.signUpToShowInExplore = true
        return
      } else if (isDefaultSpace) {
        this.error.editSpaceToShowInExplore = true
        return
      }
      const value = !this.showInExplore
      this.$store.dispatch('currentSpace/updateSpace', { showInExplore: value })
      this.updateSpaces()
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
      this.clearErrors()
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
      this.clearErrors()
      const userSpaces = cache.getAllSpaces().filter(space => {
        return this.$store.getters['currentUser/canEditSpace'](space)
      })
      this.spaces = userSpaces
    },
    async updateWithRemoteSpaces () {
      const spaces = await this.$store.dispatch('api/getUserSpaces')
      if (!spaces) { return }
      this.spaces = spaces
    },
    clearFilter () {
      this.filter = ''
    },
    clearErrors () {
      this.error.signUpToShowInExplore = false
      this.error.editSpaceToShowInExplore = false
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
  .privacy-row
    margin-bottom 6px
    button
      margin-left 6px
      padding 0
      height 24px
      width 24px
      display flex
      justify-content center
  .error-message
    .badge
      display inline-block
  .explore-message
    display flex
    margin-top 6px
</style>
