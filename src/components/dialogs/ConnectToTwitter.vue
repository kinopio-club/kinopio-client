<template lang="pug">
dialog.narrow.connect-to-twitter(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Connect to Twitter

  section(v-if="!currentUserIsSignedIn")
    p
      span.badge.info Sign Up or In
      span to save tweet threads to Kinopio
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  section(v-if="currentUserIsSignedIn")
    .row
      p Save threads to kinopio by replying to any tweet with
    .row
      p
        .badge.secondary @KinopioClub save

    .row
      template(v-if="currentTwitterUserIsVisible")
        img.twitter-profile-image(:src="currentTwitterUser.profile_image_url")
      template(v-else-if="isLoading")
        Loader(:visible="true")
      template(v-else)
        img.icon.tweet(src="@/assets/twitter.svg")
      textarea(placeholder="@twitterUsername" v-model="username" rows="1")

    .row
      .badge.danger(v-if="!currentTwitterUserIsVisible")
        span Inactive
      .badge.success(v-if="currentTwitterUserIsVisible")
        span Connected
        span(v-if="currentTwitterUser.name") {{' '}} to {{currentTwitterUser.name}}

  //- section
  //-   a(href="") Help
    //- TODO help page

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
          console.log('blank value')
          this.clearCurrentTwitterUser()
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
    async updateCurrentTwitterUser (username) {
      if (!username) { return }
      this.isLoading = true
      const result = await this.$store.dispatch('api/twitterUser', username)
      const data = result.data
      console.log('💖', data)
      this.currentTwitterUser = data
      this.isLoading = false
      return data
    },
    async updateTwitterUsername (newValue) {
      newValue = newValue.replace('@', '')
      try {
        const user = await this.updateCurrentTwitterUser(newValue)
        this.$store.dispatch('currentUser/update', { twitterUsername: user.username })
      } catch (error) {
        console.error('🚒 updateTwitterUsername', error)
      }
      this.isLoading = false
    },
    clearCurrentTwitterUser () {
      this.$store.dispatch('currentUser/update', { twitterUsername: '' })
      this.currentTwitterUser = {}
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        const username = this.$store.state.currentUser.twitterUsername
        this.twitterUsername = username
        this.updateCurrentTwitterUser(username)
      }
    }
  }

}
</script>

<style lang="stylus">
.connect-to-twitter
  .twitter-profile-image,
  .loader
    border-radius 100px
    width 24px
    margin-right 4px
  .loader
    width 29px
    height 24px
  .icon.tweet
    margin-right 6px
</style>
