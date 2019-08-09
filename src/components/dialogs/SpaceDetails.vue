<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible")
  section
    .row
      .badge
        .connected-colors
          template(v-for="type in currentConnectionTypes.slice(0, 5)")
            .color(:style="{ background: type.color}")
        img.space-moon(src="@/assets/space-moon.svg")
      input(placeholder="name" v-model="spaceName")
    .row
      button(@click="remixCurrentSpace") Remix
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

  section.results-section
    ul.results-list
      template(v-for="(space in spaces")
        li(@click="changeSpace(space.id)" :class="{ active: spaceIsActive(space.id) }" :key="space.id")
          .badge
            .connected-colors
              template(v-for="type in space.connectionTypes.slice(0, 5)")
                .color(:style="{ background: type.color}")
            img.space-moon(src="@/assets/space-moon.svg")
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
    },
    currentConnectionTypes () {
      return this.$store.state.currentSpace.connectionTypes
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
    spaceIsActive (spaceId) {
      const currentSpace = this.$store.state.currentSpace.id
      return Boolean(currentSpace === spaceId)
    },
    addSpace () {
      this.$store.dispatch('currentSpace/createNewSpace')
      this.updateSpaces()
    },
    changeSpace (spaceId) {
      console.log('🌸 change space', spaceId)
      // dispatch a store action that:
      // update user.currentSpace
      // swap currentSpace with it
      // commit('currentUser/updateCurrentSpace')
    },
    remixCurrentSpace () {
      console.log('☮️ remixCurrentSpace')
      // cope the current space, with new id and name, into a new cache item
      // this.changeSpace(space.id)
    },
    removeCurrentSpace () {
      console.log('💣 removeCurrentSpace')
      // remove current space-id from cache
      // if spaces > 1 ,
      // use first thing in cache.getAllSpaces
      // else ,
      // make a new space
      // this this.addSpace()
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

  .connected-colors
    position absolute
    left 0
    top 0
    display flex
    height 100%
    width 100%
    border-radius 2px
    overflow hidden
    .color
      width 100%

</style>
