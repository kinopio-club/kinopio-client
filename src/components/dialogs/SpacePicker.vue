<template lang="pug">
dialog.narrow.space-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{top: dialogPositionTop}")
  template(v-if="parentIsCardDetails && !currentUserIsSignedIn")
    section
      p
        span To link to a space,
        span.badge.info you need to Sign Up or In
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
  //- New Space
  section.options(v-if="shouldShowNewSpace")
    .row
      button(@click="toggleNewSpaceIsVisible" :class="{ active: newSpaceIsVisible }")
        img.icon(src="@/assets/add.svg")
        span New Space
    template(v-if="newSpaceIsVisible")
      .row
        .button-wrap
        input(placeholder="name" ref="newSpaceName" v-model="newSpaceName" @keyup.space.prevent @keyup.escape.stop="toggleNewSpaceIsVisible" @keyup.stop @keyup.enter.exact="createNewSpace")
      .row
        button(@click="createNewSpace")
          span Create New Space
          Loader(:visible="isLoadingNewSpace")

  //- Type to Search
  section.info-section(v-if="parentIsCardDetails && !search")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to search spaces {{search}}
  //- Space List
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
      @focusBeforeFirstItem="handleFocusBeforeFirstItem"
    )
    .error-container(v-if="!filteredSpaces.length && !loading")
      User(:user="activeUser" :isClickable="false" :key="activeUser.id")
      span(v-if="activeUserIsCurrentUser && search") has no spaces matching {{search}}
      span(v-else-if="activeUserIsCurrentUser") has no spaces
      span(v-else) has no public spaces
</template>

<script>
import Loader from '@/components/Loader.vue'
import words from '@/data/words.js'
import newSpace from '@/data/new.json'
import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import fuzzy from '@/libs/fuzzy.js'
import dayjs from 'dayjs'
import sortBy from 'lodash-es/sortBy'

import { defineAsyncComponent } from 'vue'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})
const SpaceList = defineAsyncComponent({
  loader: () => import('@/components/SpaceList.vue')
})

export default {
  name: 'SpacePicker',
  components: {
    Loader,
    SpaceList,
    User
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
    cursorPosition: Number,
    shouldShowNewSpace: Boolean
  },
  data () {
    return {
      isLoading: false,
      spaces: [],
      newSpaceIsVisible: false,
      newSpaceName: '',
      isLoadingNewSpace: false
    }
  },
  computed: {
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
      let spaces = this.sortByRecentlyUpdated(this.spaces)
      spaces = spaces.filter(space => {
        const isHidden = space.isHidden
        return !space.isHidden
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
      spaces = filtered.map(item => {
        let result = utils.clone(item.original)
        result.matchIndexes = item.indices
        return result
      })
      return spaces
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    sortByRecentlyUpdated (spaces) {
      let sorted = sortBy(spaces, space => dayjs(space.updatedAt))
      sorted = sorted.reverse()
      return sorted
    },
    handleFocusBeforeFirstItem () {
      if (this.newSpaceIsVisible) { return }
      this.toggleNewSpaceIsVisible()
    },
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
    },
    async updateWithRemoteSpaces () {
      if (!this.spaces.length) {
        this.isLoading = true
      }
      const currentUser = this.$store.state.currentUser
      let spaces = await this.$store.dispatch('api/getUserSpaces')
      spaces = utils.AddCurrentUserIsCollaboratorToSpaces(spaces, currentUser)
      this.isLoading = false
      if (!spaces) { return }
      this.spaces = spaces
      this.excludeCurrentSpace()
    },
    selectSpace (space) {
      this.$emit('selectSpace', space)
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      utils.scrollIntoView({ element })
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    toggleNewSpaceIsVisible () {
      this.newSpaceIsVisible = !this.newSpaceIsVisible
      if (this.newSpaceIsVisible) {
        this.$nextTick(() => {
          this.focusNewSpaceNameInput()
        })
      }
    },
    async createNewSpace () {
      if (this.isLoadingNewSpace) { return }
      if (!this.newSpaceName) {
        this.newSpaceName = words.randomUniqueName()
      }
      const currentUser = this.$store.state.currentUser
      const user = { id: currentUser.id, color: currentUser.color, name: currentUser.name }
      this.isLoadingNewSpace = true
      let space = utils.clone(newSpace)
      space.name = this.newSpaceName
      space.id = nanoid()
      space.url = utils.url({ name: space.name, id: space.id })
      space.userId = user.id
      space.users.push(user)
      space.cards = []
      space.connections = []
      space.connectionTypes = []
      space = utils.newSpaceBackground(space, currentUser)
      space.background = space.background || consts.defaultSpaceBackground
      space = cache.updateIdsInSpace(space)
      console.log('🚚 create new space', space)
      if (this.currentUserIsSignedIn) {
        await this.$store.dispatch('api/createSpace', space)
      }
      this.isLoadingNewSpace = false
      this.selectSpace(space)
    },

    clearState () {
      this.newSpaceIsVisible = false
      this.newSpaceName = words.randomUniqueName()
    },
    focusNewSpaceNameInput () {
      const element = this.$refs.newSpaceName
      if (!element) { return }
      element.focus()
      element.setSelectionRange(0, 99999)
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        this.clearState()
        if (visible) {
          this.updateSpaces()
          this.scrollIntoView()
          this.isLoading = this.loading
        }
      })
    },
    userSpaces: {
      handler (userSpaces) {
        this.updateSpaces()
      },
      deep: true
    }
  }
}
</script>

<style lang="stylus">
.space-picker
  .results-section
    padding-top 4px
    @media(max-height 700px)
      max-height 50vh
    @media(max-height 400px)
      max-height 40vh
  .error-container
    padding 4px
    display flex
    align-items center
    .user
      margin-right 6px
  .info-section
    padding-bottom 4px
    border-top 0
  section.options
    margin 0
    width 100%
    padding-bottom 5px
    border-top none
</style>
