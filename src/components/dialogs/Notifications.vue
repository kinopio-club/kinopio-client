<template lang="pug">
dialog.narrow.notifications(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Notifications
  section
    Loader(:visible="loading")
    //- p blank slate

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Notifications',
  components: {
    Loader
  },
  props: {
    visible: Boolean
    // loading: Boolean,
    // notifications: Array
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
      dialogHeight: null,
      loading: false // to prop
    }
  },
  // computed: {
  // notifications () {
  //   return [
  //   {

  //   }
  //   ]
  // }
  // },
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
.notifications
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  section
    width 100%
</style>
