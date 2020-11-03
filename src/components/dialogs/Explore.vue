<template lang="pug">
dialog.explore(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .segmented-buttons
      button(@click.left.stop="hideTemplates" :class="{ active: !templatesIsVisible }")
        span Community
        Loader(:visible="loading")
      button(@click.left.stop="showTemplates" :class="{ active: templatesIsVisible }")
        span Templates

  Community(:visible="!templatesIsVisible" :allSpacesIsVisible="allSpacesIsVisible" :loading="loading" :spaces="spaces" @updateCurrentSpace="updateCurrentSpace" @toggleAllSpacesIsVisible="toggleAllSpacesIsVisible")
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
    visible: Boolean
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
      allSpacesIsVisible: true,
      loading: false,
      spaces: [],
      dialogHeight: null
    }
  },
  methods: {
    showTemplates () {
      this.templatesIsVisible = true
    },
    hideTemplates () {
      this.templatesIsVisible = false
    },
    toggleAllSpacesIsVisible (value) {
      const prevValue = utils.clone(this.allSpacesIsVisible)
      this.allSpacesIsVisible = value
      if (prevValue === value) { return }
      this.spaces = []
      this.loading = false
      this.updateSpaces()
    },
    async updateSpaces () {
      if (this.loading) { return }
      if (this.templatesIsVisible) { return }
      this.loading = true
      if (this.allSpacesIsVisible) {
        this.spaces = await this.$store.dispatch('api/getNewSpaces')
      } else {
        this.spaces = await this.$store.dispatch('api/getBestOfSpaces')
      }
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
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateSpaces()
        this.updateDialogHeight()
      }
    }
  }

}
</script>

<style lang="stylus">
.explore
  max-height calc(100vh - 100px)

</style>
