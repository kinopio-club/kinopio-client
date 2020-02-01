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
        button Help →
      //- TODO other blockers/QA: https://kinopio.club/-idea-community-spaces-rgvRZ4ttF_4qCw3jIh_CT

  section.results-section
    ul.results-list
      template(v-for="(space in spaces")
        a(:href="space.url")
          li(tabindex="0")
            .badge.info(:style="{ background: user(space).color}")
              .anon-avatar
              .user-name(v-if="user(space).name") {{user(space).name}}
            span {{space.name}}
</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'CommunitySpaces',
  components: {
    Loader
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
    border-top-left-radius 0 !important
    border-top-right-radius 0 !important
  a
    color var(--primary)
    text-decoration none
  .badge
    display flex
  .user-name
    margin-left 6px
    max-width 100px
    white-space nowrap
    overflow hidden
    text-overflow ellipsis
  .anon-avatar
    background-position center
    height 15px
    width 12px
    display inline-block
    background-repeat no-repeat
    background-size contain
  button + a
    margin-left 6px
</style>
