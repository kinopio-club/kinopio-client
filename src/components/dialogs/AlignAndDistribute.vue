<template lang="pug">
dialog.narrow.align-and-distribute(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p hello align and distribute
    button yolo
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

export default {
  name: 'AlignAndDistribute',
  props: {
    visible: Boolean
  },
  // data () {
  //   return {
  //     colors: []
  //   }
  // },
  // computed: {
  // },
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
.align-and-distribute
  left 32px
</style>
