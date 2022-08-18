<template lang="pug">
dialog.narrow.dialog-wrap(v-if="visible" :open="visible" @click.left.stop)
  section(v-if="title")
    p {{title}}
  section
    Pdf(:visible="pdfIsVisible")
</template>

<script>
import Pdf from '@/components/subsections/Pdf.vue'

export default {
  name: 'DialogWrap',
  components: {
    Pdf
  },
  props: {
    visible: Boolean,
    title: String,
    childName: String
  },
  data () {
    return {
      pdfIsVisible: false
    }
  },
  methods: {
    clearAll () {
      this.pdfIsVisible = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.clearAll()
        this.pdfIsVisible = this.childName === 'pdf'
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
