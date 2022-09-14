<template lang="pug">
dialog.favorites.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog")
  section
    .row
      .segmented-buttons
        button(@click.left.stop="showSpaces" :class="{ active: spacesIsVisible }")
          span Spaces
          Loader(:visible="loading")
        button(@click.left.stop="hideSpaces" :class="{ active: !spacesIsVisible }")
          span People
          Loader(:visible="loading")
      //- Filter
      .button-wrap
        button(v-if="spacesIsVisible" @click.left.stop="toggleFavoritesFiltersIsVisible" :class="{ active: favoritesFiltersIsVisible || dialogFavoritesFilters }")
          img.icon(src="@/assets/filter.svg")
        FavoritesFilters(:visible="favoritesFiltersIsVisible")

    template(v-if="isEmpty")
      p Spaces and people you {{' '}}
        img.icon(src="@/assets/heart.svg")
        span can be found here.
      p
        img.icon(src="@/assets/heart.svg")
        span Spaces to know when they've been updated

      p(v-if="loading")
        Loader(:visible="loading")

  section.results-section(v-if="!isEmpty")
    template(v-if="spacesIsVisible")
      SpaceList(:spaces="favoriteSpacesOrderedByEdited" :showUser="true" @selectSpace="changeSpace")
    template(v-if="!spacesIsVisible")
      UserList(:users="favoriteUsers" :selectedUser="userDetailsSelectedUser" @selectUser="toggleUserDetails" :isClickable="true")

</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import UserList from '@/components/UserList.vue'
import FavoritesFilters from '@/components/dialogs/FavoritesFilters.vue'
import utils from '@/utils.js'

export default {
  name: 'Favorites',
  components: {
    Loader,
    SpaceList,
    UserList,
    FavoritesFilters
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spacesIsVisible: true,
      userDetailsPosition: {},
      favoritesFiltersIsVisible: false
    }
  },
  computed: {
    userDetailsIsVisible () { return this.$store.state.userDetailsIsVisible },
    userDetailsSelectedUser () {
      if (!this.userDetailsIsVisible) { return }
      return this.$store.state.userDetailsUser
    },
    dialogFavoritesFilters () { return this.$store.state.currentUser.dialogFavoritesFilters },
    currentUser () { return this.$store.state.currentUser },
    favoriteUsers () { return this.$store.state.currentUser.favoriteUsers },
    favoriteSpaces () {
      let spaces = this.$store.state.currentUser.favoriteSpaces
      if (this.dialogFavoritesFilters === 'currentUser') {
        spaces = spaces.filter(space => space.userId === this.currentUser.id)
      } else if (this.dialogFavoritesFilters === 'otherUsers') {
        spaces = spaces.filter(space => space.userId !== this.currentUser.id)
      }
      return spaces
    },
    loading () { return !this.$store.state.hasRestoredFavorites },
    isEmpty () {
      const noSpaces = this.spacesIsVisible && !this.favoriteSpaces.length
      const noPeople = !this.spacesIsVisible && !this.favoriteUsers.length
      if (noSpaces || noPeople) { return true }
      return false
    },
    favoriteSpacesOrderedByEdited () {
      let spaces = utils.clone(this.favoriteSpaces)
      spaces = spaces.map(space => {
        space.editedAt = space.editedAt || space.updatedAt || space.createdAt
        space.editedAt = new Date(space.editedAt)
        return space
      })
      spaces = spaces.sort((a, b) => b.editedAt - a.editedAt)
      return spaces
    }
  },
  methods: {
    toggleFavoritesFiltersIsVisible () {
      const isVisible = this.favoritesFiltersIsVisible
      this.closeDialogs()
      this.favoritesFiltersIsVisible = !isVisible
    },
    showSpaces () {
      this.spacesIsVisible = true
      this.closeDialogs()
    },
    hideSpaces () {
      this.spacesIsVisible = false
      this.closeDialogs()
    },
    changeSpace (space) {
      const spaceUser = space.user || space.users[0]
      const isSpaceUser = spaceUser.id === this.currentUser.id
      const isNotSignedIn = !this.$store.getters['currentUser/isSignedIn']
      if (isSpaceUser && isNotSignedIn) {
        this.$store.dispatch('currentSpace/changeSpace', { space })
      } else {
        this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
      }
    },
    toggleUserDetails (event, user) {
      this.closeDialogs()
      this.showUserDetails(event, user)
    },
    showUserDetails (event, user) {
      let element = event.target
      let options = { element }
      let position = utils.childDialogPositionFromParent(options)
      this.$store.commit('userDetailsUser', user)
      this.$store.commit('userDetailsPosition', position)
      this.$store.commit('userDetailsIsVisible', true)
      // offset position
      this.$nextTick(() => {
        const child = document.querySelector('.user-details')
        const rect = child.getBoundingClientRect()
        options = { element, offsetX: 100, offsetY: -(rect.height + 8) }
        position = utils.childDialogPositionFromParent(options)
        this.$store.commit('userDetailsPosition', position)
      })
    },
    closeDialogs () {
      this.favoritesFiltersIsVisible = false
      this.$store.commit('userDetailsIsVisible', false)
    },
    async updateFavorites () {
      await this.$store.dispatch('currentUser/restoreUserFavorites')
    },
    updateFavoriteSpaceIsEdited () {
      const spaces = this.favoriteSpaces.filter(space => space.isEdited)
      if (!spaces.length) { return }
      spaces.forEach(space => {
        this.$store.commit('currentUser/updateFavoriteSpaceIsEdited', space.id)
      })
      this.$store.dispatch('api/addToQueue', {
        name: 'updateUserVisitSpaces',
        body: spaces
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.closeDialogs()
        this.updateFavorites()
      } else {
        this.updateFavoriteSpaceIsEdited()
      }
    }
  }
}
</script>

<style lang="stylus">
.favorites
  @media(max-width 370px)
    left -40px
  .user-details
    left 50%
</style>
