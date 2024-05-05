<template lang="pug">
dialog.import-arena-channel.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Import Are.na Channel

  template(v-if="!arenaAccessToken")
    section
      p To import channels you need to connect your Are.na account to Kinopio
      .button-wrap
        a(:href="authorizeUrl")
          button(:class="{active: isAuthenticatingWithArena}")
            img.icon.arena(src="@/assets/arena.svg")
            span Authorize Kinopio
            Loader(:visible="isAuthenticatingWithArena")
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

  template(v-if="arenaAccessToken")
    section
      p Make a moodboard from the newest 100 blocks in a channel
      form(@submit.prevent="importChannel")
        .input-wrap
          input(type="url" placeholder="Are.na channel url" required @input="clearErrors" v-model="channelUrl")
          button.borderless.clear-input-wrap(@mouseup.left="clearForm" @touchend="clearForm")
            img.cancel.icon(src="@/assets/add.svg")

        .badge.danger.badge-with-url(v-if="error.invalidUrl") Url should look like
          br
          span https://www.are.na/user/channel-name
        .badge.danger(v-if="error.channelNotFound") Could not find {{error.channelNotFoundName}} on Are.na
        .badge.danger(v-if="error.unknownServerError") Are.na authentication failed, Please try again or contact support

        button(:class="{active: loading}" type="submit")
          img.icon.arena(src="@/assets/arena.svg")
          span Import
          Loader(:visible="loading")

    section
      button(@click.left="forgetArenaAccessToken") Forget Me

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'

let arena = {}
// arena apps registered to hi@kinopio.club
if (consts.isDevelopment) {
  arena = {
    clientId: '19f13b17093a5f1c9b227426cbb50571c18ffe50855a7e5f98dafb71f10d71f8',
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob'
  }
} else {
  arena = {
    clientId: 'adadc4aae0148aa84b14c18ce44392a33d1e564996bfcd1cf44d64ca6324c734',
    redirectUri: 'https://kinopio.club/update-arena-access-token'
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
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerArenaAuthenticationError') {
        this.error.unknownServerError = true
      }
    })
  },

  computed: {
    authorizeUrl () {
      if (this.isAuthenticatingWithArena) { return }
      return `http://dev.are.na/oauth/authorize?client_id=${arena.clientId}&redirect_uri=${arena.redirectUri}&response_type=code`
    },
    arenaAccessToken () { return this.$store.state.currentUser.arenaAccessToken },
    isAuthenticatingWithArena () { return this.$store.state.isAuthenticatingWithArena }
  },
  methods: {
    forgetArenaAccessToken () {
      this.$store.dispatch('currentUser/arenaAccessToken', '')
      this.$store.commit('addNotification', { message: 'Removed your Are.na access token from Kinopio', type: 'success' })
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
      await this.createSpace(channel)
      this.clearForm()
      this.loading = false
      this.$emit('updateSpaces')
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
        const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
        headers.append('Authorization', `Bearer ${this.arenaAccessToken}`)
        const options = {
          method: 'GET',
          headers
        }
        const response = await fetch(`https://api.are.na/v2/channels/${channel}?per=${maxBlocks}&sort=position&direction=desc`, options)
        if (response.status !== 200) {
          throw { response, status: response.status }
        }
        return response.json()
      } catch (error) {
        console.error('🚒', error)
        if (error.status === 404) {
          this.error.channelNotFoundName = channel
          this.error.channelNotFound = true
        } else {
          this.error.unknownServerError = true
        }
        this.loading = false
      }
    },
    trimName (name) {
      return name.substring(0, consts.maxCardLength)
    },
    async createSpace (channel) {
      let space = utils.emptySpace(nanoid())
      space.cacheDate = new Date().getTime()
      space.name = channel.title
      const metaCard = {
        id: nanoid(),
        x: 40,
        y: 100,
        z: channel.contents.length + 1,
        name: this.trimName(this.channelUrl),
        frameId: 2
      }
      space.cards.push(metaCard)
      channel.contents.forEach(block => {
        const currentIndex = space.cards.length
        const lastCard = space.cards[currentIndex - 1]
        const card = this.createCard(block, { currentIndex, lastCard })
        space.cards.push(card)
      })
      await this.importSpace(space)
    },
    async importSpace (space) {
      console.log('🌳 importSpace', space)
      try {
        cache.saveSpace(space)
        await this.$store.dispatch('api/createSpace', space)
        this.$store.dispatch('currentSpace/changeSpace', space)
        this.$store.commit('addNotification', { message: 'Are.na channel imported', type: 'success' })
        this.$store.dispatch('closeAllDialogs')
      } catch (error) {
        console.error('🚒 importSpace', error)
      }
    },
    createCard (block, position) {
      let card = { id: nanoid() }
      const type = block.class
      const title = block.title
      console.log('**', block, type)
      if (type === 'Link') {
        let url = block.image.display.url
        if (!utils.urlIsImage(url)) {
          url = block.image.original.url
        }
        card.name = `${url} ${block.source.url}`
      } else if (type === 'Text') {
        card.name = `${title} – ${block.content}`
      } else if (type === 'Media') {
        card.name = `${title} – ${block.image.original.url}`
      } else if (type === 'Attachment') {
        card.name = block.attachment.url
      } else if (type === 'Channel') {
        card.name = `${title} – https://are.na/${block.owner_slug}/${block.slug}`
      } else if (type === 'Image') {
        card.name = block.image.original.url
      } else {
        card.name = `${title} ${type}`
      }
      card.name = this.trimName(card.name)
      const { x, y, z } = this.cardPositions(position)
      card.x = x
      card.y = y
      card.z = z
      return card
    },

    cardPositions ({ currentIndex, lastCard }) {
      let x, y, z
      const startX = 40
      const startY = 50
      const cardWidth = 235
      let cardHeight = 235
      const cardMargin = 20
      const viewportWidth = this.$store.state.viewportWidth - (cardWidth + cardMargin)
      x = startX
      y = startY
      if (lastCard) {
        const currentRow = Math.floor((currentIndex * (cardWidth + cardMargin)) / viewportWidth)
        const lastCardRow = Math.floor(((currentIndex - 1) * (cardWidth + cardMargin)) / viewportWidth)
        x = lastCard.x + cardWidth + cardMargin + startX
        y = ((cardHeight + cardMargin) * currentRow) + startY
        if (lastCardRow !== currentRow) {
          x = startX
        }
      }
      z = currentIndex
      return { x, y, z }
    }
  }
}
</script>

<style lang="stylus">
.import-arena-channel
  .badge
    margin-bottom 10px
  .badge-with-url
    word-break break-all
  .input-wrap
    display flex
  form
    margin-top 10px
</style>
