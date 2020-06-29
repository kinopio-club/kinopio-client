<template lang="pug">
dialog.narrow.user-details(v-if="visible" :open="visible" @click.stop="closeDialogs" :class="{'right-side': detailsOnRight}" :style="{top: positionTop}")

  //- Other User
  section(v-if="!isCurrentUser")
    .user-info
      .row
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id" :shouldCloseAllDialogs="false")
        p.name {{user.name}}
    .row.badges(v-if="user.isSpectator || user.isUpgraded")
      .badge.status(v-if="user.isSpectator") Spectator
      .badge.success(v-if="user.isUpgraded") Upgraded

  //- Current User
  section(v-if="isCurrentUser")
    .row
      .button-wrap
        button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{ background: userColor }")
        ColorPicker(:currentColor="userColor" :visible="colorPickerIsVisible" @selectedColor="updateUserColor")
      input.name(placeholder="What's your name?" v-model="userName" name="Name")
    .row.badges(v-if="user.isSpectator || user.isUpgraded")
      .badge.status(v-if="user.isSpectator") Spectator
      .badge.success(v-if="user.isUpgraded") Upgraded

  section.upgrade(v-if="isCurrentUser && !currentUserIsUpgraded")
    p {{cardsCreatedCount}}/{{cardsCreatedLimit}} cards created
    progress(:value="cardsCreatedCount" :max="cardsCreatedLimit")
    .button-wrap
      button(@click.stop="toggleUpgradeUserIsVisible" :class="{active: upgradeUserIsVisible}")
        span Upgrade for Unlimited
      UpgradeUser(:visible="upgradeUserIsVisible" @closeDialog="closeDialogs")
    p
      .badge.info $4/month
    .row
      a(href="https://help.kinopio.club/posts/how-much-does-kinopio-cost")
        button More Info →

  section(v-if="isCurrentUser")
    .button-wrap
      button(@click.stop="toggleUserSettingsIsVisible" :class="{active: userSettingsIsVisible}")
        span Settings
      UserSettings(:user="user" :visible="userSettingsIsVisible" @removeUser="signOut")
    button(v-if="currentUserIsSignedIn" @click="signOut")
      img.icon.moon(src="@/assets/moon.svg")
      span Sign Out
    button(v-else @click="triggerSignUpOrInIsVisible")
      span Sign Up or In

  //- Other User
  section(v-if="!isCurrentUser && userIsSignedIn")
    .button-wrap
      button(@click.stop="getUserSpaces" :class="{active: loadingUserspaces || spacePickerIsVisible}")
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id" :shouldCloseAllDialogs="false")
        span Spaces
        Loader(:visible="loadingUserspaces")
      SpacePicker(:visible="spacePickerIsVisible" :loading="loadingUserspaces" :userSpaces="userSpaces" @selectSpace="changeSpace")
    .button-wrap
      label(:class="{active: isFavoriteUser}" @click.prevent="toggleIsFavoriteUser" @keydown.stop.enter="toggleIsFavoriteUser")
        input(type="checkbox" v-model="isFavoriteUser")
        span Favorite
    .badge.danger.error-message(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

  //- Collaborator
  section(v-if="isCollaborator && currentUserIsSpaceMember")
    template(v-if="isCurrentUser && isCollaborator")
      button(@click.stop="removeCollaborator")
        img.icon(src="@/assets/remove.svg")
        span Leave Space
    template(v-if="!isCurrentUser")
      button(@click.stop="removeCollaborator")
        img.icon(src="@/assets/remove.svg")
        span Remove Collaborator
</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import UserSettings from '@/components/dialogs/UserSettings.vue'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import UpgradeUser from '@/components/dialogs/UpgradeUser.vue'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

export default {
  name: 'UserDetails',
  components: {
    ColorPicker,
    UserSettings,
    User: () => import('@/components/User.vue'),
    Loader,
    SpacePicker,
    UpgradeUser
  },
  props: {
    user: Object,
    detailsOnRight: Boolean,
    visible: Boolean,
    userDetailsPosition: Object,
    userDetailsIsFromList: Boolean
  },
  data () {
    return {
      colorPickerIsVisible: false,
      userSettingsIsVisible: false,
      upgradeUserIsVisible: false,
      loadingUserspaces: false,
      spacePickerIsVisible: false,
      userSpaces: [],
      cardsCreatedLimit: 150,
      error: {
        unknownServerError: false
      }
    }
  },
  computed: {
    cardsCreatedCount () { return this.$store.state.currentUser.cardsCreatedCount },
    userColor () { return this.user.color },
    userIsMember () { return Boolean(this.$store.getters['currentSpace/memberById'](this.user.id)) },
    userIsUpgraded () { return this.user.isUpgraded },
    isCurrentUser () { return this.$store.getters['currentUser/isCurrentUser'](this.user) },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
    userIsSignedIn () {
      if (this.user.isSignedIn === false) {
        return false
      }
      return true
    },
    userName: {
      get () {
        return this.user.name
      },
      set (newName) {
        this.$store.dispatch('currentUser/name', newName)
      }
    },
    isFavoriteUser () {
      const favoriteUsers = this.$store.state.currentUser.favoriteUsers
      const isFavoriteUser = Boolean(favoriteUsers.find(user => {
        return user.id === this.user.id
      }))
      return isFavoriteUser
    },
    isCollaborator () {
      const currentSpace = this.$store.state.currentSpace
      const collaborators = currentSpace.collaborators || []
      return Boolean(collaborators.find(collaborator => {
        return collaborator.id === this.user.id
      }))
    },
    currentUserIsSpaceMember () {
      return this.$store.getters['currentUser/isSpaceMember']()
    },
    positionTop () {
      if (utils.objectHasKeys(this.userDetailsPosition)) {
        return this.userDetailsPosition.top
      } else {
        return null
      }
    }
  },
  methods: {
    toggleIsFavoriteUser () {
      if (this.isFavoriteUser) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'user', item: this.user })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'user', item: this.user })
      }
    },
    toggleUserSettingsIsVisible () {
      const isVisible = this.userSettingsIsVisible
      this.closeDialogs()
      this.userSettingsIsVisible = !isVisible
    },
    toggleUpgradeUserIsVisible () {
      const isVisible = this.upgradeUserIsVisible
      this.closeDialogs()
      this.upgradeUserIsVisible = !isVisible
    },
    toggleColorPicker () {
      const isVisible = this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
      this.userSettingsIsVisible = false
      this.spacePickerIsVisible = false
      this.upgradeUserIsVisible = false
    },
    updateUserColor (newColor) {
      this.$store.dispatch('currentUser/color', newColor)
    },
    signOut () {
      cache.removeAll()
      window.history.replaceState({}, 'Kinopio', '/')
      location.reload()
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    async getUserSpaces () {
      this.error.unknownServerError = false
      if (this.loadingUserspaces) { return }
      if (this.spacePickerIsVisible) {
        this.closeDialogs()
        return
      }
      this.loadingUserspaces = true
      this.spacePickerIsVisible = true
      try {
        const publicUser = await this.$store.dispatch('api/getPublicUser', this.user)
        this.userSpaces = publicUser.spaces
      } catch (error) {
        this.error.unknownServerError = true
        this.clearUserSpaces()
      }
      this.loadingUserspaces = false
    },
    clearUserSpaces () {
      this.loadingUserspaces = false
      this.userSpaces = []
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    async removeCollaborator () {
      const user = this.user
      this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
      if (!this.userDetailsIsFromList) {
        this.$store.dispatch('closeAllDialogs')
      }
      this.$emit('removedCollaborator', user)
    }
  },
  watch: {
    visible (visible) {
      this.closeDialogs()
      this.clearUserSpaces()
    },
    userDetailsPosition (position) {
      this.closeDialogs()
    }
  }
}
</script>

<style lang="stylus">
.user-details
  cursor: initial
  top calc(100% - 8px)
  &.right-side
    left initial
    right 8px
  .name
    margin-left 6px
  .error-message
    margin-top 10px
  .moon
    vertical-align -2px
  .badges
    // margin-top 8px

  .upgrade
    progress
      margin-top 2px
      margin-bottom 10px
    .button-wrap + .row,
    .row + .button-wrap
      margin-top 10px
    .badge
      display inline-block

  .upgrade-user
    max-height calc(100vh - 175px)

.user-info
  display: flex
  .row
    align-items center
  p
    margin 0

</style>
