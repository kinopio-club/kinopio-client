<template lang="pug">
.new-spaces(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.header
    span Recently updated spaces made by cool people like you
    p(v-if="loading")
      Loader(:visible="loading")

  section.results-section
    ul.results-list
      template(v-for="(space in spaces")
        li(tabindex="0" @click.stop="open(space)" :class="{ active: spaceIsActive(space) }")
          User(:user="user(space)" :isClickable="false" :key="user(space).id")
          span {{space.name}}
</template>

<script>
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

export default {
  name: 'NewSpaces',
  components: {
    Loader,
    User
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    spaces: Array
  },
  methods: {
    user (space) {
      return space.users[0]
    },
    open (space) {
      utils.updateWindowUrlAndTitle({
        space: space,
        shouldUpdateUrl: true
      })
      this.$store.dispatch('currentSpace/changeSpace', space)
    },
    spaceIsActive (space) {
      const currentSpace = this.$store.state.currentSpace
      return space.id === currentSpace.id
    }
  }
}
</script>

<style lang="stylus">
.new-spaces
  .header
    border-top 1px solid var(--primary)
    border-top-left-radius 0
    border-top-right-radius 0
  .badge
    display flex
  button + a
    margin-left 6px
  .user
    margin-right 6px
</style>
