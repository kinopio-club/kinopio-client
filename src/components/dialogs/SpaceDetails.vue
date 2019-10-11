<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click="closeDialogs")
  section
    input(placeholder="name" v-model="spaceName")

    button(@click="removeCurrentSpace")
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
    ul.results-list
      template(v-for="(space in spaces")
        li(@click="changeSpace(space)" :class="{ active: spaceIsActive(space.id) }" :key="space.id")
          .name {{space.name}}
</template>

<script>
import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'
import Import from '@/components/dialogs/Import.vue'

export default {
  name: 'SpaceDetails',
  components: {
    Export,
    Import
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spaces: [],
      exportIsVisible: false,
      importIsVisible: false
    }
  },
  computed: {
    spaceName: {
      get () {
        return this.$store.state.currentSpace.name
      },
      set (newName) {
        this.$store.commit('currentSpace/updateName', newName)
        this.updateSpaces()
      }
    },
    currentSpace () {
      return this.$store.state.currentSpace
    },
    exportScope () {
      return 'space'
    }
  },
  methods: {
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
    },
    spaceIsActive (spaceId) {
      const currentSpace = this.$store.state.currentSpace.id
      return Boolean(currentSpace === spaceId)
    },
    addSpace () {
      this.$store.dispatch('currentSpace/createNewSpace')
      this.updateSpaces()
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', space)
    },
    changeToLastSpace () {
      if (this.spaces.length) {
        this.$store.dispatch('currentSpace/changeSpace', this.spaces[0])
      } else {
        this.addSpace()
      }
    },
    // remixCurrentSpace () {
    //  this.$store.dispatch('currentSpace/remixCurrentSpace')
    //  this.updateSpaces()
    // },
    removeCurrentSpace () {
      const spaceId = this.$store.state.currentSpace.id
      cache.removeSpace(spaceId)
      this.updateSpaces()
      this.changeToLastSpace()
    },
    updateSpaces () {
      this.spaces = cache.getSpaces()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateSpaces()
        this.closeDialogs()
      }
    }
  }
}
</script>

<style lang="stylus">
.space-details
  top calc(100% - 8px)
  // .row
  //   .badge
  //     width 19px

</style>
