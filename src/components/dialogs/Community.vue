<template lang="pug">
dialog.community(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click.stop="hideTemplates" :class="{ active: !templatesIsVisible }")
        span New Spaces
        //- Loader(:visible="loading.cards")

      button(@click.stop="showTemplates" :class="{ active: templatesIsVisible }")
        span Templates

  Templates(:visible="templatesIsVisible")

</template>

<script>
import Templates from '@/components/Templates.vue'

export default {
  name: 'Explore',
  components: {
    Templates
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      templatesIsVisible: false
    }
  },
  methods: {
    showTemplates () {
      this.templatesIsVisible = true
    },
    hideTemplates () {
      this.templatesIsVisible = false
    }
  }
}
</script>

<style lang="stylus">
.community
  max-height calc(100vh - 100px)
</style>
