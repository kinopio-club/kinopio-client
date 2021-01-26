
<template lang="pug">
dialog.narrow.update-email(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Update Email
  section
    template(v-if="!currentUserIsSignedIn")
      p After you sign up you'll be able to update your email here
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    template(v-else)
      form(@submit.prevent="updateEmail")
      input(type="text" placeholder="Email" required autocomplete="email" v-model="email")
      button(type="submit" :class="{active : loading}")
        span Update
        Loader(:visible="loading")
    //- status
    .row(v-if="success")
      span.badge.success Email Changed
    .row(v-if="error")
      span.badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
</template>

<script>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UpdateEmail',
  components: {
    Loader
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
      error: false
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
      this.$store.dispatch('closeAllDialogs', 'UpdateEmail.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    async updateEmail () {
      if (this.loading) { return }
      if (!this.email) { return }
      this.loading = true
      // const response = await this.$store.dispatch('api/signIn', { email, password })
      // const result = await response.json()
      // this.loading = false

      // if (this.isSuccess(response)) {
      //      this.clearStatus()
      //   // show success
      // } else {
      //      this.clearStatus()
      //   this.error = true
      // }
    },
    isSuccess (response) {
      const success = [200, 201, 202, 204]
      return Boolean(success.includes(response.status))
    },
    clearStatus () {
      this.error = false
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
  max-height calc(100vh - 190px)
  overflow auto
  .row
    margin-top 10px
</style>
