<template lang="pug">
dialog.narrow.user-details(v-if="visible" @keyup.stop :open="visible" @click.left.stop="closeDialogs" @keydown.stop :class="{'right-side': detailsOnRight}" :style="userDetailsPosition")

  //- Not Current User
  section(v-if="!isCurrentUser")
    .user-info
      .row
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id" :shouldCloseAllDialogs="false")
        p.name.user-details-name {{user.name}}
      .row(v-if="user.description")
        textarea(ref="description" :value="user.description" disabled)
      .row.website(v-if="user.website")
        p(v-if="!websiteUrl") {{user.website}}
        a(:href="websiteUrl" v-if="websiteUrl")
          span {{user.website}}
    UserBadges(:user="user")

  //- Current User
  template(v-if="isCurrentUser")
    section
      .row
        .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
            .current-color(:style="{ background: userColor }")
          ColorPicker(:currentColor="userColor" :visible="colorPickerIsVisible" @selectedColor="updateUserColor")
        input.name.user-details-name(placeholder="What's your name?" v-model="userName" name="Name" maxlength=100)
      .row
        textarea(ref="description" placeholder="Tell us about yourself" v-model="userDescription" name="Description" maxlength=220 rows="1")
      .row
        input(ref="website" placeholder="Website" v-model="userWebsite" name="Website" maxlength=200 rows="1")
        a(:href="websiteUrl" v-if="websiteUrl")
          button.inline-button
            img.icon.visit.arrow-icon(src="@/assets/visit.svg")
      UserBadges(:user="user")
      template(v-if="currentUserIsUpgraded")
        .button-wrap
          button(@click.left.stop="triggerDonateIsVisible")
            img.icon(src="@/assets/donate.svg")
            span Donate

    //- Unlimited cards from member
    section.upgrade(v-if="!currentUserIsUpgraded")
      p {{cardsCreatedCount}}/{{cardsCreatedLimit}} cards created
      progress(:value="cardsCreatedCount" :max="cardsCreatedLimit")
      .button-wrap(v-if="!isAddPage")
        button(@click.left.stop="triggerUpgradeUserIsVisible")
          span Upgrade for Unlimited
      .row(v-if="!isAppStoreView")
        p
          .badge.info $6/mo, $60/yr
        a(href="https://help.kinopio.club/posts/how-much-does-kinopio-cost")
          button Help →
      .row(v-if="spaceUserIsUpgraded")
        .badge.status
          p
            .badge-wrap
              .badge.inline-user-badge(:style="{background: spaceUser.color}")
                User(:user="spaceUser" :detailsOnRight="true" :isClickable="false")
                span {{spaceUser.name}}
            span is upgraded, so cards you create in this space won't change your card count

    section(v-if="!isAddPage")
      .button-wrap
        button(@click.left.stop="toggleUserSettingsIsVisible" :class="{active: userSettingsIsVisible}")
          span Settings
        UserSettings(:user="user" :visible="userSettingsIsVisible" @removeUser="signOut")
      button(v-if="currentUserIsSignedIn" @click.left="signOut")
        img.icon.moon(src="@/assets/moon.svg")
        span Sign Out
      button(v-else @click.left="triggerSignUpOrInIsVisible")
        span Sign Up or In

  //- Other User
  section(v-if="!isCurrentUser && userIsSignedIn && user.id")
    .button-wrap
      button(@click.left.stop="getUserSpaces" :class="{active: loadingUserspaces || spacePickerIsVisible}")
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id" :shouldCloseAllDialogs="false")
        span Spaces
        Loader(:visible="loadingUserspaces")
      SpacePicker(:visible="spacePickerIsVisible" :loading="loadingUserspaces" :user="user" :userSpaces="userSpaces" @selectSpace="changeSpace")
    .button-wrap
      label(:class="{active: isFavoriteUser}" @click.left.prevent="toggleIsFavoriteUser" @keydown.stop.enter="toggleIsFavoriteUser")
        input(type="checkbox" v-model="isFavoriteUser")
        img.icon(v-if="isFavoriteUser" src="@/assets/heart.svg")
        img.icon(v-else src="@/assets/heart-empty.svg")
        Loader(:visible="!hasRestoredFavorites")
    .badge.danger.error-message(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

  //- Collaborator
  section(v-if="isCollaborator && currentUserIsSpaceMember")
    template(v-if="isCurrentUser && isCollaborator")
      button(@click.left.stop="removeCollaborator")
        img.icon(src="@/assets/remove.svg")
        span Leave Space
    template(v-if="!isCurrentUser")
      button(@click.left.stop="removeCollaborator")
        img.icon(src="@/assets/remove.svg")
        span Remove Collaborator
</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import UserSettings from '@/components/dialogs/UserSettings.vue'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
import UserBadges from '@/components/UserBadges.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
import { defineAsyncComponent } from 'vue'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

export default {
  name: 'UserDetails',
  components: {
    ColorPicker,
    UserSettings,
    User,
    Loader,
    UserBadges,
    SpacePicker
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
      loadingUserspaces: false,
      spacePickerIsVisible: false,
      userSpaces: [],
      error: {
        unknownServerError: false
      }
    }
  },
  computed: {
    cardsCreatedCount () { return this.$store.state.currentUser.cardsCreatedCount || 0 },
    userColor () { return this.user.color },
    userIsMember () { return Boolean(this.$store.getters['currentSpace/memberById'](this.user.id)) },
    userIsUpgraded () { return this.user.isUpgraded },
    isCurrentUser () { return this.$store.getters['currentUser/isCurrentUser'](this.user) },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
    hasRestoredFavorites () { return this.$store.state.hasRestoredFavorites },
    cardsCreatedLimit () { return this.$store.state.cardsCreatedLimit },
    spaceUserIsUpgraded () { return this.$store.getters['currentSpace/spaceUserIsUpgraded'] },
    spaceUser () { return this.$store.state.currentSpace.users[0] },
    isAddPage () { return this.$store.state.isAddPage },
    isAppStoreView () { return this.$store.state.isAppStoreView },
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
      set (newValue) {
        this.updateUser({ name: newValue })
      }
    },
    userDescription: {
      get () {
        return this.user.description
      },
      set (newValue) {
        this.updateUser({ description: newValue })
        this.updateTextareaSize()
      }
    },
    userWebsite: {
      get () {
        return this.user.website
      },
      set (newValue) {
        this.updateUser({ website: newValue })
      }
    },
    websiteUrl () {
      if (!this.userWebsite) { return }
      const urls = utils.urlsFromString(this.userWebsite)
      if (!urls) { return }
      return urls[0]
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
    triggerUpgradeUserIsVisible () {
      this.$store.commit('closeAllDialogs', 'UserDetails.triggerUpgradeUserIsVisible')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    triggerDonateIsVisible () {
      this.$store.commit('closeAllDialogs', 'UserDetails.triggerDonateIsVisible')
      this.$store.commit('triggerDonateIsVisible')
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
    updateUserColor (newValue) {
      this.updateUser({ color: newValue })
    },
    updateUser (update) {
      this.$store.dispatch('currentUser/update', update)
    },
    updateTextareaSize () {
      this.$nextTick(() => {
        let textarea = this.$refs.description
        if (!textarea) { return }
        textarea.style.height = textarea.scrollHeight + 1 + 'px'
      })
    },
    signOut () {
      cache.removeAll()
      // clear history wipe state from vue-router
      window.history.replaceState({}, 'Kinopio', '/')
      location.reload()
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs', 'UserDetails.triggerSignUpOrInIsVisible')
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
        this.$store.commit('closeAllDialogs', 'UserDetails.removeCollaborator')
      }
      this.$emit('removedCollaborator', user)
    },
    async updateFavorites () {
      await this.$store.dispatch('currentUser/restoreUserFavorites')
    }
  },
  watch: {
    visible (visible) {
      this.closeDialogs()
      this.clearUserSpaces()
      this.updateFavorites()
      if (visible) {
        this.updateTextareaSize()
      }
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
  .user-details-name
    margin-left 6px
  .error-message
    margin-top 10px
  .moon
    vertical-align -2px
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

  .inline-user-badge
    display inline-flex !important

  textarea
    margin-bottom 0

  .inline-button
    margin-left 6px
    background-color var(--primary-background)
    cursor pointer
    &:hover
      background var(--secondary-hover-background)
    &:active
      background var(--secondary-active-background)

  .arrow-icon
    position absolute
    left 5px
    top 3.5px

.user-info
  .row
    align-items center
  p
    margin 0
  .website
    word-break break-all
    align-items flex-start
    .inline-button
      margin-top -1px
  textarea:disabled
    color var(--primary)
    -webkit-text-fill-color var(--primary)
    -webkit-opacity 1
</style>
