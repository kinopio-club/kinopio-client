<template lang="pug">
dialog.favorites.narrow(v-if="visible" :open="visible" @click.left.stop="userDetailsIsNotVisible" ref="dialog")
  section
    .segmented-buttons
      button(@click.left.stop="showSpaces" :class="{ active: spacesIsVisible }")
        span Spaces
        Loader(:visible="loading")
      button(@click.left.stop="hideSpaces" :class="{ active: !spacesIsVisible }")
        span People
        Loader(:visible="loading")
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
      UserList(:users="favoriteUsers" :selectedUser="selectedUser" @selectUser="showUserDetails" :isClickable="true")
      UserDetails(:visible="userDetailsIsVisible" :user="selectedUser" :userDetailsPosition="userDetailsPosition")

</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import UserList from '@/components/UserList.vue'
import UserDetails from '@/components/dialogs/UserDetails.vue'
import utils from '@/utils.js'

export default {
  name: 'Favorites',
  components: {
    Loader,
    UserDetails,
    SpaceList,
    UserList
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spacesIsVisible: true,
      userDetailsIsVisible: false,
      selectedUser: {},
      userDetailsPosition: {}
    }
  },
  computed: {
    favoriteUsers () { return this.$store.state.currentUser.favoriteUsers },
    favoriteSpaces () { return this.$store.state.currentUser.favoriteSpaces },
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
    showSpaces () {
      this.spacesIsVisible = true
      this.userDetailsIsNotVisible()
    },
    hideSpaces () {
      this.spacesIsVisible = false
      this.userDetailsIsNotVisible()
    },
    changeSpace (space) {
      const spaceUser = space.user || space.users[0]
      const isSpaceUser = spaceUser.id === this.$store.state.currentUser.id
      const isNotSignedIn = !this.$store.getters['currentUser/isSignedIn']
      if (isSpaceUser && isNotSignedIn) {
        this.$store.dispatch('currentSpace/changeSpace', { space })
      } else {
        this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
      }
    },
    showUserDetails (event, user) {
      this.userDetailsIsNotVisible()
      this.selectedUser = user
      this.userDetailsIsVisible = true
      this.$nextTick(() => {
        const dialogRect = this.$refs.dialog.getBoundingClientRect()
        const targetRect = event.target.getBoundingClientRect()
        const userDetailsRect = document.querySelector('dialog.user-details').getBoundingClientRect()
        const viewportHeight = this.$store.state.viewportHeight
        let dialogPositionTop = targetRect.y - dialogRect.y
        if (userDetailsRect.y + userDetailsRect.height > viewportHeight) {
          dialogPositionTop = dialogPositionTop - userDetailsRect.height
        }
        this.userDetailsPosition = {
          top: dialogPositionTop + 'px',
          bottom: 'initial'
        }
      })
    },
    userDetailsIsNotVisible () {
      this.userDetailsIsVisible = false
      this.selectedUser = {}
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
        this.userDetailsIsNotVisible()
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
  .user-details
    left 50%

</style>
