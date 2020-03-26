<template lang="pug">
.favorites(v-if="visible" :open="visible" @click.stop="userDetailsIsNotVisible")
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

  section.results-section(v-if="!shouldShowDescription")
    template(v-if="spacesIsVisible")
      .filter-wrap(v-if="isManySpaces")
        img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
        input(placeholder="Search" v-model="spaceFilter" ref="filterInput")
        button.borderless.clear-input-wrap(@click="clearFilter")
          img.icon(src="@/assets/add.svg")
      SpaceList(:spaces="spacesFiltered" :showUser="true" :selectedSpace="currentSpace" @selectSpace="changeSpace")

    template(v-if="!spacesIsVisible")
      ul.results-list
        template(v-for="(user in favoriteUsers")
          li(:key="user.id" @click.stop="showUserDetails(user)" tabindex="0" v-on:keyup.stop.enter="showUserDetails(user)" :class="{ active: userIsSelected(user) }")
            .name(v-if="spacesIsVisible") {{user.name}}
            .badge(v-else :style="{background: user.color}")
              User(:user="user" :isClickable="false")
              span {{user.name}}
      UserDetails(:visible="userDetailsIsVisible" :user="selectedUser")
</template>

<script>
import fuzzy from 'fuzzy'

import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'

export default {
  name: 'Favorites',
  components: {
    Loader,
    User: () => import('@/components/User.vue'),
    UserDetails: () => import('@/components/dialogs/UserDetails.vue'),
    SpaceList
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spacesIsVisible: true,
      userDetailsIsVisible: false,
      selectedUser: {},
      filter: '',
      filteredSpaces: []
    }
  },
  computed: {
    favoriteUsers () { return this.$store.state.currentUser.favoriteUsers },
    favoriteSpaces () { return this.$store.state.currentUser.favoriteSpaces },
    loading () { return this.$store.state.isLoadingUserFavorites },
    currentSpace () { return this.$store.state.currentSpace },
    isManySpaces () { return Boolean(this.favoriteSpaces.length >= 5) },
    shouldShowDescription () {
      const noSpaces = this.spacesIsVisible && !this.favoriteSpaces.length
      const noPeople = !this.spacesIsVisible && !this.favoriteUsers.length
      if (noSpaces || noPeople) { return true }
      return false
    },
    spaceFilter: {
      get () {
        return this.filter
      },
      set (newValue) {
        this.filter = newValue
        const options = {
          pre: '',
          post: '',
          extract: (space) => {
            return space.name
          }
        }
        const filtered = fuzzy.filter(this.filter, this.favoriteSpaces, options)
        const spaces = filtered.map(space => {
          return space.original
        })
        this.filteredSpaces = spaces
      }
    },
    spacesFiltered () {
      if (this.filter) {
        return this.filteredSpaces
      } else {
        return this.favoriteSpaces
      }
    }

  },
  methods: {
    // async getFavorites () {
    //   if (this.loading) { return }
    //   this.loading = true
    //   const favorites = await this.$store.dispatch('api/getUserFavorites')
    //   this.loading = false
    //   this.favoriteUsers = favorites.favoriteUsers
    //   this.favoriteSpaces = favorites.favoriteSpaces
    // },
    focusFilterInput () {
      const element = this.$refs.filterInput
      element.focus()
      element.setSelectionRange(0, 0)
    },
    clearFilter () {
      this.filter = ''
    },
    showSpaces () {
      this.spacesIsVisible = true
      this.userDetailsIsNotVisible()
    },
    hideSpaces () {
      this.spacesIsVisible = false
      this.userDetailsIsNotVisible()
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space })
    },
    showUserDetails (user) {
      this.selectedUser = user
      this.userDetailsIsVisible = true
    },
    userIsSelected (user) {
      return this.selectedUser.id === user.id
    },
    userDetailsIsNotVisible () {
      this.userDetailsIsVisible = false
      this.selectedUser = {}
    }
  },
  watch: {
    visible (visible) {
      this.userDetailsIsNotVisible()
      // todo if (visible) {
      //   this.$store.dispatch('currentUser/restoreUserFavorites', currentUser)
      // }
    }
  }

}
</script>

<style lang="stylus">
</style>
