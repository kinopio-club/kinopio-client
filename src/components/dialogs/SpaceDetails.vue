<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible")
  section
    .row
      //.badge(:style="typeGradient()")
      //  img.space-moon(src="@/assets/space-moon.svg")
      input(placeholder="name" v-model="spaceName")

    button(@click="removeCurrentSpace")
      img.icon(src="@/assets/remove.svg")
      span Remove

    button(@click="exportToJSON")
      span Export
    a#export-downlaod-anchor.hidden

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

export default {
  name: 'SpaceDetails',
  props: {
    visible: Boolean
  },
  data () {
    return {
      spaces: []
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
    }
  },
  methods: {
    exportToJSON () {
      const json = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.$store.state.currentSpace))
      const downloadAnchor = document.getElementById('export-downlaod-anchor')
      const spaceId = this.$store.state.currentSpace.id
      downloadAnchor.setAttribute('href', json)
      downloadAnchor.setAttribute('download', `kinopio-space-${spaceId}.json`)
      downloadAnchor.click()
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
