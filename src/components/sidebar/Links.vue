<template lang="pug">
.links(v-if="visible")
  section
    p Backlinks
    Loader(:visible="loading" :isSmall="true")
      //- .button-wrap(v-if="userSpacesToggleShouldBeVisible" @click.left.prevent="toggleCurrentUserSpacesIsVisibleOnly" @keydown.stop.enter="toggleCurrentUserSpacesIsVisibleOnly")
      //-   label(:class="{ active: currentUserSpacesIsVisibleOnly }")
      //-     input(type="checkbox" v-model="currentUserSpacesIsVisibleOnly")
      //-     User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :isSmall="true")
  section.results-section(v-if="shouldShowSpaces" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="filteredSpaces"
      :showUser="true"
      @selectSpace="changeSpace"
      :parentIsPinned="parentIsPinned"
      :resultsSectionHeight="resultsSectionHeight"
      :parentDialog="parentDialog"
      :disableListOptimizations="true"
    )
  section.tips-section(v-else)
    section.subsection
      p Other spaces with cards that link to this space can be found here.
      p Type
        span {{' '}}
        span.badge.info /
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
    visible: Boolean,
    parentIsPinned: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateResultsSectionHeight()
      } else if (mutation.type === 'currentSpace/restoreSpace' && this.visible) {
        this.updateLinks()
      }
    })
  },
  mounted () {
    this.updateLinks()
    this.updateResultsSectionHeight()
  },
  data () {
    return {
      resultsSectionHeight: null,
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
    parentDialog () { return 'links' }
  },
  methods: {
    toggleCurrentUserSpacesIsVisibleOnly () {
      this.currentUserSpacesIsVisibleOnly = !this.currentUserSpacesIsVisibleOnly
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', space)
      this.$store.dispatch('closeAllDialogs')
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
      const links = await this.$store.dispatch('api/getCardsWithLinkToSpaceId', spaceId)
      this.loading = false
      this.prevSpaceId = spaceId
      if (!links) { return }
      if (!links.spaces.length) { return }
      if (links.spaces.length) {
        this.spaces = links.spaces
      }
    }, 350, { leading: true }),
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
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
  border-top 1px solid var(--primary-border)
  .button-wrap
    margin 0
  .tips-section
    border 0
    padding-top 0
  .subsection
    padding 4px
    border-radius var(--entity-radius)
  label
    .user
      vertical-align -3px
      transform translateY(-1px)
      margin-right 0
      .user-avatar
        width 17px
        height 16px
</style>
