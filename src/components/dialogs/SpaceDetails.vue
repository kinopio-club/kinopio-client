<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible")
  section
    .row
      input(placeholder="name" v-model="spaceName")
    button(@click="remixCurrentSpace") Remix
    button(@click="removeCurrentSpace")
      img.icon(src="@/assets/remove.svg")
      span Remove
  section.results-actions
    button(@click="addSpace")
      img.icon(src="@/assets/add.svg")
      span Add

  section.results-section
    ul.results-list
      template(v-for="(space in spaces")
        li(@click="changeSpace(space.id)" :key="space.id")
          .badge(:style="{backgroundColor: space.color}")
            img.space-moon(src="@/assets/space-moon.svg")
          .name {{space.name}}
      //  li(:class="{ active: spaceIsActive(space.id) }" @click="changeSpace(space)" :key="space.id")
      //  badge is a compound color based on connection types present
      //    .badge(:style="{backgroundColor: space.color}" :class="{checked: connectionTypeIsDefault(space.id)}")
      //    .name {{space.name}}

  section
    button Export
    // TODO new Export dialog, currently just two option: download json: current space, all spaces
    // will expand the dom downwards, can window.scroll smooth downwards if required

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
      }
    }
  },
  methods: {
    addSpace () {
      console.log('🥬 add space')
      // dispatch a store action that:
      // create new space from store , using new json data,
      // and new unique id
      // default name = low permutation rand name? name based on id

      // this.changeSpace (newSpace.id)
    },
    changeSpace (spaceId) {
      console.log('🌸 change space')
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
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        const spaces = cache.getAllSpaces()
        console.log('cached spaces', spaces)
        this.spaces = spaces
      }
    }
  }
}
</script>

<style lang="stylus">
.space-details
  top calc(100% - 8px)
</style>
