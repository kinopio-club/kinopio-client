<template lang="pug">
dialog.narrow(v-if="visible" :open="visible")
  section
    p Background
  section
    .row
      p yoyoyoyo,
    .row
      button
        img.icon.cancel(src="@/assets/add.svg")
        span Clear
      button Upload

</template>

<script>
// import cache from '@/cache.js'
// import utils from '@/utils.js'

export default {
  name: 'Background',
  props: {
    visible: Boolean
  },
  // data () {
  //   return {
  //     queue: []
  //   }
  // },
  computed: {
    background () {
      return 'yoyo' // get/set v-model
    }
  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       this.queue = cache.queue()
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
</style>
