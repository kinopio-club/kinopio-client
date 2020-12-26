<template lang="pug">
dialog.narrow.space-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{top: dialogPositionTop}")
  template(v-if="parentIsCardDetails && !currentUserIsSignedIn")
    section
      p
        span To link to a space,
        span.badge.info you need to Sign Up or In
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In

  template(v-else)
    section.info-section(v-if="parentIsCardDetails && !search")
      p
        img.icon.search(src="@/assets/search.svg")
        span Type to search spaces {{search}}
    section.results-section
      Loader(:visible="loading")
      SpaceList(
        v-if="filteredSpaces.length"
        :hideFilter="hideFilter"
        :spaces="filteredSpaces"
        :showUserIfCurrentUserIsCollaborator="showUserIfCurrentUserIsCollaborator"
        :selectedSpace="selectedSpace"
        @selectSpace="selectSpace"
        :search="search"
      )
      .error-container(v-if="!filteredSpaces.length && !loading")
        User(:user="activeUser" :isClickable="false" :key="activeUser.id")
        span(v-if="activeUserIsCurrentUser && search") has no spaces matching {{search}}
        span(v-else-if="activeUserIsCurrentUser") has no spaces
        span(v-else) has no public spaces
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

import fuzzy from 'fuzzy'

export default {
  name: 'SpacePicker',
  components: {
    Loader,
    SpaceList: () => import('@/components/SpaceList.vue'),
    User: () => import('@/components/User.vue')
  },
  props: {
    visible: Boolean,
    selectedSpace: Object,
    shouldExcludeCurrentSpace: Boolean,
    userSpaces: Array,
    user: Object,
    loading: Boolean,
    showUserIfCurrentUserIsCollaborator: Boolean,

    parentIsCardDetails: Boolean,
    position: Object,
    search: String,
    cursorPosition: Number
  },
  data () {
    return {
      spaces: []
    }
  },
  computed: {
    maxHeight () {
      const favoritesDialog = document.querySelector('dialog.favorites')
      let height = 120
      if (favoritesDialog) {
        const dialogHeight = favoritesDialog.offsetHeight
        if (dialogHeight > 250) { height = dialogHeight }
      } else {
        return undefined
      }
      return height
    },
    activeUser () {
      const currentUser = this.$store.state.currentUser
      return this.user || currentUser
    },
    hideFilter () {
      if (this.parentIsCardDetails) {
        return true
      } else {
        return false
      }
    },
    activeUserIsCurrentUser () {
      const currentUser = this.$store.state.currentUser
      return this.activeUser.id === currentUser.id
    },
    dialogPositionTop () {
      if (this.position) {
        return this.position.top + 'px'
      } else {
        return undefined
      }
    },
    filteredSpaces () {
      if (!this.parentIsCardDetails) { return this.spaces }
      let spaces = this.spaces.filter(space => {
        return space.name !== this.search
      })
      const options = {
        pre: '',
        post: '',
        extract: (item) => {
          let name = item.name || ''
          return name
        }
      }
      const filtered = fuzzy.filter(this.search, spaces, options)
      spaces = filtered.map(item => item.original)
      return spaces
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    excludeCurrentSpace () {
      if (!this.shouldExcludeCurrentSpace) { return }
      const currentSpace = this.$store.state.currentSpace
      this.spaces = this.spaces.filter(space => space.id !== currentSpace.id)
    },
    updateSpaces () {
      if (this.userSpaces) {
        this.spaces = this.userSpaces
      } else {
        this.spaces = cache.getAllSpaces()
        this.updateWithRemoteSpaces()
      }
      this.excludeCurrentSpace()
      this.checkIfShouldFilterSpacesBySearch()
    },
    checkIfShouldFilterSpacesBySearch () {
      if (!this.parentIsCardDetails) { }
    },
    async updateWithRemoteSpaces () {
      if (!this.spaces.length) {
        this.loading = true
      }
      const spaces = await this.$store.dispatch('api/getUserSpaces')
      this.loading = false
      if (!spaces) { return }
      this.spaces = spaces
      this.excludeCurrentSpace()
    },
    selectSpace (space) {
      this.$emit('selectSpace', space)
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'SpacePicker.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.updateSpaces()
          this.scrollIntoView()
        }
      })
    },
    userSpaces (userSpaces) {
      this.updateSpaces()
    }
  }
}
</script>

<style lang="stylus">
.space-picker
  .results-section
    padding-top 4px
    @media(max-height 700px)
      max-height 40vh
  .error-container
    padding 4px
    display flex
    align-items center
    .user
      margin-right 6px
  .info-section
    padding-bottom 4px
</style>
