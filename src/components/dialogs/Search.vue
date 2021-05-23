<template lang="pug">
dialog.narrow.search(v-if="visible" :open="visible" ref="dialog")
  section
    p Search Space

</template>

<script>
// import cache from '@/cache.js'
// import utils from '@/utils.js'

export default {
  name: 'Search',
  props: {
    visible: Boolean
  },
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'updatePageSizes') {
  //       this.checkIfShouldBeOnRightSide()
  //     }
  //   })
  // },
  // data () {
  //   return {
  //     showOnRightSide: false
  //   }
  // },
  computed: {
    // currentUserIsSignedIn () {
    //   return Boolean(this.$store.getters['currentUser/isSignedIn'])
    // }
  },
  methods: {
  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       this.checkIfShouldBeOnRightSide()
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.search
  top 16px
</style>
