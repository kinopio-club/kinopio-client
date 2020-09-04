<template lang="pug">
dialog.narrow(v-if="visible" :open="visible")
  section
    p yoyoyo

</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'Favorites',
  // components: {
  //   User: () => import('@/components/User.vue')
  // },
  props: {
    visible: Boolean
  },
  computed: {
  },
  methods: {
    // frameBadge (frame) {
    //   return {
    //     path: require(`@/assets/frames/${frame.badge}`)
    //   }
    // }
  }
}
</script>

<style lang="stylus">
</style>
