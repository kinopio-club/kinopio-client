<template lang="pug">
dialog.narrow.favorites(v-if="visible" :open="visible" @click.stop="userDetailsIsNotVisible")
  section
    .segmented-buttons
      button(@click.stop="showSpaces" :class="{ active: spacesIsVisible }")
        span Spaces
        Loader(:visible="loading")
      button(@click.stop="hideSpaces" :class="{ active: !spacesIsVisible }")
        span People
        Loader(:visible="loading")
  section(v-if="shouldShowDescription")
    p Spaces and people you favorite can be found here
    p(v-if="loading")
      Loader(:visible="loading")

  section.results-section(v-else)
    ul.results-list
      template(v-for="(item in items")
        li(:key="item.id" @click.stop="open(item)" tabindex="0" v-on:keyup.stop.enter="open(item)" :class="{ active: itemIsOpened(item) }")
          .name(v-if="spacesIsVisible") {{item.name}}
          .badge(v-else :style="{background: item.color}")
            User(:user="item" :isClickable="false")
            span {{item.name}}
          button(@click.stop="remove(item)")
            img.icon(src="@/assets/remove.svg")
    UserDetails(:visible="userDetailsIsVisible" :user="openedUser")
</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'Favorites',
  components: {
    Loader,
    User: () => import('@/components/User.vue'),
    UserDetails: () => import('@/components/dialogs/UserDetails.vue')

  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spacesIsVisible: true,
      userDetailsIsVisible: false,
      openedUser: {},
      favoriteUsers: [],
      favoriteSpaces: [],
      loading: false
    }
  },
  computed: {
    shouldShowDescription () {
      const noSpaces = this.spacesIsVisible && !this.favoriteSpaces.length
      const noPeople = !this.spacesIsVisible && !this.favoriteUsers.length
      if (noSpaces || noPeople) { return true }
      return false
    },
    items () {
      if (this.spacesIsVisible) {
        return this.favoriteSpaces
      } else {
        return this.favoriteUsers
      }
    }
  },
  methods: {
    async getFavorites () {
      if (this.loading) { return }
      this.loading = true
      const favorites = await this.$store.dispatch('api/getUserFavorites')
      this.loading = false
      this.favoriteUsers = favorites.favoriteUsers
      this.favoriteSpaces = favorites.favoriteSpaces
    },
    showSpaces () {
      this.spacesIsVisible = true
      this.userDetailsIsNotVisible()
    },
    hideSpaces () {
      this.spacesIsVisible = false
      this.userDetailsIsNotVisible()
    },
    open (item) {
      this.userDetailsIsNotVisible()
      if (this.spacesIsVisible) {
        this.$store.dispatch('currentSpace/changeSpace', { space: item, isRemote: true })
      } else {
        this.openedUser = item
        this.userDetailsIsVisible = true
      }
    },
    itemIsOpened (item) {
      let opened
      if (this.spacesIsVisible) {
        opened = this.$store.state.currentSpace
      } else {
        opened = this.openedUser
      }
      return item.id === opened.id
    },
    remove (item) {
      let type
      if (this.spacesIsVisible) {
        type = 'space'
      } else {
        type = 'user'
      }
      this.$store.dispatch('currentUser/removeFavorite', { type, item })
    },
    userDetailsIsNotVisible () {
      this.userDetailsIsVisible = false
      this.openedUser = {}
    }
  },
  watch: {
    visible (visible) {
      this.userDetailsIsNotVisible()
      if (visible) {
        this.getFavorites()
      }
    }
  }

}
</script>

<style lang="stylus">
.favorites
  > .results-section
    border-top 1px solid var(--primary)
    border-top-left-radius 0
    border-top-right-radius 0
    padding-top 4px
    > ul
      li
        justify-content space-between
        button
          margin-left auto
        .name
          white-space wrap
          max-width calc(100% - 32px)
        .badge
          max-width calc(100% - 32px)

</style>
