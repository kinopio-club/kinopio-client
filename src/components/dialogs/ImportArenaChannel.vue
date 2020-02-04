<template lang="pug">
dialog.import-arena-channel.narrow(v-if="visible" :open="visible" @click.stop ref="dialog")
  //-  height on <400px screens, make scrollable
  section
    p Import Are.na Channel

  template(v-if="!arenaAccessToken")
    section
      p To import channels you need to connect your Are.na account to Kinopio
      .button-wrap
        a(:href="authorizeUrl")
          button
            img.icon.arena(src="@/assets/arena.svg")
            span Authorize Kinopio

  template(v-if="arenaAccessToken")
    section
      form(@submit.prevent="importChannel")
        .input-wrap
          input(placeholder="Are.na channel url" required @input="clearErrors" v-model="channelUrl")
          button.borderless.clear-input-wrap(@click="clearForm")
            img.icon(src="@/assets/add.svg")

        .badge.danger.badge-with-url(v-if="error.invalidUrl") Url should look like
          br
          span https://www.are.na/user/channel-name
        .badge.danger(v-if="error.channelNotFound") Could not find {{error.channelNotFoundName}} on Are.na

        button(:class="{active: loading}")
          img.icon.arena(src="@/assets/arena.svg")
          span Import
          Loader(:visible="loading")

    section
      button(@click="forgetArenaAccessToken") Forget Me

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

let arena = {}
// arena apps registered to hi@kinopio.club
if (process.env.NODE_ENV === 'development') {
  arena = {
    clientId: '19f13b17093a5f1c9b227426cbb50571c18ffe50855a7e5f98dafb71f10d71f8',
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob'
  }
} else {
  arena = {
    clientId: 'adadc4aae0148aa84b14c18ce44392a33d1e564996bfcd1cf44d64ca6324c734',
    redirectUri: 'https://api.kinopio.club'
  }
}

export default {
  name: 'ImportArenaChannel',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      channelUrl: '',
      loading: false,
      error: {
        invalidUrl: false,
        channelNotFound: false,
        channelNotFoundName: '',
        unknownServerError: false
      }
    }
  },
  computed: {
    userIsSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    },
    authorizeUrl () {
      let redirectUri
      if (this.userIsSignedIn && process.env.NODE_ENV === 'production') {
        const userId = this.$store.state.currentUser.id
        redirectUri = `${arena.redirectUri}/update-arena-access-token/${userId}`
      }
      return `http://dev.are.na/oauth/authorize?client_id=${arena.clientId}&redirect_uri=${redirectUri || arena.redirectUri}&response_type=code`
    },
    arenaAccessToken () {
      return this.$store.state.currentUser.arenaAccessToken
    }
  },
  methods: {
    forgetArenaAccessToken () {
      this.$store.dispatch('currentUser/arenaAccessToken', '')
    },
    async importChannel () {
      if (this.loading) { return }
      this.loading = true
      const channel = this.channelFromUrl()
      if (!channel) {
        this.error.invalidUrl = true
        this.loading = false
        return
      }
      const contents = await this.getChannelContents(channel)
      console.log('🔮', contents)

      // make the new space (either on server or here on client, whoever is doing the call)

      // then (may be redundant)

      // this.channelUrl = ''
      this.loading = false
    },
    clearErrors () {
      for (const errorType in this.error) {
        this.error[errorType] = false
      }
    },
    clearForm () {
      this.channelUrl = ''
      this.clearErrors()
    },
    channelFromUrl () {
      const urlPattern = new RegExp(/(http[s]?:\/\/)?[^\s(["<,>]*\.[^\s.[",><]+/igm)
      const urls = this.channelUrl.match(urlPattern)
      if (!urls) { return }
      const url = utils.normalizeUrl(urls[0])
      const index = url.lastIndexOf('/') + 1
      return url.slice(index, url.length)
    },

    async getChannelContents (channel) {
      try {
        console.log('🍄', this.channelUrl, channel, this.arenaAccessToken)
        const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
        headers.append('Authorization', this.arenaAccessToken)
        const options = {
          method: 'GET',
          headers
        }
        const response = await fetch(`https://api.are.na/v2/channels/${channel}/contents`, options)
        if (response.statusCode !== 200) {
          throw { response, status: response.status }
        }
        console.log('🌹', response.body)
      } catch (error) {
        console.warn(error)
        // this.loading = false
        if (error.status === 404) {
          this.error.channelNotFoundName = channel
          this.error.channelNotFound = true
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.import-arena-channel
  .arena
    width 18px
  .badge
    margin-bottom 10px
  .badge-with-url
    word-break break-all
  .input-wrap
    display flex
  // form
  //   margin-top 10px
</style>
