<template lang="pug">
dialog.narrow.user-details(v-if="visible" :open="visible" @click.stop="closeDialogs" :class="{'right-side': detailsOnRight}")

  //- Other User
  section.user-info(v-if="!isCurrentUser")
    .row
      User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id" :shouldCloseAllDialogs="false")
      p.name {{user.name}}
  section(v-if="!isCurrentUser")
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
    .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

  //- Current User
  section(v-if="isCurrentUser")
    .row
      .button-wrap
        button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="backgroundColor")
        ColorPicker(:currentColor="userColor" :visible="colorPickerIsVisible" @selectedColor="updateUserColor")
      input.name(placeholder="What's your name?" v-model="userName" name="Name")
  section(v-if="isCurrentUser")
    .button-wrap
      button(@click.stop="toggleUserSettingsIsVisible" :class="{active: userSettingsIsVisible}") Settings
      UserSettings(:user="user" :visible="userSettingsIsVisible" @removeUser="signOut")
    button(v-if="isSignedIn" @click="signOut") Sign Out
    button(v-else @click="triggerSignUpOrInIsVisible") Sign Up or In

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import UserSettings from '@/components/dialogs/UserSettings.vue'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Favorites from '@/components/dialogs/Favorites.vue'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'

export default {
  name: 'UserDetails',
  components: {
    ColorPicker,
    UserSettings,
    User: () => import('@/components/User.vue'),
    Loader,
    SpacePicker,
    Favorites
  },
  props: {
    user: Object,
    detailsOnRight: Boolean,
    visible: Boolean
  },
  data () {
    return {
      colorPickerIsVisible: false,
      userSettingsIsVisible: false,
      loadingUserspaces: false,
      spacePickerIsVisible: false,
      userSpaces: [],
      error: {
        unknownServerError: false
      }
    }
  },
  computed: {
    // isBeta () {
    //   return this.$store.state.isBeta
    // },
    userColor () {
      return this.user.color
    },
    backgroundColor () {
      return {
        backgroundColor: this.userColor
      }
    },
    isCurrentUser () {
      return this.$store.getters['currentUser/isCurrentUser'](this.user)
    },
    isSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
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
      const isFavoriteUser = favoriteUsers.filter(user => user.id === this.user.id)
      return Boolean(isFavoriteUser.length)
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
    toggleColorPicker () {
      const isVisible = this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
      this.userSettingsIsVisible = false
      this.spacePickerIsVisible = false
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
      this.$store.commit('closeAllDialogs')
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
      this.$store.dispatch('currentSpace/changeSpace', space)
    }
  },
  watch: {
    visible (value) {
      this.closeDialogs()
      this.clearUserSpaces()
    }
  }
}
</script>

<style lang="stylus">
.user-details
  cursor: initial
  top calc(100% - 8px)
  .row
    margin 0
  &.right-side
    left initial
    right 8px
  .name
    margin-left 6px
  .danger
    margin-top 10px

.user-info
  display: flex
  .row
    align-items center
  p
    margin 0
</style>
