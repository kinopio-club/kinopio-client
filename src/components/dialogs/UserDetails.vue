<template lang="pug">
dialog.narrow.user-details(v-if="visible" @keyup.stop :open="visible" @click.left.stop="closeDialogs" @keydown.stop :style="styles" ref="dialog")

  //- Not Current User
  section(v-if="!isCurrentUser")
    .user-info
      .row
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id")
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
    section.current-user
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

    section(v-if="!isAddPage")
      .row
        .button-wrap
          button(@click.left.stop="toggleUserSettingsIsVisible" :class="{active: userSettingsIsVisible}")
            img.icon.settings(src="@/assets/settings.svg")
            span Settings
        button.danger(v-if="currentUserIsSignedIn" @click.left="signOut")
          img.icon.sign-out(src="@/assets/sign-out.svg")
          span Sign Out
        button(v-else @click.left="triggerSignUpOrInIsVisible")
          span Sign Up or In

  //- Other User
  section(v-if="!isCurrentUser && userIsSignedIn && user.id")
    .button-wrap
      button(@click.left.stop="getUserSpaces" :class="{active: loadingUserspaces || spacePickerIsVisible}")
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id")
        span Spaces
        Loader(:visible="loadingUserspaces")
      SpacePicker(:visible="spacePickerIsVisible" :loading="loadingUserspaces" :user="user" :userSpaces="userSpaces" @selectSpace="changeSpace")
    .button-wrap
      button(:class="{active: isFavoriteUser}" @click.left.prevent="toggleIsFavoriteUser" @keydown.stop.enter="toggleIsFavoriteUser")
        img.icon(v-if="isFavoriteUser" src="@/assets/heart.svg")
        img.icon(v-else src="@/assets/heart-empty.svg")
        span Follow
        Loader(:visible="isLoadingFavorites")
    .badge.danger.error-message(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

  //- Collaborator
  section(v-if="isCollaborator && currentUserIsSpaceMember")
    template(v-if="isCurrentUser && isCollaborator")
      button(@click.left.stop="removeCollaborator")
        img.icon.cancel(src="@/assets/add.svg")
        span Leave Space
    template(v-if="!isCurrentUser")
      button(@click.left.stop="removeCollaborator")
        img.icon.cancel(src="@/assets/add.svg")
        span Remove From Space
</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
import UserBadges from '@/components/UserBadges.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
import postMessage from '@/postMessage.js'
import { defineAsyncComponent } from 'vue'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

export default {
  name: 'UserDetails',
  components: {
    ColorPicker,
    User,
    Loader,
    UserBadges,
    SpacePicker,
    UserLabelInline
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerScrollUserDetailsIntoView' && this.visible) {
        this.scrollUserDetailsIntoView()
      }
    })
  },
  data () {
    return {
      colorPickerIsVisible: false,
      loadingUserspaces: false,
      spacePickerIsVisible: false,
      userSpaces: [],
      error: {
        unknownServerError: false
      }
    }
  },
  computed: {
    visible () { return this.$store.state.userDetailsIsVisible },
    user () { return this.$store.state.userDetailsUser },
    userDetailsPosition () { return this.$store.state.userDetailsPosition },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    styles () {
      let { x, y, shouldIgnoreZoom, transformOriginIsTopRight } = this.userDetailsPosition
      let zoom = this.spaceCounterZoomDecimal
      if (shouldIgnoreZoom) {
        zoom = 1
      }
      if (this.$store.state.isTouchDevice) {
        zoom = utils.pinchCounterZoomDecimal()
        if (zoom > 1) {
          x = x * zoom
          y = y * zoom
        }
      }
      const styles = {
        transform: `scale(${zoom})`,
        left: x + 'px',
        top: y + 'px'
      }
      if (transformOriginIsTopRight) {
        styles.transformOrigin = 'top right'
      }
      return styles
    },
    userColor () { return this.user.color },
    userIsMember () { return Boolean(this.$store.getters['currentSpace/memberById'](this.user.id)) },
    userIsUpgraded () { return this.user.isUpgraded },
    isCurrentUser () { return this.$store.getters['currentUser/isCurrentUser'](this.user) },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    isLoadingFavorites () { return this.$store.state.isLoadingFavorites },
    isAddPage () { return this.$store.state.isAddPage },
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
    currentUserIsSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    userSettingsIsVisible () { return this.$store.state.userSettingsIsVisible }
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
      const value = !this.$store.state.userSettingsIsVisible
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('userSettingsIsVisible', value)
    },
    toggleColorPicker () {
      const isVisible = this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
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
      postMessage.send({ name: 'onLogout' })
      cache.removeAll()
      // clear history wipe state from vue-router
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
      this.$store.dispatch('currentSpace/changeSpace', space)
    },
    async removeCollaborator () {
      const user = this.user
      this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
      this.$store.dispatch('closeAllDialogs')
    },
    scrollUserDetailsIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        utils.scrollIntoView({ element })
      })
    }
  },
  watch: {
    visible (visible) {
      this.closeDialogs()
      this.clearUserSpaces()
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
  cursor initial
  top calc(100% - 8px)
  position absolute
  .current-user
    .user-badges
      margin-top -10px
  .user-details-name
    margin-left 6px
  .error-message
    margin-top 10px
  .upgrade
    .badge
      display inline-block

  .upgrade-user
    max-height calc(100vh - 175px)

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
