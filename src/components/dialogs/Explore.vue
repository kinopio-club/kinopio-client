<template lang="pug">
dialog.explore(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click.stop="hideTemplates" :class="{ active: !templatesIsVisible }")
        span New Spaces
        Loader(:visible="loadingNewSpaces")
      button(@click.stop="showTemplates" :class="{ active: templatesIsVisible }")
        span Templates

  NewSpaces(:visible="!templatesIsVisible" :loading="loadingNewSpaces" :spaces="spaces" @getNewSpaces="getNewSpaces")
  Templates(:visible="templatesIsVisible")
</template>

<script>
import Templates from '@/components/Templates.vue'
import NewSpaces from '@/components/NewSpaces.vue'
import Loader from '@/components/Loader.vue'

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
      if (this.loadingNewSpaces) { return }
      this.loadingNewSpaces = true
      this.spaces = await this.$store.dispatch('api/getNewSpaces')
      this.loadingNewSpaces = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.getNewSpaces()
      }
    }
  }

}
</script>

<style lang="stylus">
.explore
  max-height calc(100vh - 100px)

</style>
