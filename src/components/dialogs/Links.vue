<template lang="pug">
dialog.links.narrow(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Spaces that Link Here
  section.results-section(v-if="shouldShowSpaces" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    .button-wrap.user-button-wrap(@click="toggleCurrentUserSpacesIsVisibleOnly")
      button(:class="{ active: currentUserSpacesIsVisibleOnly }")
        User(:user="currentUser" :isClickable="false" :hideYouLabel="true")
        span Only

    SpaceList(:spaces="filteredSpaces" :showUser="true" @selectSpace="changeSpace")

  section(v-else-if="loading")
    Loader(:visible="loading")
  section(v-else)
    p Spaces with cards that link to this space can be found here.
    p Type
      span {{' '}}
      span.badge.secondary /
      span when editing a card to create links
</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

export default {
  name: 'Links',
  components: {
    Loader,
    SpaceList,
    User
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      resultsSectionHeight: null,
      dialogHeight: null,
      links: [],
      loading: false,
      spaces: [],
      prevSpaceId: '',
      currentUserSpacesIsVisibleOnly: false
    }
  },
  computed: {
    currentUser () { return this.$store.state.currentUser },
    shouldShowSpaces () {
      const spaces = this.spaces || []
      return !this.loading && spaces.length
    },
    filteredSpaces () {
      if (this.currentUserSpacesIsVisibleOnly) {
        return this.spaces.filter(space => space.userId === this.currentUser.id)
      } else {
        return this.spaces
      }
    }
  },
  methods: {
    toggleCurrentUserSpacesIsVisibleOnly () {
      this.currentUserSpacesIsVisibleOnly = !this.currentUserSpacesIsVisibleOnly
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
      this.$store.dispatch('closeAllDialogs', 'Links.closeAllDialogs')
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    async updateLinks () {
      const spaceId = this.$store.state.currentSpace.id
      if (this.prevSpaceId === spaceId) { return }
      this.spaces = []
      this.loading = true
      const links = await this.$store.dispatch('api/getCardsWithLinkToSpaceId', spaceId) || []
      if (links) {
        this.spaces = links.spaces
      }
      this.loading = false
      this.prevSpaceId = spaceId
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.updateLinks()
        this.updateResultsSectionHeight()
      }
    },
    loading (loading) {
      this.updateResultsSectionHeight()
    }
  }
}
</script>

<style lang="stylus">
.links
  @media(max-width 435px)
    left -100px
  .results-section
    border-top 1px solid var(--primary)
    padding-top 4px
  .user-button-wrap
    padding 4px
</style>
