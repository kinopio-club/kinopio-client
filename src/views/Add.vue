<template lang="pug">
main.add-page
  section(v-if="!currentUserIsSignedIn")

    //- TODO move to bottom?
    .row
      .badge.info Sign in to use
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Server error
      .badge.danger(v-if="error.signInCredentials") Incorrect email or password
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes

    //- sign in form
    form(@submit.prevent="signIn")
      input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      input(type="password" placeholder="Password" required v-model="password" @input="clearErrors")
      .row
        button(type="submit" :class="{active : loading.signIn}")
          span Sign In
          Loader(:visible="loading.signIn")

  AddToInbox(:visible="currentUserIsSignedIn")
</template>

<script>
import Loader from '@/components/Loader.vue'
import AddToInbox from '@/components/AddToInbox.vue'

let processQueueIntervalTimer

export default {
  name: 'AddPage',
  components: {
    Loader,
    AddToInbox
  },
  created () {
    window.document.title = 'Add to Inbox'
  },
  mounted () {
    this.initUser()
    // retry failed sync operations every 5 seconds
    processQueueIntervalTimer = setInterval(() => {
      this.$store.dispatch('api/processQueueOperations')
    }, 5000)
  },
  beforeUnmount () {
    clearInterval(processQueueIntervalTimer)
  },
  data () {
    return {
      email: '',
      password: '',
      loading: {
        signIn: false
      },
      error: {
        unknownServerError: false,
        // sign in
        tooManyAttempts: false,
        signInCredentials: false
      }
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    async initUser () {
      this.$store.dispatch('currentUser/init')
    },
    clearErrors () {
      this.error.unknownServerError = false
      this.error.signInCredentials = false
      this.tooManyAttempts = false
    },

    // sign in

    isSuccess (response) {
      const success = [200, 201, 202, 204]
      return Boolean(success.includes(response.status))
    },
    handleSignInErrors (response) {
      this.loading.signIn = false
      this.error.signInCredentials = false
      this.error.tooManyAttempts = false
      this.error.unknownServerError = false
      if (!response) {
        this.error.unknownServerError = true
        return
      }
      if (response.status === 401) {
        this.error.signInCredentials = true
      } else if (response.status === 429) {
        this.error.tooManyAttempts = true
      } else {
        this.error.unknownServerError = true
      }
    },
    async signIn (event) {
      if (this.loading.signIn) { return }
      const email = event.target[0].value.toLowerCase()
      const password = event.target[1].value
      this.loading.signIn = true
      const response = await this.$store.dispatch('api/signIn', { email, password })
      const result = await response.json()
      this.loading.signIn = false
      if (this.isSuccess(response)) {
        this.$store.commit('currentUser/updateUser', result)
        this.initUser()
      } else {
        this.handleSignInErrors(result)
      }
    }

  }
}
</script>

<style lang="stylus">
main.add-page
  padding 8px
  margin-top 2px
  height 100vh
  section
    position relative
    display block
    max-width 250px
  .loader
    margin-left 5px
  .badge
    .loader
      margin-right 0

  .sign-in
    background var(--secondary-background)
    form
      margin-top 10px
    input
      margin-bottom 10px
    button
      margin 0
  a
    color var(--primary)
    text-decoration none

  .row
    margin-bottom 10px
    display flex
    > input
      margin-bottom 0
    &:last-child
      margin-bottom 0

  .button-wrap + .button-wrap
    margin-left 6px

</style>
