<template lang="pug">
dialog.information(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :class="{narrow: narrow}")
  section
    p {{ title }}
  section
    p(v-html="message")

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'KeyboardShortcuts',
  props: {
    visible: Boolean,
    narrow: Boolean,
    title: String,
    message: String
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
      safariInfoIsVisible: false,
      cardInfoIsVisible: false,
      childCardInfoIsVisible: false,
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
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.information
  code
    background-color var(--secondary-background)
    margin 0
</style>
