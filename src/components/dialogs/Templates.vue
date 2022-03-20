<template lang="pug">
dialog.templates.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  ref="dialog"
  :style="{'max-height': dialogHeight + 'px'}"
)
  Templates(:visible="true")

</template>

<script>
import Templates from '@/components/Templates.vue'
import utils from '@/utils.js'

export default {
  name: 'Templates',
  components: {
    Templates
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
      dialogHeight: null
    }
  },
  methods: {
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      this.updateDialogHeight()
    }
  }
}
</script>

<style lang="stylus">
dialog.templates
  overflow auto
</style>
