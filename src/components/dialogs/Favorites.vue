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
      p Spaces and people you favorite can be found here
      p(v-if="loading")
        Loader(:visible="loading")

  section.results-section(v-if="!isEmpty")
    template(v-if="spacesIsVisible")
      SpaceList(:spaces="favoriteSpaces" :showUser="true" @selectSpace="changeSpace")
    template(v-if="!spacesIsVisible")
      UserList(:users="favoriteUsers" :selectedUser="selectedUser" @selectSpace="showUserDetails")
      UserDetails(:visible="userDetailsIsVisible" :user="selectedUser" :userDetailsPosition="userDetailsPosition")

</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import UserList from '@/components/UserList.vue'
import UserDetails from '@/components/dialogs/UserDetails.vue'

export default {
  name: 'Favorites',
  components: {
    Loader,
    UserDetails,
    SpaceList,
    UserList
  },
  props: {
    visible: Boolean,
    loading: Boolean
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
    isEmpty () {
      const noSpaces = this.spacesIsVisible && !this.favoriteSpaces.length
      const noPeople = !this.spacesIsVisible && !this.favoriteUsers.length
      if (noSpaces || noPeople) { return true }
      return false
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
      const dialogRect = this.$refs.dialog.getBoundingClientRect()
      const targetRect = event.target.getBoundingClientRect()
      this.userDetailsIsNotVisible()
      this.userDetailsPosition = {
        top: Math.min(targetRect.y - dialogRect.y, 67) + 'px',
        bottom: 'initial'
      }
      this.selectedUser = user
      this.userDetailsIsVisible = true
    },
    userDetailsIsNotVisible () {
      this.userDetailsIsVisible = false
      this.selectedUser = {}
    }
  },
  watch: {
    visible (visible) {
      this.userDetailsIsNotVisible()
    }
  }
}
</script>

<style lang="stylus">
.favorites
  .user-details
    left 50%

</style>
