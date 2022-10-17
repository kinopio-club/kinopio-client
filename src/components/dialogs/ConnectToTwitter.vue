<template lang="pug">
dialog.narrow.dialog-name(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Connect to Twitter

  section(v-if="!currentUserIsSignedIn")
    p
      span.badge.info Sign Up or In
      span to save tweet threads to Kinopio
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  section(v-if="currentUserIsSignedIn")
    .row
      .badge.secondary @KinopioClub save
    .row
      p your twitter user name (input v-model)
    .row
      input(placeholder="@twitterUsername" v-model="username")
    //- p(v-if="isLoading")
    Loader(:visible="isLoading")
      //- .badge.success Ready to save threads
    //- .badge.error {{twitterUsername}} not found
    .row(v-if="currentTwitterUserIsVisible")
      p @{{currentTwitterUser.username}}

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'ConnectToTwitter',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      twitterUsername: '',
      isLoading: false,
      // isErrorTwitterUser: false,
      currentTwitterUser: {}
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    username: {
      get () {
        return this.twitterUsername
      },
      set (newValue) {
        this.twitterUsername = newValue
        if (!newValue) {
          this.$store.dispatch('currentUser/update', { twitterUsername: null })
        } else {
          this.updateTwitterUsername(newValue)
        }
      }
    },
    currentTwitterUserIsVisible () {
      return utils.objectHasKeys(this.currentTwitterUser)
    }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'ConnectToTwitter')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    async updateTwitterUsername (newValue) {
      this.isLoading = true
      newValue = newValue.replace('@', '')
      try {
        const result = await this.$store.dispatch('api/twitterUser', newValue)
        const data = result.data
        // const isUser = utils.objectHasKeys(data)

        console.log('💖', data)
        // if (isUser) {
        this.currentTwitterUser = data

        // } else {
        //   this.isTwitterUserError = true
        // }
        // TODO if result..user
        // dispatch currentUser/update
      } catch (error) {
        console.error('🚒 updateTwitterUsername', error)
      }
      this.isLoading = false
    },
    // clearErrors () {
    //   this.isErrorTwitterUser = false
    // },
    clearCurrentTwitterUser (user) {
      this.currentTwitterUser = {}
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        console.log('🍋🍋🍋🍋🍋🍋🍋🍋')
      }
    }
  }

}
</script>

<style lang="stylus">
// dialog.dialog-name
</style>
