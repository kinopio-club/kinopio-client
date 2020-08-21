<template lang="pug">
dialog.narrow.space-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section.results-section
    Loader(:visible="loading")
    SpaceList(v-if="spaces.length" :spaces="spaces" :showUserIfCurrentUserIsCollaborator="showUserIfCurrentUserIsCollaborator" :selectedSpace="selectedSpace" @selectSpace="selectSpace")
    .error-container(v-if="!spaces.length")
      User(:user="user" :isClickable="false" :key="user.id")
      span has no public spaces
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

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
    showUserIfCurrentUserIsCollaborator: Boolean
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
    }
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
    },
    async updateWithRemoteSpaces () {
      const spaces = await this.$store.dispatch('api/getUserSpaces')
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
</style>
