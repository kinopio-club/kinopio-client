<template lang="pug">
.new-spaces(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.header
    span The newest spaces made by cool people like you
    p(v-if="loading")
      Loader(:visible="loading")

  section.results-section
    ul.results-list
      template(v-for="(space in spaces")
        a(:href="space.url")
          li(tabindex="0")
            User(:user="user(space)" :isClickable="false" :key="user(space).id")
            span {{space.name}}
</template>

<script>
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'

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
  a
    color var(--primary)
    text-decoration none
  .badge
    display flex
  button + a
    margin-left 6px
  .user
    margin-right 6px
</style>
