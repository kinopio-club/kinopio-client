<template lang="pug">
section.invite
  .row
    span Invite
  Loader(:visible="loading")
  template(v-if="!loading && collaboratorKey")
    .row
      .url-textarea {{url}}
      .input-button-wrap(@click.left="copyUrl")
        button.small-button
          img.icon.copy(src="@/assets/copy.svg")
          span Invite URL
  //- Error
  template(v-if="!loading && !collaboratorKey")
    .row
      .badge.danger シ_ _)シ Something went wrong
    .row
      button(@click="updateCollaboratorKey") Try Again
  //- View and Edit Permissions
  .row
    template(v-if="spaceIsPrivate")
      span No account needed to view private spaces
    template(v-if="currentUserIsUpgraded")
      .badge.success.button-badge(v-if="!freeCardsInfoIsVisible" @click="toggleFreeCardsInfoVisible") Free Cards
      .badge.success.button-badge(v-if="freeCardsInfoIsVisible" @click="toggleFreeCardsInfoVisible") Because your account is upgraded, others can create cards here for free

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'Invite',
  props: {
    visible: Boolean
  },
  components: {
    Loader
  },
  mounted () {
    this.updateCollaboratorKey()
  },
  data () {
    return {
      url: '',
      loading: false,
      collaboratorKey: '',
      freeCardsInfoIsVisible: false
    }
  },
  computed: {
    ...mapState([
      'currentUser'
    ]),
    ...mapGetters([
    ]),
    spaceIsPrivate () { return this.$store.state.currentSpace.privacy === 'private' },
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded }
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
    shareUrl () {
      const data = {
        title: 'Kinopio Invite',
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
      const spaceName = utils.normalizeString(currentSpace.name)
      this.url = `${window.location.origin}/invite?spaceId=${spaceId}&collaboratorKey=${collaboratorKey}&name=${spaceName}`
    },
    toggleFreeCardsInfoVisible () {
      this.freeCardsInfoIsVisible = !this.freeCardsInfoIsVisible
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
  .url-textarea
    max-height 57px
</style>
