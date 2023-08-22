<template lang="pug">
dialog.narrow.update-email(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Account
  template(v-if="!currentUserIsSignedIn")
    section
      p After you sign up you'll be able to update your email address here
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  template(v-else)
    section
      .row
        p Change Email
      form(@submit.prevent="updateEmail")
        input(type="text" placeholder="Email" required autocomplete="email" v-model="email")
        button(type="submit" :class="{active : loading}")
          span Change Email
          Loader(:visible="loading")
      p.badge.success(v-if="success.email")
        span Email Updated. A confirmation email has been sent to both your new and previous addresses
      p.badge.danger(v-if="error.unknownServerError.email")
        span (シ_ _)シ Something went wrong, Please try again or contact support
      p.badge.danger(v-else-if="error.accountAlreadyExists")
        span An account with this email already exists
    UpdatePassword
</template>

<script>
import utils from '@/utils.js'
import UpdatePassword from '@/components/UpdatePassword.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UpdateEmail',
  components: {
    Loader,
    UpdatePassword
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      dialogHeight: null,
      email: '',
      loading: false,
      success: false,
      error: {
        unknownServerError: false,
        accountAlreadyExists: false
      }
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    async updateEmail () {
      if (this.loading) { return }
      if (!this.email) { return }
      if (this.email === this.$store.state.currentUser.email) { return }
      this.clearStatus()
      this.loading = true
      const response = await this.$store.dispatch('api/updateEmail', this.email)
      const result = await response.json()
      if (this.isSuccess(response)) {
        this.success = true
        this.$store.commit('currentUser/email', this.email)
      } else {
        await this.handleErrors(result)
      }
      this.loading = false
    },
    isSuccess (response) {
      const success = [200, 201, 202, 204]
      return Boolean(success.includes(response.status))
    },
    async handleErrors (response) {
      if (!response) {
        this.error.unknownServerError = true
        return
      }
      if (response.type === 'unique violation') {
        this.error.accountAlreadyExists = true
      } else {
        this.error.unknownServerError = true
      }
    },
    clearStatus () {
      this.error.unknownServerError = false
      this.error.accountAlreadyExists = false
      this.success = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.email = this.$store.state.currentUser.email
        this.clearStatus()
      }
    }
  }
}
</script>

<style lang="stylus">
.update-email
  overflow auto
  @media(max-height 650px)
    top -200px !important

</style>
