<template lang="pug">
dialog.import-arena-channel.narrow(v-if="visible" :open="visible" @click.stop ref="dialog")
  //-  TODO QA height on <400px screens, make scrollable
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
          input(type="url" placeholder="Are.na channel url" required @input="clearErrors" v-model="channelUrl")
          button.borderless.clear-input-wrap(@mouseup="clearForm" @touchend="clearForm")
            img.icon(src="@/assets/add.svg")

        .badge.danger.badge-with-url(v-if="error.invalidUrl") Url should look like
          br
          span https://www.are.na/user/channel-name
        .badge.danger(v-if="error.channelNotFound") Could not find {{error.channelNotFoundName}} on Are.na
        .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

        button(:class="{active: loading}" type="submit")
          img.icon.arena(src="@/assets/arena.svg")
          span Import
          Loader(:visible="loading")

    section
      button(@click="forgetArenaAccessToken") Forget Me

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import nanoid from 'nanoid'

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
      const channelPath = this.channelPathFromUrl()
      if (!channelPath) {
        this.error.invalidUrl = true
        this.loading = false
        return
      }
      let channel = await this.getChannelContents(channelPath)
      this.createSpace(channel)
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
    channelPathFromUrl () {
      const urlPattern = new RegExp(/(http[s]?:\/\/)?[^\s(["<,>]*\.[^\s.[",><]+/igm)
      const urls = this.channelUrl.match(urlPattern)
      if (!urls) { return }
      const url = utils.normalizeUrl(urls[0])
      const index = url.lastIndexOf('/') + 1
      return url.slice(index, url.length)
    },
    async getChannelContents (channel) {
      try {
        const maxBlocks = 100
        // TODO tell ui that it'll get the latest 100 blocks
        const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
        headers.append('Authorization', this.arenaAccessToken)
        const options = {
          method: 'GET',
          headers
        }
        // TODO ASK: get multiple pages, hard limit of blocks, in one req?
        const response = await fetch(`https://api.are.na/v2/channels/${channel}?per=${maxBlocks}`, options)
        if (response.status !== 200) {
          throw { response, status: response.status }
        }
        return response.json()
      } catch (error) {
        console.error(error)
        if (error.status === 404) {
          this.error.channelNotFoundName = channel
          this.error.channelNotFound = true
        } else {
          this.error.unknownServerError = true
        }
      }
    },
    createSpace (channel) {
      const cardWidth = '235px'
      const cardSpacing = '10px'
      const viewportWidth = this.$store.state.viewportWidth
      let space = {
        id: nanoid(),
        name: channel.title,
        cards: [],
        connections: [],
        connectionTypes: [],
        cacheDate: new Date().getTime(),
        removedCards: []
      }
      const meta = {
        id: nanoid(),
        x: 20,
        y: 50,
        z: 0,
        name: `${this.channelUrl} ${channel.metadata.description}`
      }
      channel.contents.forEach(block => {
        const card = this.createCard(block)
        console.log(card)
      })
      space.cards.push(meta)
      console.log('🔮', cardWidth, cardSpacing, channel, viewportWidth, space)
      // console.log(space)
    },
    createCard (block) {
      // which type of block
      // if block type X(eg attachment/image, text, link, embed/video) then turn into createXcard
      if (block.class === 'Link') {
        console.log('🌍 link', block)
      } else if (block.class === 'Text') {
        console.log('🃏 text', block)
      } else if (block.class === 'Media') {
        console.log('🍆 media', block)
      } else if (block.class === 'Attachment') {
        console.log('♨️ attachment/other', block)
      } else {
        console.log('🌷 image, gifs', block)
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
