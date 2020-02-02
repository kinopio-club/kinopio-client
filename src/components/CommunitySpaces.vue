<template lang="pug">
.community-spaces(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.header
    Loader(:visible="loading")

    template(v-if="!loading")
      //- p Recently updated public spaces
      button(@click="getNewSpaces")
        img.refresh.icon(src="@/assets/refresh.svg")

      a(href="#")
        //- TODO add help link
        button Info →
      //- TODO other blockers/QA: https://kinopio.club/-idea-community-spaces-rgvRZ4ttF_4qCw3jIh_CT

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
  name: 'CommunitySpaces',
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
    getNewSpaces () {
      this.$emit('getNewSpaces')
    },
    user (space) {
      return space.users[0]
    }
  }
}
</script>

<style lang="stylus">
.community-spaces
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
