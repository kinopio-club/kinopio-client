<template lang="pug">
dialog.community(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click.stop="hideTemplates" :class="{ active: !templatesIsVisible }")
        span New Spaces
        Loader(:visible="loadingNewSpaces")
      button(@click.stop="showTemplates" :class="{ active: templatesIsVisible }")
        span Templates

  CommunitySpaces(:visible="!templatesIsVisible" :loading="loadingNewSpaces" :spaces="spaces" @getNewSpaces="getNewSpaces")
  Templates(:visible="templatesIsVisible")
</template>

<script>
import Templates from '@/components/Templates.vue'
import CommunitySpaces from '@/components/CommunitySpaces.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'Explore',
  components: {
    Templates,
    Loader,
    CommunitySpaces
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      templatesIsVisible: false,
      loadingNewSpaces: false,
      spaces: []
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
      this.loadingNewSpaces = true
      const newSpaces = await this.$store.dispatch('api/getNewSpaces')
      this.loadingNewSpaces = false
      this.spaces = newSpaces
      console.log('🍄 new spaces', this.spaces)
    }
  },
  watch: {
    visible (visible) {
      if (this.spaces.length || this.loadingNewSpaces) { return }
      this.getNewSpaces()
    }
  }

}
</script>

<style lang="stylus">
.community
  max-height calc(100vh - 100px)
</style>
