<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click="closeDialogs")
  section
    .row
      //.badge(:style="typeGradient()")
      //  img.space-moon(src="@/assets/space-moon.svg")
      input(placeholder="name" v-model="spaceName")

    button(@click="removeCurrentSpace")
      img.icon(src="@/assets/remove.svg")
      span Remove

    .button-wrap
      button(@click.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
        span Export
      Export(:visible="exportIsVisible" :exportName="spaceName" :exportData="currentSpace" :exportScope="exportScope")

  section.results-actions
    button(@click="addSpace")
      img.icon(src="@/assets/add.svg")
      span Add

    //button(@click="remixCurrentSpace")
    //  img.icon(src="@/assets/copy.svg")
    //  span Copy

  section.results-section
    ul.results-list
      template(v-for="(space in spaces")
        li(@click="changeSpace(space)" :class="{ active: spaceIsActive(space.id) }" :key="space.id")
          //.badge(:style="typeGradient(space)")
          //  img.space-moon(src="@/assets/space-moon.svg")
          .name {{space.name || spaceIdName}}
</template>

<script>
import cache from '@/cache.js'
import Export from '@/components/dialogs/Export.vue'

export default {
  name: 'SpaceDetails',
  components: {
    Export
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spaces: [],
      exportIsVisible: false
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
    spaceIdName () {
      return `space-${this.$store.state.currentSpace.id}`
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
    closeDialogs () {
      this.exportIsVisible = false
    },
    // typeGradient (space) {
    //   space = space || this.$store.state.currentSpace
    //   const types = space.connectionTypes.slice(0, 5)
    //   if (types.length > 1) {
    //     const colorPercent = 100 / (types.length)
    //     const gradient = types.map((type, index) => {
    //       return `${type.color} ${colorPercent * index}%`
    //     })
    //     return { background: `radial-gradient(circle, ${gradient})` }
    //   } else if (types.length === 1) {
    //     return { background: types[0].color }
    //   } else {
    //     return { background: 'transparent' }
    //   }
    // },
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
    // remixCurrentSpace () {
    //  this.$store.dispatch('currentSpace/remixCurrentSpace')
    //  this.updateSpaces()
    // },
    removeCurrentSpace () {
      const removeSpace = `space-${this.$store.state.currentSpace.id}`
      cache.removeLocal(removeSpace)
      this.updateSpaces()
      if (this.spaces.length) {
        this.$store.dispatch('currentSpace/changeSpace', this.spaces[0])
      } else {
        this.addSpace()
      }
    },
    updateSpaces () {
      const spaces = cache.getAllSpaces()
      this.spaces = spaces.sort((a, b) => {
        return b.cacheDate - a.cacheDate
      })
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
  .row
    .badge
      width 19px

</style>
