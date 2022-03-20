<template lang="pug">
dialog.explore(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section.header
    .segmented-buttons
      button(@click.left.stop="hideTemplates" :class="{ active: !templatesIsVisible }")
        span Community
        Loader(:visible="loading")
      button(@click.left.stop="showTemplates" :class="{ active: templatesIsVisible }")
        span Templates

  Community(:visible="!templatesIsVisible" :loading="loading" :spaces="spaces" @updateCurrentSpace="updateCurrentSpace" :userShowInExploreDate="lastReadDate")
  Templates(:visible="templatesIsVisible")
</template>

<script>
import Templates from '@/components/Templates.vue'
import Community from '@/components/Community.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Explore',
  components: {
    Templates,
    Loader,
    Community
  },
  props: {
    visible: Boolean,
    preloadedSpaces: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      templatesIsVisible: false,
      loading: false,
      spaces: [],
      newSpaces: [],
      dialogHeight: null,
      lastReadDate: null
    }
  },
  methods: {
    showTemplates () {
      this.templatesIsVisible = true
    },
    hideTemplates () {
      this.templatesIsVisible = false
    },
    async updateSpaces () {
      if (this.loading) { return }
      if (this.templatesIsVisible) { return }
      this.loading = true
      if (!this.spaces.length) {
        this.spaces = this.preloadedSpaces || []
      }
      this.spaces = await this.$store.dispatch('api/getExploreSpaces')
      this.newSpaces = this.spaces
      this.loading = false
    },
    updateCurrentSpace () {
      const currentSpace = this.$store.state.currentSpace
      const spacesHasCurrentSpace = this.spaces.find(space => space.id === currentSpace.id)
      if (spacesHasCurrentSpace) {
        this.spaces = this.spaces.filter(space => space.id !== currentSpace.id)
      } else {
        this.spaces.unshift(currentSpace)
      }
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    updateUserShowInExploreUpdatedAt () {
      this.lastReadDate = this.$store.state.currentUser.showInExploreUpdatedAt.toString()
      const date = new Date()
      this.$store.dispatch('currentUser/showInExploreUpdatedAt', date)
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateSpaces()
        this.updateDialogHeight()
        this.updateUserShowInExploreUpdatedAt()
      }
    }
  }
}
</script>

<style lang="stylus">
.explore
  max-height calc(100vh - 100px)
.header
  border-bottom 1px solid var(--primary)
  border-bottom-left-radius 0
  border-bottom-right-radius 0
</style>
