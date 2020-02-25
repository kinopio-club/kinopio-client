<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click="closeDialogs")
  section
    .row(v-if="canEditCurrentSpace" :class="{ 'privacy-row': canEditCurrentSpace && userIsSignedIn }")
      input(placeholder="name" v-model="spaceName")

      .button-wrap(v-if="userIsSignedIn")
        button(@click.stop="togglePrivacyPickerIsVisible" :class="{ active: privacyPickerIsVisible }")
          img.icon(v-if="currentSpaceIsPrivate" src="@/assets/lock.svg")
          img.icon(v-else src="@/assets/unlock.svg")
        PrivacyPicker(:visible="privacyPickerIsVisible" @closeDialog="closeDialogs" @updateSpaces="updateSpaces")

    template(v-if="!canEditCurrentSpace")
      p {{spaceName}}
      .row(v-if="showInExplore")
        .badge.status
          img.icon(src="@/assets/checkmark.svg")
          span Shown in Explore

    .row(v-if="canEditCurrentSpace && !currentSpaceIsPrivate")
      label(:class="{active: showInExplore}" @click.prevent="toggleShowInExplore" @keydown.stop.enter="toggleShowInExplore")
        input(type="checkbox" v-model="showInExplore")
        span Show in Explore
    template(v-if="showCannotShowInExplore")
      p.cannot-show-in-explore
        span To share,
        span.badge.info you need to Sign Up or In
        span for your spaces to be accessible to others.
      .row
        button(@click="triggerSignUpOrInIsVisible") Sign Up or In

    button(v-if="canEditCurrentSpace" @click="removeCurrentSpace")
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
    ul.results-list
      template(v-for="(space in spacesFiltered")
        li(@click="changeSpace(space)" :class="{ active: spaceIsActive(space.id) }" :key="space.id" tabindex="0" v-on:keyup.enter="changeSpace(space)")
          .badge.info.template-badge(v-show="spaceIsTemplate(space.id)")
            span Template
          .name
            span {{space.name}}
            .badge.status(v-if="shouldShowInExploreBadge(space)")
              img.icon(src="@/assets/checkmark.svg")
            img.icon(v-if="spaceIsPrivate(space)" src="@/assets/lock.svg")
</template>

<script>
import fuzzy from 'fuzzy'

import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import templates from '@/spaces/templates.js'
import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'

export default {
  name: 'SpaceDetails',
  components: {
    Export,
    Import,
    PrivacyPicker
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
      showCannotShowInExplore: false
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
    canEditCurrentSpace () {
      return this.$store.getters['currentUser/canEditCurrentSpace']
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
    }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    toggleShowInExplore () {
      if (!this.userIsSignedIn) {
        this.showCannotShowInExplore = true
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
    toggleTemplatesIsVisible () {
      const isVisible = this.templatesIsVisible
      this.closeDialogs()
      this.templatesIsVisible = !isVisible
    },
    togglePrivacyPickerIsVisible () {
      const isVisible = this.privacyPickerIsVisible
      this.closeDialogs()
      this.privacyPickerIsVisible = !isVisible
    },
    spaceIsActive (spaceId) {
      const currentSpace = this.$store.state.currentSpace.id
      return Boolean(currentSpace === spaceId)
    },
    spaceIsTemplate (spaceId) {
      const templateSpaceIds = templates.spaces().map(space => space.spaceId)
      return templateSpaceIds.includes(spaceId)
    },
    addSpace () {
      this.$store.dispatch('currentSpace/addSpace')
      this.$nextTick(() => {
        this.updateSpaces()
      })
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', space)
    },
    spaceIsPrivate (space) {
      return space.privacy === 'private'
    },
    changeToLastSpace () {
      if (this.spaces.length) {
        this.$store.dispatch('currentSpace/changeSpace', this.spaces[0])
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
    async updateWithRemoteSpaces () {
      const spaces = await this.$store.dispatch('api/getUserSpaces')
      if (!spaces) { return }
      this.spaces = spaces
    },
    clearFilter () {
      this.filter = ''
    },
    shouldShowInExploreBadge (space) {
      if (space.privacy === 'private') { return }
      return space.showInExplore
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateSpaces()
        this.updateWithRemoteSpaces()
        this.closeDialogs()
        this.filter = ''
        this.showCannotShowInExplore = false
      }
    }
  }
}
</script>

<style lang="stylus">
.space-details
  .template-badge
    flex none
  .privacy-row
    margin-bottom 6px
    button
      margin-left 6px
    .icon
      width 13px
      height 11px

  .badge.status
    display inline-flex
    margin-top 8px
    .icon
      margin-top -1px

  .results-section
    .badge.status
      margin 0
      margin-left 6px
      vertical-align middle
      img
        margin 0
    .name
      white-space wrap
      overflow hidden
      .icon
        margin-left 6px
  .cannot-show-in-explore
    margin-bottom 10px
    .badge
      display inline-block
</style>
