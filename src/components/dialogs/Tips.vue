<template lang="pug">
dialog.tips.narrow(v-if="visible" @click.stop :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Tips
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

export default {
  name: 'Tips',
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
  // computed: {
  // newStuffIsUpdated () { return this.$store.state.newStuffIsUpdated }
  // },
  methods: {
    scrollIntoView () {
      if (utils.isMobile()) { return }
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
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
      if (visible) {
        this.scrollIntoView()
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.tips
  left initial
  right 8px
  top 12px
</style>
