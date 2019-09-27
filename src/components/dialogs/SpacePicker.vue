<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p yolo
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import cache from '@/cache.js'

export default {
  name: 'SpacePicker',
  props: {
    visible: Boolean,
    selectedSpace: Object
  },
  data () {
    return {
      spaces: []
    }
  },
  // computed: {
  // },
  methods: {
    select (space) {
      this.$emit('selectSpace', space)
    },
    updateSpaces () {
      this.spaces = cache.getAllSpaces()
    },
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
          this.updateSpaces()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
