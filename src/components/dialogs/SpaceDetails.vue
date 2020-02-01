<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click="closeDialogs")
  section
    input(v-if="canEditCurrentSpace" placeholder="name" v-model="spaceName")
    p(v-else) {{spaceName}}

    button(v-if="canEditCurrentSpace" @click="removeCurrentSpace")
      img.icon(src="@/assets/remove.svg")
      span Remove

    .button-wrap
      button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        span Export
      Export(:visible="exportIsVisible" :exportTitle="spaceName" :exportData="currentSpace" :exportScope="exportScope")

  section.results-actions
    .row
      .button-wrap
        button(@click.stop="toggleTemplatesIsVisible" :class="{ active: templatesIsVisible }")
          span Templates
        Templates(:visible="templatesIsVisible")

      .button-wrap
        button(@click.stop="toggleImportIsVisible" :class="{ active: importIsVisible }")
          span Import
        Import(:visible="importIsVisible" @updateSpaces="updateSpaces" @closeDialog="closeDialogs")

    button(@click="addSpace")
      img.icon(src="@/assets/add.svg")
      span Add

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
            img.icon(v-if="spaceIsPrivate(space)" src="@/assets/lock.svg")
            span {{space.name}}
</template>

<script>
import fuzzy from 'fuzzy'

import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'
import Templates from '@/components/dialogs/Templates.vue'
import templates from '@/spaces/templates.js'

export default {
  name: 'SpaceDetails',
  components: {
    Export,
    Import,
    Templates
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spaces: [],
      exportIsVisible: false,
      importIsVisible: false,
      templatesIsVisible: false,
      filter: '',
      filteredSpaces: []
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
    }
  },
  methods: {
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
    toggleTemplatesIsVisible () {
      const isVisible = this.templatesIsVisible
      this.closeDialogs()
      this.templatesIsVisible = !isVisible
    },
    closeDialogs () {
      this.exportIsVisible = false
      this.importIsVisible = false
      this.templatesIsVisible = false
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
      if (spaces) {
        this.spaces = spaces
      }
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
        this.filter = ''
      }
    }
  }
}
</script>

<style lang="stylus">
.template-badge
  flex none
</style>
