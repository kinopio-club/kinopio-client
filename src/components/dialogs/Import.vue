<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Import
  section
    p To paste into other apps
    button
      span.badge txt
      span Card Names
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

export default {
  name: 'Import',
  props: {
    visible: Boolean
  },
  methods: {
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
