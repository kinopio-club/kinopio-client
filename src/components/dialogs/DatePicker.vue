<template lang="pug">
dialog.narrow.date-picker(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  section(v-if="title")
    // img moonphase of current selected date
    p {{title}}
  section
    input(type="date")
    // initial input val = date
    // on change: emit new date
  //- show moonphase , w moonphase name, kind of an explanation "the moonphase for this date is ..."
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
// import utils from '@/utils.js'

export default {
  name: 'DatePicker',
  props: {
    visible: Boolean,
    date: Object,
    title: String
  },
  data () {
    return {
    }
  },
  computed: {
  },
  methods: {
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        if (!element) { return }
        const isTouchDevice = this.$store.state.isTouchDevice
        scrollIntoView.scroll(element, isTouchDevice)
      })
    }
  },
  watch: {
    visible (visible) {
      this.scrollIntoView()
    }
  }
}
</script>

<style lang="stylus">
.date-picker
  input
    margin-bottom 0
</style>
