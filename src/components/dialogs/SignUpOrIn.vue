<template lang="pug">
dialog.narrow.sign-up-or-in(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click.left="showSignUpVisible" :class="{active : signUpVisible}") Sign Up
      button(@click.left="hideSignUpVisible" :class="{active : !signUpVisible}") Sign In

  //- Sign Up
  section(v-if="signUpVisible")
    p Create an account to share your spaces and access them anywhere
    form(@submit.prevent="signUp")
      input(ref="email" type="email" autocomplete="email" placeholder="Email" required v-model="email" @input="clearErrors")
      .badge.info(v-if="error.accountAlreadyExists") An account with this email already exists, Sign In instead
      input(type="password" placeholder="Password" required @input="clearErrors" v-model="password")
      input(type="password" placeholder="Confirm Password" required @input="clearErrors")
      .badge.danger(v-if="error.passwordMatch") Passwords must match
      .badge.danger(v-if="error.passwordMatchesEmail") Password can't be from your email
      .badge.danger(v-if="error.passwordTooShort") Password must be longer than 4 characters
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      button(type="submit" :class="{active : loading.signUpOrIn}" tabindex="0")
        span Sign Up
        Loader(:visible="loading.signUpOrIn")

  //- Sign In
  section(v-else)
    p Welcome back
    form(@submit.prevent="signIn")
      input.email(ref="email" type="email" autocomplete="email" placeholder="Email" required v-model="email" @input="clearErrors")
      input(type="password" placeholder="Password" required v-model="password" @input="clearErrors")
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      .badge.danger(v-if="error.signInCredentials") Incorrect email or password
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
      button(type="submit" :class="{active : loading.signUpOrIn}" tabindex="0")
        span Sign In
        Loader(:visible="loading.signUpOrIn")

  //- Privacy Policy
  section(v-if="signUpVisible")
    .button-wrap
      a(href="https://help.kinopio.club/posts/privacy-policy")
        button
          span Privacy Policy and TOS{{' '}}
          img.icon.visit(src="@/assets/visit.svg")

  //- Forgot Password
  section.forgot-password(v-else)
    button(@click.left="toggleResetVisible" :class="{active : resetVisible}")
      span Forgot Password?
    div(v-show="resetVisible")
      form.reset-form(@submit.prevent="resetPassword")
        input(type="email" placeholder="Email" ref="resetPasswordEmail" required @input="clearErrors")
        button(type="submit" :class="{active : loading.resetPassword || resetSuccess}")
          span Reset Password
          Loader(:visible="loading.resetPassword")
      .badge.success(v-if="resetSuccess") Password Reset Email Sent
      .badge.danger(v-if="error.resetUserEmailNotFound") A user with that that email address wasn't found. Try another?
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
      p.success-message(v-if="resetSuccess") If you don't see the email, please check your spam folder, or contact support
</template>

<script>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'

import inboxSpace from '@/data/inbox.json'
import helloSpace from '@/data/hello.json'

import { nanoid } from 'nanoid'

let shouldLoadLastSpace
let sessionToken

export default {
  name: 'SignUpOrIn',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      email: '',
      password: '',
      signUpVisible: true,
      resetVisible: false,
      error: {
        passwordMatch: false,
        unknownServerError: false,
        accountAlreadyExists: false,
        signInCredentials: false,
        tooManyAttempts: false,
        passwordTooShort: false,
        passwordMatchesEmail: false,
        resetUserEmailNotFound: false
      },
      loading: {
        signUpOrIn: false,
        resetPassword: false
      },
      resetSuccess: false
    }
  },
  methods: {
    clearErrors () {
      for (const errorType in this.error) {
        this.error[errorType] = false
      }
      this.resetSuccess = false
    },

    hasErrors () {
      let hasErrors
      for (const errorType in this.error) {
        if (this.error[errorType] === true) {
          hasErrors = true
        }
      }
      return hasErrors
    },

    showSignUpVisible () {
      this.signUpVisible = true
      this.clearErrors()
      this.focusEmail()
    },

    hideSignUpVisible () {
      this.signUpVisible = false
      this.resetVisible = false
      this.clearErrors()
      this.focusEmail()
    },

    toggleResetVisible () {
      this.resetVisible = !this.resetVisible
    },

    isSuccess (response) {
      const success = [200, 201, 202, 204]
      return Boolean(success.includes(response.status))
    },

    async handleErrors (response) {
      this.loading.signUpOrIn = false
      this.loading.resetPassword = false
      this.error.signInCredentials = false
      this.error.accountAlreadyExists = false
      this.error.tooManyAttempts = false
      this.error.unknownServerError = false
      if (!response) {
        this.error.unknownServerError = true
        return
      }
      if (response.type === 'unique violation') {
        this.error.accountAlreadyExists = true
      } else if (response.status === 401) {
        this.error.signInCredentials = true
      } else if (response.status === 429) {
        this.error.tooManyAttempts = true
      } else {
        this.error.unknownServerError = true
      }
    },

    isPasswordMatchesEmail (email, password) {
      const emailNameIndex = email.indexOf('@')
      const name = email.slice(0, emailNameIndex)
      if (email === password || name === password) {
        this.error.passwordMatchesEmail = true
      } else {
        return true
      }
    },

    isSignUpPasswordsMatch (password, confirmPassword) {
      if (password !== confirmPassword) {
        this.error.passwordMatch = true
      } else {
        return true
      }
    },

    isSignUpPasswordTooShort (password) {
      if (password.length < 4) {
        this.error.passwordTooShort = true
      } else {
        return true
      }
    },

    checkUserAttributes () {
      const appleToken = this.$store.state.currentUser.appleAppAccountToken
      if (!appleToken) {
        this.$store.commit('currentUser/updateAppleAppAccountToken')
      }
    },

    async signUp (event) {
      if (this.loading.signUpOrIn) { return }
      const email = event.target[0].value.toLowerCase()
      const password = event.target[1].value
      const confirmPassword = event.target[2].value
      this.checkUserAttributes()
      let currentUser = utils.clone(this.$store.state.currentUser)
      if (!this.isPasswordMatchesEmail(email, password)) { return }
      if (!this.isSignUpPasswordTooShort(password)) { return }
      if (!this.isSignUpPasswordsMatch(password, confirmPassword)) { return }
      this.loading.signUpOrIn = true
      const response = await this.$store.dispatch('api/signUp', { email, password, currentUser, sessionToken })
      const newUser = await response.json()
      if (this.isSuccess(response)) {
        this.$store.commit('clearAllNotifications', false)
        this.$store.commit('currentUser/replaceState', newUser)
        this.updateSpacesUserId()
        this.updateCurrentSpaceWithNewUserId(currentUser, newUser)
        await this.$store.dispatch('api/createSpaces')
        this.notifySignedIn()
        this.addCollaboratorToInvitedSpaces()
        const currentSpace = this.$store.state.currentSpace
        this.$store.commit('triggerUpdateWindowHistory')
        this.$store.dispatch('themes/restore')
      } else {
        await this.handleErrors(newUser)
      }
    },

    async signIn (event) {
      if (this.loading.signUpOrIn) { return }
      const previousUser = utils.clone(this.$store.state.currentUser)
      const email = event.target[0].value.toLowerCase()
      const password = event.target[1].value
      this.loading.signUpOrIn = true
      const response = await this.$store.dispatch('api/signIn', { email, password })
      const result = await response.json()
      this.loading.signUpOrIn = false
      if (this.isSuccess(response)) {
        this.$store.commit('isLoadingSpace', true)
        this.$store.commit('addNotification', { message: 'Signing In…' })
        // update user to remote user
        this.$store.commit('currentUser/updateUser', result)
        // update local spaces to remote user
        this.removeUneditedSpace('Hello Kinopio')
        this.removeUneditedSpace('Inbox')
        this.updateSpacesUserId()
        await this.$store.dispatch('api/createSpaces')
        this.notifySignedIn()
        // add new spaces from remote
        const spaces = await this.$store.dispatch('api/getUserSpaces')
        cache.addSpaces(spaces)
        this.updateCurrentSpace(previousUser)
        this.$store.commit('clearAllNotifications', false)
        this.addCollaboratorToInvitedSpaces()
        this.$store.commit('triggerSpaceDetailsVisible')
        this.$store.commit('isLoadingFavorites', true)
        this.$store.dispatch('currentUser/restoreUserFavorites')
        this.$store.commit('triggerUpdateNotifications')
        this.$store.dispatch('themes/restore')
        if (shouldLoadLastSpace) {
          this.$store.dispatch('currentSpace/loadLastSpace')
          this.$store.commit('triggerUpdateWindowHistory')
        }
        this.$store.commit('isLoadingSpace', false)
      } else {
        await this.handleErrors(result)
      }
    },

    updateSpacesUserId () {
      const userId = this.$store.state.currentUser.id
      const spaces = cache.getAllSpaces()
      const newSpaces = utils.updateSpacesUserId(userId, spaces)
      newSpaces.forEach(space => {
        cache.saveSpace(space)
      })
    },

    updateCurrentSpaceWithNewUserId (previousUser, newUser) {
      const currentSpace = this.$store.state.currentSpace
      const userIsSpaceUser = this.$store.getters['currentUser/spaceUserPermission'](currentSpace) === 'user'
      if (!userIsSpaceUser) { return }
      this.$store.commit('currentSpace/removeUserFromSpace', previousUser)
      this.$store.commit('currentSpace/addUserToSpace', newUser)
    },

    updateCurrentSpace (previousUser) {
      const currentUser = this.$store.state.currentUser
      const currentSpace = this.$store.state.currentSpace
      this.$store.commit('triggerUpdateWindowHistory')
      this.$store.commit('currentSpace/removeUserFromSpace', previousUser)
      const userIsSpaceUser = this.$store.getters['currentUser/spaceUserPermission'](currentSpace) === 'user'
      if (userIsSpaceUser) {
        this.$store.commit('currentSpace/addUserToSpace', currentUser)
      }
    },

    removeUneditedSpace (spaceName) {
      let currentSpace = cache.getSpaceByName(spaceName)
      let space
      if (spaceName === 'Hello Kinopio') {
        space = helloSpace
      } else if (spaceName === 'Inbox') {
        space = inboxSpace
      }
      const cardNames = space.cards.map(card => card.name)
      let spaceIsEdited
      currentSpace.cards.forEach(card => {
        const cardIsNew = !cardNames.includes(card.name)
        if (cardIsNew) {
          spaceIsEdited = true
        }
      })
      if (!spaceIsEdited) {
        console.log('signIn removeUneditedSpace', spaceName)
        cache.deleteSpace(currentSpace)
        shouldLoadLastSpace = true
      }
    },

    addCollaboratorToCurrentSpace () {
      const invitedSpaceIds = cache.invitedSpaces().map(space => space.id)
      const currentSpace = this.$store.state.currentSpace
      const currentUser = this.$store.state.currentUser
      if (invitedSpaceIds.includes(currentSpace.id)) {
        this.$store.commit('currentSpace/addCollaboratorToSpace', currentUser)
        this.$store.commit('broadcast/close')
        this.$store.commit('broadcast/joinSpaceRoom')
      }
    },

    addCollaboratorToInvitedSpaces () {
      let invitedSpaces = cache.invitedSpaces()
      invitedSpaces = invitedSpaces.map(space => {
        space.userId = this.$store.state.currentUser.id
        return space
      })
      this.$store.dispatch('api/addToQueue', { name: 'addCollaboratorToSpaces', body: invitedSpaces })
      this.addCollaboratorToCurrentSpace()
    },

    notifySignedIn () {
      this.loading.signUpOrIn = false
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('removeNotificationByMessage', 'Signing In…')
      this.$store.commit('addNotification', { message: 'Signed In', type: 'success' })
    },

    async resetPassword (event) {
      if (this.loading.resetPassword || this.resetSuccess) { return }
      const email = event.target[0].value.toLowerCase()
      this.loading.resetPassword = true
      const response = await this.$store.dispatch('api/resetPassword', email)
      this.loading.resetPassword = false
      if (response.status === 404) {
        this.error.resetUserEmailNotFound = true
      } else if (response.status === 429) {
        this.error.tooManyAttempts = true
      } else {
        this.resetSuccess = true
      }
    },

    createSessionToken () {
      sessionToken = nanoid()
      this.$store.dispatch('api/createSessionToken', sessionToken)
    },

    focusEmail () {
      this.$nextTick(() => {
        const element = this.$refs.email
        if (!element) { return }
        element.focus()
      })
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.clearErrors()
        this.createSessionToken()
        this.$store.commit('shouldExplicitlyHideFooter', true)
        this.focusEmail()
      } else {
        this.$store.commit('shouldExplicitlyHideFooter', false)
      }
    },
    'loading.signUpOrIn' (value) {
      this.$emit('loading', value)
    }
  }
}
</script>

<style lang="stylus">
dialog.sign-up-or-in
  left initial
  right 8px
  overflow auto
  @media(max-height 750px)
    // for ios keyboard input
    top -50px !important
  .reset-form
    margin-top 10px
  p,
  .badge
    margin-bottom 10px
  .success-message
    margin-bottom 0
  .forgot-password
    .badge
      margin 0
      margin-top 10px
  button
    span
      font-weight normal
</style>
