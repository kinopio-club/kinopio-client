<template lang="pug">
dialog.links.narrow(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="isPinnedDialog" :class="{'is-pinned': isPinnedDialog}")
  section
    .title-row
      p Spaces that Link Here
      .button-wrap(@click.left="toggleIsPinnedDialog"  :class="{active: isPinnedDialog}" title="Pin dialog")
        button
          img.icon(src="@/assets/pin.svg")

  section.results-section(v-if="shouldShowSpaces" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    .button-wrap(v-if="userSpacesToggleShouldBeVisible" @click.left.prevent="toggleCurrentUserSpacesIsVisibleOnly" @keydown.stop.enter="toggleCurrentUserSpacesIsVisibleOnly")
      label(:class="{ active: currentUserSpacesIsVisibleOnly }")
        input(type="checkbox" v-model="currentUserSpacesIsVisibleOnly")
        User(:user="currentUser" :isClickable="false" :hideYouLabel="true")
    SpaceList(:spaces="filteredSpaces" :showUser="true" @selectSpace="changeSpace" :parentIsPinned="isPinnedDialog")

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

import debounce from 'lodash-es/debounce'

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
      if (mutation.type === 'currentSpace/restoreSpace' && this.visible) {
        this.updateLinks()
      }
      if (mutation.type === 'shouldHideFooter' && this.visible) {
        this.updateLinks()
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
    },
    userSpacesToggleShouldBeVisible () {
      const otherUserSpaces = this.spaces.filter(space => space.userId !== this.currentUser.id) || []
      let isOtherUserSpaces = Boolean(otherUserSpaces.length)
      const shouldForceToggleVisible = !isOtherUserSpaces && this.spaces.length
      if (isOtherUserSpaces || shouldForceToggleVisible) {
        return true
      } else {
        return false
      }
    },
    isPinnedDialog () { return this.$store.state.linksIsPinnedDialog }
  },
  methods: {
    toggleIsPinnedDialog () {
      const isPinned = !this.isPinnedDialog
      this.$store.commit('linksIsPinnedDialog', isPinned)
      if (!isPinned) {
        this.$store.dispatch('closeAllDialogs', 'Tags.toggleIsPinnedDialog')
      }
    },
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
      this.debouncedUpdateLinks()
    },
    debouncedUpdateLinks: debounce(async function () {
      const spaceId = this.$store.state.currentSpace.id
      const links = await this.$store.dispatch('api/getCardsWithLinkToSpaceId', spaceId) || []
      if (links) {
        this.spaces = links.spaces
      }
      this.loading = false
      this.prevSpaceId = spaceId
    }, 350, { leading: true }),
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
  .results-section
    border-top 1px solid var(--primary)
    padding-top 4px
  .button-wrap
    padding 4px
  label
    .user
      vertical-align -5px
      transform translateY(-1px)
      margin-right 5px
      .user-avatar
        width 17px
        height 16px
  &.is-pinned
    z-index 0
    left -86px
</style>
