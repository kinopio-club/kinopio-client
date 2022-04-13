<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.left.stop)
  section
    p PDF
  section
    Pdf()
</template>

<script>
import Pdf from '@/components/Pdf.vue'

export default {
  name: 'PdfDialogWrap',
  components: {
    Pdf
  },
  props: {
    visible: Boolean
  }
}
</script>

<style lang="stylus">
</style>
