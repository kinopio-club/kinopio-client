<template lang="pug">
section.invite
  p Invite Collaborators
  section.subsection
    .row
      p
        .users
          User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
          User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
        span Invite to Edit
      button.small-button.tips-button.inline-button(@click="toggleTipsIsVisible" :class="{active: tipsIsVisible}")
        span Tips

    Loader(:visible="loading")
    template(v-if="!loading && collaboratorKey")
      .row
        .segmented-buttons
          button(@click.left="copyUrl")
            img.icon.copy(src="@/assets/copy.svg")
            span Copy Invite URL
          button(v-if="webShareIsSupported" @click="webShare")
            img.icon.share(src="@/assets/share.svg")
    //- Error
    template(v-if="!loading && !collaboratorKey")
      .row
        .badge.danger シ_ _)シ Something went wrong
      .row
        button(@click="updateCollaboratorKey") Try Again
    //- Tips
    .more-info(v-if="tipsIsVisible")
      template(v-if="spaceIsPrivate")
        .row
          p
            span No account is needed to view{{' '}}
            span.badge.danger private spaces
            span {{' '}}– but editing requires an account.
        hr
      .row
        p You'll both earn a{{' '}}
          span.badge.success $6 credit
          span when someone you invite signs up for a Kinopio account
      template(v-if="currentUserIsUpgraded")
        hr
        .row
          .badge.success
            span Because your account is upgraded, others can create cards here for free

</template>

<script>
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

import randomColor from 'randomcolor'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'Invite',
  props: {
    visible: Boolean
  },
  components: {
    Loader,
    User
  },
  mounted () {
    this.updateCollaboratorKey()
  },
  data () {
    return {
      url: '',
      loading: false,
      collaboratorKey: '',
      tipsIsVisible: false
    }
  },
  computed: {
    ...mapState([
      'currentUser'
    ]),
    ...mapGetters([
    ]),
    spaceIsPrivate () { return this.$store.state.currentSpace.privacy === 'private' },
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded },
    randomUser () {
      const luminosity = this.$store.state.currentUser.theme
      const color = randomColor({ luminosity })
      return { color }
    },
    webShareIsSupported () { return navigator.share }
  },
  methods: {
    async copyUrl (event) {
      this.$store.commit('clearNotificationsWithPosition')
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(this.url)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copyText', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
    },
    webShare () {
      const data = {
        title: `Invite to Edit`,
        text: this.spaceName,
        url: this.url
      }
      navigator.share(data)
    },
    async updateCollaboratorKey () {
      this.collaboratorKey = ''
      const space = this.$store.state.currentSpace
      this.loading = true
      const collaboratorKey = await this.$store.dispatch('api/getSpaceCollaboratorKey', space)
      this.collaboratorKey = collaboratorKey
      this.loading = false
      this.$store.commit('currentSpace/updateSpace', { collaboratorKey })
      this.updateInviteUrl(collaboratorKey)
    },
    updateInviteUrl (collaboratorKey) {
      const currentSpace = this.$store.state.currentSpace
      const spaceId = currentSpace.id
      const spaceName = currentSpace.name
      this.url = utils.inviteUrl({ spaceId, spaceName, collaboratorKey })
      console.log('🍇 invite url', this.url)
    },
    toggleTipsIsVisible () {
      this.tipsIsVisible = !this.tipsIsVisible
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
    }
  }
}
</script>

<style lang="stylus" scoped>
.invite
  user-select text
  .badge
    margin 0
    color var(--primary)
    vertical-align 0
  .users
    margin-right 5px
  .tips-button
    margin-left auto
    margin-top 0
    width auto
    cursor pointer
</style>
