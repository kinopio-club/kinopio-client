<template lang="pug">
dialog.narrow.update-email(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Update Email

//- in dialog success badge
</template>

<script>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UpdateEmail',
  components: {
    Loader
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
  computed: {
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
.update-email
  max-height calc(100vh - 190px)
  overflow auto
  // .row
  //   margin-top 10px
</style>
