<template lang="pug">
dialog.explore(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .segmented-buttons
      button(@click.left.stop="hideTemplates" :class="{ active: !templatesIsVisible }")
        span New Spaces
        Loader(:visible="loadingNewSpaces")
      button(@click.left.stop="showTemplates" :class="{ active: templatesIsVisible }")
        span Templates

  NewSpaces(:visible="!templatesIsVisible" :loading="loadingNewSpaces" :spaces="spaces" @updateCurrentSpace="updateCurrentSpace")
  Templates(:visible="templatesIsVisible")
</template>

<script>
import Templates from '@/components/Templates.vue'
import NewSpaces from '@/components/NewSpaces.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Explore',
  components: {
    Templates,
    Loader,
    NewSpaces
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
      loadingNewSpaces: false,
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
    async getNewSpaces () {
      if (this.loadingNewSpaces) { return }
      this.loadingNewSpaces = true
      this.spaces = await this.$store.dispatch('api/getNewSpaces')
      this.loadingNewSpaces = false
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
        this.getNewSpaces()
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
